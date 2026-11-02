-- Bidirectional matching, paid applications, boosts, Plus, analytics

-- Profile mode / specialist fields
alter table public.profiles
  add column if not exists active_mode text not null default 'customer'
    check (active_mode in ('customer', 'specialist')),
  add column if not exists is_specialist_enabled boolean not null default false,
  add column if not exists specialist_headline text,
  add column if not exists specialist_bio text,
  add column if not exists preferred_budget_min_eur numeric(10, 2)
    check (preferred_budget_min_eur is null or preferred_budget_min_eur >= 0),
  add column if not exists preferred_budget_max_eur numeric(10, 2)
    check (preferred_budget_max_eur is null or preferred_budget_max_eur >= 0),
  add column if not exists remote_available boolean not null default true,
  add column if not exists accepts_invitations boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_budget_range_ok;
alter table public.profiles
  add constraint profiles_budget_range_ok
  check (
    preferred_budget_min_eur is null
    or preferred_budget_max_eur is null
    or preferred_budget_min_eur <= preferred_budget_max_eur
  );

alter table public.profiles
  drop constraint if exists profiles_specialist_headline_len;
alter table public.profiles
  add constraint profiles_specialist_headline_len
  check (specialist_headline is null or char_length(specialist_headline) <= 120);

alter table public.profiles
  drop constraint if exists profiles_specialist_bio_len;
alter table public.profiles
  add constraint profiles_specialist_bio_len
  check (specialist_bio is null or char_length(specialist_bio) <= 3000);

-- Applications: payment / unlock metadata
alter table public.applications
  add column if not exists invitation_id uuid,
  add column if not exists payment_id uuid,
  add column if not exists credit_id uuid,
  add column if not exists fee_eur numeric(10, 2),
  add column if not exists messaging_unlocked boolean not null default false,
  add column if not exists unlocked_at timestamptz;

-- Portfolio
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint portfolio_title_len check (char_length(title) between 2 and 120)
);

create index if not exists portfolio_items_profile_id_idx on public.portfolio_items (profile_id);

