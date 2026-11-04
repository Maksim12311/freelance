-- No Reply → Credit Back (72h customer response window)
-- Platform digital feature only — does not process student-to-student service payments.
-- Paid applications stay disabled by default until legally approved.

-- ---------------------------------------------------------------------------
-- Applications: response window + refund markers
-- ---------------------------------------------------------------------------
alter table public.applications
  add column if not exists response_deadline_at timestamptz,
  add column if not exists customer_responded_at timestamptz,
  add column if not exists customer_response_kind text
    check (
      customer_response_kind is null
      or customer_response_kind in ('message', 'accept', 'reject')
    ),
  add column if not exists awaiting_customer_response boolean not null default false,
  add column if not exists credit_refunded_at timestamptz,
  add column if not exists credit_refund_ledger_id uuid,
  add column if not exists customer_deadline_reminder_sent_at timestamptz;

comment on column public.applications.customer_response_kind is
  'Explicit customer response. Viewing an application does not count.';
comment on column public.applications.awaiting_customer_response is
  'True when a credit/fee was spent and customer has not yet accepted, rejected, or messaged.';

create index if not exists applications_credit_back_due_idx
  on public.applications (response_deadline_at)
  where awaiting_customer_response = true
    and credit_refunded_at is null
    and customer_responded_at is null;

create index if not exists applications_credit_back_reminder_idx
  on public.applications (response_deadline_at)
  where awaiting_customer_response = true
    and customer_deadline_reminder_sent_at is null
    and customer_responded_at is null
    and credit_refunded_at is null;

-- ---------------------------------------------------------------------------
-- Immutable credit ledger (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.application_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  credit_id uuid references public.application_credits (id) on delete set null,
  payment_id uuid references public.application_payments (id) on delete set null,
  entry_type text not null
    check (entry_type in (
      'grant',
      'consume',
      'refund_no_reply',
      'admin_adjust',
      'purchase'
    )),
  amount integer not null check (amount <> 0),
  balance_after integer,
  idempotency_key text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint application_credit_ledger_idempotency unique (idempotency_key)
);

create index if not exists application_credit_ledger_profile_idx
  on public.application_credit_ledger (profile_id, created_at desc);

create index if not exists application_credit_ledger_application_idx
  on public.application_credit_ledger (application_id);

do $$ begin
  alter table public.applications
    add constraint applications_credit_refund_ledger_id_fkey
    foreign key (credit_refund_ledger_id)
    references public.application_credit_ledger (id)
    on delete set null;
exception when duplicate_object then null;
end $$;

alter table public.application_credit_ledger enable row level security;

drop policy if exists application_credit_ledger_select on public.application_credit_ledger;
create policy application_credit_ledger_select on public.application_credit_ledger
  for select using (profile_id = auth.uid() or public.is_admin());

-- Inserts are service-role / security-definer only (no direct client insert policy).
-- Admins may insert for manual adjustments.
drop policy if exists application_credit_ledger_admin_insert on public.application_credit_ledger;
create policy application_credit_ledger_admin_insert on public.application_credit_ledger
  for insert with check (public.is_admin());

-- No UPDATE / DELETE policies → immutable for authenticated roles.

-- ---------------------------------------------------------------------------
-- Platform settings: response window (hours)
-- ---------------------------------------------------------------------------
insert into public.pricing_settings (key, amount_eur, description, is_enabled, metadata)
values (
  'application_response_window_hours',
  0,
  'Hours a customer has to respond before a spent application credit is returned',
  true,
  '{"hours": 72, "reminder_hours_before": 24}'::jsonb
)
on conflict (key) do nothing;

-- Keep paid applications OFF until legally approved.
update public.pricing_settings
set
  is_enabled = false,
  description = coalesce(
    description,
    'Standard specialist application fee'
  ) || ' (disabled until legal approval)',
  metadata = coalesce(metadata, '{}'::jsonb) || '{"disabled_until_legal_approval": true}'::jsonb,
  updated_at = timezone('utc', now())
where key = 'application_fee'
  and is_enabled = true;