create trigger portfolio_items_set_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- Invitations (customer → specialist), optional discovery path
create table if not exists public.specialist_invitations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  specialist_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'sent'
    check (status in ('sent', 'viewed', 'applied', 'declined', 'expired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (request_id, specialist_id)
);

create index if not exists specialist_invitations_specialist_idx
  on public.specialist_invitations (specialist_id, status);
create index if not exists specialist_invitations_request_idx
  on public.specialist_invitations (request_id);

create trigger specialist_invitations_set_updated_at
  before update on public.specialist_invitations
  for each row execute function public.set_updated_at();

-- Pricing settings (admin-configurable)
create table if not exists public.pricing_settings (
  key text primary key,
  amount_eur numeric(10, 2) not null check (amount_eur >= 0),
  currency text not null default 'EUR',
  description text,
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.pricing_settings (key, amount_eur, description, metadata) values
  ('application_fee', 1.99, 'Standard specialist application fee', '{}'::jsonb),
  ('profile_boost_7d', 3.99, 'Profile boost for 7 days', '{"duration_days": 7}'::jsonb),
  ('plus_monthly', 7.99, 'StudentPro Plus monthly subscription', '{"interval": "month"}'::jsonb)
on conflict (key) do nothing;

-- Profile boosts
create table if not exists public.profile_boosts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz not null,
  amount_eur numeric(10, 2) not null,
  payment_provider text not null default 'manual'
    check (payment_provider in ('stripe', 'manual', 'credit')),
  payment_reference text,
  status text not null default 'active'
    check (status in ('pending', 'active', 'expired', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint profile_boosts_window check (ends_at > starts_at)
);

create index if not exists profile_boosts_active_idx
  on public.profile_boosts (profile_id, status, ends_at);

-- Subscription plans
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  amount_eur numeric(10, 2) not null check (amount_eur >= 0),
  interval text not null default 'month' check (interval in ('month', 'year')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.subscription_plans (code, name, description, amount_eur, features)
values (
  'plus_monthly',
  'StudentPro Plus',
  'Modest visibility boost, analytics, and personalized request alerts. Applications are charged separately.',
  7.99,
  '["visibility_boost","analytics","request_alerts"]'::jsonb
)
on conflict (code) do nothing;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  payment_provider text not null default 'manual'
    check (payment_provider in ('stripe', 'manual')),
  payment_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_subscriptions_profile_idx
  on public.user_subscriptions (profile_id, status);

create trigger user_subscriptions_set_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

-- Application payments (never charge twice for same request)
create table if not exists public.application_payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  amount_eur numeric(10, 2) not null check (amount_eur >= 0),
  currency text not null default 'EUR',
  status text not null default 'pending'
    check (status in ('pending', 'requires_action', 'succeeded', 'failed', 'refunded', 'cancelled')),
  payment_provider text not null default 'manual'
    check (payment_provider in ('stripe', 'manual', 'credit')),
  provider_payment_id text,
  provider_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, request_id)
);

create trigger application_payments_set_updated_at
  before update on public.application_payments
  for each row execute function public.set_updated_at();

-- Application credits (admin grants / promotions)
create table if not exists public.application_credits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  source text not null default 'admin'
    check (source in ('admin', 'promo', 'refund', 'purchase')),
  remaining integer not null check (remaining >= 0),
  initial_amount integer not null check (initial_amount > 0),
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists application_credits_profile_idx
  on public.application_credits (profile_id, remaining);

create trigger application_credits_set_updated_at
  before update on public.application_credits
  for each row execute function public.set_updated_at();

-- Analytics events (privacy-conscious)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  subject_profile_id uuid references public.profiles (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_subject_idx
  on public.analytics_events (subject_profile_id, event_type, created_at desc);
create index if not exists analytics_events_actor_idx
  on public.analytics_events (actor_id, created_at desc);
create index if not exists analytics_events_type_idx
  on public.analytics_events (event_type, created_at desc);

-- Optional persisted match explanations (cache / audit)
create table if not exists public.specialist_match_scores (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  specialist_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(8, 2) not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  is_sponsored boolean not null default false,
  computed_at timestamptz not null default timezone('utc', now()),
  unique (request_id, specialist_id)
);

create index if not exists specialist_match_scores_request_idx
  on public.specialist_match_scores (request_id, score desc);

-- FK from applications to invitations/payments/credits
do $$ begin
  alter table public.applications
    add constraint applications_invitation_id_fkey
    foreign key (invitation_id) references public.specialist_invitations (id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.applications
    add constraint applications_payment_id_fkey
    foreign key (payment_id) references public.application_payments (id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.applications
    add constraint applications_credit_id_fkey
    foreign key (credit_id) references public.application_credits (id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.specialist_invitations
    add constraint specialist_invitations_customer_ne_specialist
    check (customer_id <> specialist_id);
exception when duplicate_object then null;
end $$;

-- Helpers
create or replace function public.has_active_boost(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profile_boosts b
    where b.profile_id = p_profile_id
      and b.status = 'active'
      and b.starts_at <= timezone('utc', now())
      and b.ends_at > timezone('utc', now())
  );
$$;

create or replace function public.has_active_plus(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_subscriptions s
    where s.profile_id = p_profile_id
      and s.status in ('trialing', 'active')
      and s.current_period_end > timezone('utc', now())
  );
$$;

create or replace function public.expire_profile_boosts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.profile_boosts
  set status = 'expired'
  where status = 'active'
    and ends_at <= timezone('utc', now());
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- RLS
alter table public.portfolio_items enable row level security;
alter table public.specialist_invitations enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.profile_boosts enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.application_payments enable row level security;
alter table public.application_credits enable row level security;
alter table public.analytics_events enable row level security;
alter table public.specialist_match_scores enable row level security;

drop policy if exists portfolio_items_select on public.portfolio_items;
create policy portfolio_items_select on public.portfolio_items
  for select using (
    profile_id = auth.uid()
    or public.is_admin()
    or (
      public.is_verified_student()
      and exists (
        select 1 from public.profiles p
        where p.id = portfolio_items.profile_id
          and p.is_specialist_enabled
          and not p.is_suspended
          and p.verification_status = 'verified'
      )
    )
  );

drop policy if exists portfolio_items_manage on public.portfolio_items;
create policy portfolio_items_manage on public.portfolio_items
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists specialist_invitations_select on public.specialist_invitations;
create policy specialist_invitations_select on public.specialist_invitations
  for select using (
    public.is_admin()
    or customer_id = auth.uid()
    or specialist_id = auth.uid()
  );

drop policy if exists specialist_invitations_insert on public.specialist_invitations;
create policy specialist_invitations_insert on public.specialist_invitations
  for insert with check (
    customer_id = auth.uid()
    and public.is_verified_student()
  );

drop policy if exists specialist_invitations_update on public.specialist_invitations;
create policy specialist_invitations_update on public.specialist_invitations
  for update using (
    public.is_admin()
    or customer_id = auth.uid()
    or specialist_id = auth.uid()
  );

drop policy if exists pricing_settings_select on public.pricing_settings;
create policy pricing_settings_select on public.pricing_settings
  for select using (true);

drop policy if exists pricing_settings_admin on public.pricing_settings;
create policy pricing_settings_admin on public.pricing_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profile_boosts_select on public.profile_boosts;
create policy profile_boosts_select on public.profile_boosts
  for select using (
    profile_id = auth.uid()
    or public.is_admin()
    or (
      public.is_verified_student()
      and status = 'active'
      and ends_at > timezone('utc', now())
    )
  );

drop policy if exists profile_boosts_insert on public.profile_boosts;
create policy profile_boosts_insert on public.profile_boosts
  for insert with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists profile_boosts_update on public.profile_boosts;
create policy profile_boosts_update on public.profile_boosts
  for update using (profile_id = auth.uid() or public.is_admin());

drop policy if exists subscription_plans_select on public.subscription_plans;
create policy subscription_plans_select on public.subscription_plans
  for select using (is_active = true or public.is_admin());

drop policy if exists subscription_plans_admin on public.subscription_plans;
create policy subscription_plans_admin on public.subscription_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_subscriptions_select on public.user_subscriptions;
create policy user_subscriptions_select on public.user_subscriptions
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists user_subscriptions_insert on public.user_subscriptions;
create policy user_subscriptions_insert on public.user_subscriptions
  for insert with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists user_subscriptions_update on public.user_subscriptions;
create policy user_subscriptions_update on public.user_subscriptions
  for update using (profile_id = auth.uid() or public.is_admin());

drop policy if exists application_payments_select on public.application_payments;
create policy application_payments_select on public.application_payments
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists application_payments_insert on public.application_payments;
create policy application_payments_insert on public.application_payments
  for insert with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists application_payments_update on public.application_payments;
create policy application_payments_update on public.application_payments
  for update using (profile_id = auth.uid() or public.is_admin());

drop policy if exists application_credits_select on public.application_credits;
create policy application_credits_select on public.application_credits
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists application_credits_admin_write on public.application_credits;
create policy application_credits_admin_write on public.application_credits
  for all using (public.is_admin() or profile_id = auth.uid())
  with check (public.is_admin() or profile_id = auth.uid());

drop policy if exists analytics_events_select on public.analytics_events;
create policy analytics_events_select on public.analytics_events
  for select using (
    public.is_admin()
    or subject_profile_id = auth.uid()
    or actor_id = auth.uid()
  );

drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert on public.analytics_events
  for insert with check (
    actor_id = auth.uid()
    or public.is_admin()
    or actor_id is null
  );

drop policy if exists specialist_match_scores_select on public.specialist_match_scores;
create policy specialist_match_scores_select on public.specialist_match_scores
  for select using (public.is_verified_student() or public.is_admin());

drop policy if exists specialist_match_scores_write on public.specialist_match_scores;
create policy specialist_match_scores_write on public.specialist_match_scores
  for all using (public.is_verified_student() or public.is_admin())
  with check (public.is_verified_student() or public.is_admin());