-- ---------------------------------------------------------------------------
-- Helper: mark customer response (message | accept | reject). Viewing excluded.
-- ---------------------------------------------------------------------------
create or replace function public.mark_application_customer_response(
  p_application_id uuid,
  p_kind text,
  p_actor_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  app record;
  owner_id uuid;
begin
  if p_kind not in ('message', 'accept', 'reject') then
    raise exception 'invalid response kind';
  end if;

  select a.*, r.owner_id as request_owner_id
  into app
  from public.applications a
  join public.requests r on r.id = a.request_id
  where a.id = p_application_id
  for update of a;

  if not found then
    return false;
  end if;

  owner_id := app.request_owner_id;

  if p_actor_id is distinct from owner_id and not public.is_admin() then
    raise exception 'only the customer (request owner) can record a response';
  end if;

  -- Idempotent: already responded
  if app.customer_responded_at is not null then
    return true;
  end if;

  -- After refund, still record response for audit but no credit impact
  update public.applications
  set
    customer_responded_at = timezone('utc', now()),
    customer_response_kind = p_kind,
    awaiting_customer_response = false,
    status = case
      when p_kind = 'accept' then 'accepted'::application_status
      when p_kind = 'reject' then 'declined'::application_status
      else status
    end,
    updated_at = timezone('utc', now())
  where id = p_application_id;

  return true;
end;
$$;

revoke all on function public.mark_application_customer_response(uuid, text, uuid) from public;
grant execute on function public.mark_application_customer_response(uuid, text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Refund one credit for unanswered paid applications (idempotent via ledger).
-- ---------------------------------------------------------------------------
create or replace function public.refund_application_credit_no_reply(
  p_application_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  app record;
  existing_ledger uuid;
  new_credit_id uuid;
  ledger_id uuid;
  idem_key text;
begin
  idem_key := 'no_reply_refund:' || p_application_id::text;

  select id into existing_ledger
  from public.application_credit_ledger
  where idempotency_key = idem_key;

  if existing_ledger is not null then
    update public.applications
    set
      credit_refunded_at = coalesce(credit_refunded_at, timezone('utc', now())),
      credit_refund_ledger_id = coalesce(credit_refund_ledger_id, existing_ledger),
      awaiting_customer_response = false,
      updated_at = timezone('utc', now())
    where id = p_application_id;
    return existing_ledger;
  end if;

  select *
  into app
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'application not found';
  end if;

  if app.credit_refunded_at is not null then
    return app.credit_refund_ledger_id;
  end if;

  -- Only refund when a credit was actually spent (or fee paid via credit path).
  if app.credit_id is null and coalesce(app.fee_eur, 0) <= 0 then
    update public.applications
    set awaiting_customer_response = false, updated_at = timezone('utc', now())
    where id = p_application_id;
    return null;
  end if;

  if app.customer_responded_at is not null then
    update public.applications
    set awaiting_customer_response = false, updated_at = timezone('utc', now())
    where id = p_application_id;
    return null;
  end if;

  insert into public.application_credits (
    profile_id,
    source,
    remaining,
    initial_amount,
    note
  ) values (
    app.applicant_id,
    'refund',
    1,
    1,
    'No-reply credit return (customer did not respond within the window)'
  )
  returning id into new_credit_id;

  insert into public.application_credit_ledger (
    profile_id,
    application_id,
    credit_id,
    payment_id,
    entry_type,
    amount,
    balance_after,
    idempotency_key,
    note,
    metadata
  ) values (
    app.applicant_id,
    app.id,
    new_credit_id,
    app.payment_id,
    'refund_no_reply',
    1,
    1,
    idem_key,
    'Automatic credit return — no customer response before deadline',
    jsonb_build_object(
      'response_deadline_at', app.response_deadline_at,
      'original_credit_id', app.credit_id,
      'fee_eur', app.fee_eur
    )
  )
  returning id into ledger_id;

  update public.applications
  set
    credit_refunded_at = timezone('utc', now()),
    credit_refund_ledger_id = ledger_id,
    awaiting_customer_response = false,
    updated_at = timezone('utc', now())
  where id = p_application_id;

  insert into public.notifications (profile_id, type, title, body, link_path)
  values (
    app.applicant_id,
    'application',
    'Application credit returned',
    'The customer did not respond within 72 hours. 1 application credit was returned to your balance. This does not affect any separate statutory rights you may have for monetary payments.',
    '/dashboard/applications'
  );

  return ledger_id;
exception
  when unique_violation then
    select id into existing_ledger
    from public.application_credit_ledger
    where idempotency_key = idem_key;
    return existing_ledger;
end;
$$;

revoke all on function public.refund_application_credit_no_reply(uuid) from public;
grant execute on function public.refund_application_credit_no_reply(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Batch job: refund expired + remind customers before deadline
-- ---------------------------------------------------------------------------
create or replace function public.process_no_reply_credit_back(
  p_now timestamptz default timezone('utc', now())
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  refunded_count integer := 0;
  reminded_count integer := 0;
  app_id uuid;
  owner_id uuid;
  reminder_hours integer := 24;
begin
  select coalesce((metadata->>'reminder_hours_before')::int, 24)
  into reminder_hours
  from public.pricing_settings
  where key = 'application_response_window_hours';

  if reminder_hours is null or reminder_hours < 1 then
    reminder_hours := 24;
  end if;

  -- Refunds
  for app_id in
    select a.id
    from public.applications a
    where a.awaiting_customer_response = true
      and a.customer_responded_at is null
      and a.credit_refunded_at is null
      and a.response_deadline_at is not null
      and a.response_deadline_at <= p_now
  loop
    perform public.refund_application_credit_no_reply(app_id);
    refunded_count := refunded_count + 1;
  end loop;

  -- Customer reminders
  for app_id, owner_id in
    select a.id, r.owner_id
    from public.applications a
    join public.requests r on r.id = a.request_id
    where a.awaiting_customer_response = true
      and a.customer_responded_at is null
      and a.credit_refunded_at is null
      and a.customer_deadline_reminder_sent_at is null
      and a.response_deadline_at is not null
      and a.response_deadline_at > p_now
      and a.response_deadline_at <= p_now + make_interval(hours => reminder_hours)
  loop
    insert into public.notifications (profile_id, type, title, body, link_path)
    values (
      owner_id,
      'application',
      'Respond before the deadline',
      'A specialist applied to your request. If you do not message, accept, or decline before the deadline, their application credit will be returned automatically. Viewing the application is not enough.',
      '/dashboard/requests'
    );

    update public.applications
    set
      customer_deadline_reminder_sent_at = p_now,
      updated_at = timezone('utc', now())
    where id = app_id;

    reminded_count := reminded_count + 1;
  end loop;

  return jsonb_build_object(
    'refunded', refunded_count,
    'reminded', reminded_count,
    'processed_at', p_now
  );
end;
$$;

revoke all on function public.process_no_reply_credit_back(timestamptz) from public;
grant execute on function public.process_no_reply_credit_back(timestamptz) to service_role;
