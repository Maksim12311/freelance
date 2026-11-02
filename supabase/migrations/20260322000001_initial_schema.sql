-- StudentPro initial schema
-- Vienna student marketplace — no service payment processing

create extension if not exists "pgcrypto";

-- Enums
create type verification_status as enum (
  'not_verified',
  'pending_review',
  'verified',
  'rejected',
  'expired'
);

create type work_eligibility_status as enum (
  'not_assessed',
  'information_required',
  'reviewed',
  'restricted'
);

create type request_status as enum (
  'open',
  'in_progress',
  'closed',
  'cancelled'
);

create type work_mode as enum (
  'remote',
  'in_person',
  'hybrid'
);

create type application_status as enum (
  'sent',
  'viewed',
  'accepted',
  'declined',
  'withdrawn'
);

create type collaboration_status as enum (
  'pending_confirmation',
  'confirmed',
  'completed',
  'cancelled'
);

create type report_target_type as enum (
  'request',
  'profile',
  'message',
  'review',
  'application'
);

create type report_status as enum (
  'open',
  'under_review',
  'resolved',
  'dismissed',
  'escalated'
);

create type notification_type as enum (
  'application',
  'message',
  'verification',
  'review',
  'system',
  'moderation'
);

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Universities
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  city text not null default 'Vienna',
  country text not null default 'AT',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.university_email_domains (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  domain text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, domain)
);

create unique index university_email_domains_domain_lower_idx
  on public.university_email_domains (lower(domain));

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  display_name text not null,
  email text not null,
  university_id uuid references public.universities (id) on delete set null,
  bio text,
  avatar_url text,
  general_location text default 'Vienna',
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  suspension_reason text,
  verification_status verification_status not null default 'not_verified',
  verified_at timestamptz,
  verification_expires_at timestamptz,
  work_eligibility_status work_eligibility_status not null default 'not_assessed',
  work_eligibility_notes text,
  availability text,
  profile_completed boolean not null default false,
  notification_email boolean not null default true,
  notification_messages boolean not null default true,
  notification_applications boolean not null default true,
  privacy_show_in_directory boolean not null default true,
  privacy_show_university boolean not null default true,
  completed_collaborations_count integer not null default 0 check (completed_collaborations_count >= 0),
  average_rating numeric(3, 2) check (average_rating is null or (average_rating >= 1 and average_rating <= 5)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_len check (char_length(display_name) between 1 and 80),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 2000)
);

create index profiles_university_id_idx on public.profiles (university_id);
create index profiles_verification_status_idx on public.profiles (verification_status);
create index profiles_directory_idx on public.profiles (privacy_show_in_directory, verification_status)
  where is_suspended = false;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Categories & skills
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, skill_id)
);

-- Student verification
create table public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  method text not null check (method in ('university_email', 'enrollment_certificate')),
  status verification_status not null default 'pending_review',
  university_email text,
  university_email_confirmed_at timestamptz,
  document_path text,
  document_mime_type text,
  document_size_bytes integer check (document_size_bytes is null or (document_size_bytes > 0 and document_size_bytes <= 10485760)),
  reviewer_id uuid references public.profiles (id) on delete set null,
  review_notes text,
  rejection_reason text,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  expires_at timestamptz,
  document_deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index student_verifications_profile_id_idx on public.student_verifications (profile_id);
create index student_verifications_status_idx on public.student_verifications (status);

create trigger student_verifications_set_updated_at
  before update on public.student_verifications
  for each row execute function public.set_updated_at();

-- Requests
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  description text not null,
  suggested_budget_eur numeric(10, 2) check (suggested_budget_eur is null or suggested_budget_eur >= 0),
  location text,
  work_mode work_mode not null default 'in_person',
  preferred_date date,
  status request_status not null default 'open',
  preferred_applicant_id uuid references public.profiles (id) on delete set null,
  application_count integer not null default 0 check (application_count >= 0),
  is_hidden boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint requests_title_len check (char_length(title) between 5 and 120),
  constraint requests_description_len check (char_length(description) between 30 and 5000)
);

create index requests_owner_id_idx on public.requests (owner_id);
create index requests_category_id_idx on public.requests (category_id);
create index requests_status_created_idx on public.requests (status, created_at desc);
create index requests_budget_idx on public.requests (suggested_budget_eur);

create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

create table public.request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index request_images_request_id_idx on public.request_images (request_id);

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  introduction text not null,
  experience text,
  proposed_price_eur numeric(10, 2) check (proposed_price_eur is null or proposed_price_eur >= 0),
  availability text,
  status application_status not null default 'sent',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (request_id, applicant_id),
  constraint applications_introduction_len check (char_length(introduction) between 20 and 2000)
);

create index applications_applicant_id_idx on public.applications (applicant_id);
create index applications_request_id_idx on public.applications (request_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- Messaging
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (conversation_id, profile_id)
);

create index conversation_participants_profile_id_idx
  on public.conversation_participants (profile_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_body_len check (char_length(body) between 1 and 5000)
);

create index messages_conversation_id_created_idx
  on public.messages (conversation_id, created_at);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Saved requests
create table public.saved_requests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, request_id)
);

-- Collaborations & reviews
create table public.collaborations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  helper_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  status collaboration_status not null default 'pending_confirmation',
  requester_confirmed_at timestamptz,
  helper_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (request_id, helper_id),
  constraint collaborations_distinct_parties check (requester_id <> helper_id)
);

create trigger collaborations_set_updated_at
  before update on public.collaborations
  for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  communication_rating integer not null check (communication_rating between 1 and 5),
  reliability_rating integer not null check (reliability_rating between 1 and 5),
  overall_rating integer not null check (overall_rating between 1 and 5),
  comment text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (collaboration_id, reviewer_id),
  constraint reviews_distinct_parties check (reviewer_id <> reviewee_id),
  constraint reviews_comment_len check (comment is null or char_length(comment) <= 2000)
);

create index reviews_reviewee_id_idx on public.reviews (reviewee_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Reports & blocking
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  resolution_notes text,
  appeal_text text,
  appeal_submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reports_reason_len check (char_length(reason) between 5 and 200)
);

create index reports_status_idx on public.reports (status, created_at desc);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create table public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_no_self check (blocker_id <> blocked_id)
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  link_path text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_profile_unread_idx
  on public.notifications (profile_id, is_read, created_at desc);

-- Admin audit logs
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index admin_audit_logs_admin_id_idx on public.admin_audit_logs (admin_id, created_at desc);

-- Auth helper functions
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin and not is_suspended from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_verified_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select verification_status = 'verified'
        and not is_suspended
        and (verification_expires_at is null or verification_expires_at > timezone('utc', now()))
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and profile_id = auth.uid()
  );
$$;

-- Prevent privilege escalation on profiles
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Users cannot change administrator privileges';
    end if;
    if new.is_suspended is distinct from old.is_suspended
       or new.suspension_reason is distinct from old.suspension_reason then
      raise exception 'Users cannot change suspension status';
    end if;
    if new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.verification_expires_at is distinct from old.verification_expires_at then
      raise exception 'Users cannot change verification status';
    end if;
    if new.work_eligibility_status is distinct from old.work_eligibility_status
       or new.work_eligibility_notes is distinct from old.work_eligibility_notes then
      raise exception 'Users cannot change work eligibility status';
    end if;
    if new.completed_collaborations_count is distinct from old.completed_collaborations_count
       or new.average_rating is distinct from old.average_rating then
      raise exception 'Users cannot change computed profile metrics';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text := coalesce(new.raw_user_meta_data ->> 'first_name', 'Student');
  v_last text := coalesce(new.raw_user_meta_data ->> 'last_name', 'User');
  v_uni uuid := nullif(new.raw_user_meta_data ->> 'university_id', '')::uuid;
begin
  insert into public.profiles (
    id, first_name, last_name, display_name, email, university_id
  ) values (
    new.id,
    v_first,
    v_last,
    trim(both from (v_first || ' ' || v_last)),
    new.email,
    v_uni
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep application_count in sync
create or replace function public.sync_application_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.requests
      set application_count = application_count + 1
    where id = new.request_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.requests
      set application_count = greatest(application_count - 1, 0)
    where id = old.request_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger applications_sync_count
  after insert or delete on public.applications
  for each row execute function public.sync_application_count();

-- Update conversation last_message_at
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at,
        updated_at = timezone('utc', now())
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Recalculate average rating
create or replace function public.refresh_reviewee_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.reviewee_id, old.reviewee_id);
  update public.profiles p
  set average_rating = (
    select round(avg(overall_rating)::numeric, 2)
    from public.reviews r
    where r.reviewee_id = target and r.is_hidden = false
  )
  where p.id = target;
  return coalesce(new, old);
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_reviewee_rating();

-- RLS
alter table public.universities enable row level security;
alter table public.university_email_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.student_verifications enable row level security;
alter table public.requests enable row level security;
alter table public.request_images enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.saved_requests enable row level security;
alter table public.collaborations enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Universities / domains / categories / skills: public read
create policy universities_public_read on public.universities
  for select using (is_active = true or public.is_admin());

create policy universities_admin_write on public.universities
  for all using (public.is_admin()) with check (public.is_admin());

create policy university_domains_public_read on public.university_email_domains
  for select using (is_active = true or public.is_admin());

create policy university_domains_admin_write on public.university_email_domains
  for all using (public.is_admin()) with check (public.is_admin());

create policy categories_public_read on public.categories
  for select using (is_active = true or public.is_admin());

create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy skills_public_read on public.skills
  for select using (is_active = true or public.is_admin());

create policy skills_admin_write on public.skills
  for all using (public.is_admin()) with check (public.is_admin());

-- Profiles
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or (
      not is_suspended
      and privacy_show_in_directory = true
      and verification_status = 'verified'
    )
  );

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_admin_insert on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

-- Profile skills
create policy profile_skills_select on public.profile_skills
  for select using (
    profile_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = profile_skills.profile_id
        and p.privacy_show_in_directory = true
        and p.verification_status = 'verified'
        and not p.is_suspended
    )
  );

create policy profile_skills_manage_own on public.profile_skills
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- Student verifications (private documents)
create policy student_verifications_select on public.student_verifications
  for select using (profile_id = auth.uid() or public.is_admin());

create policy student_verifications_insert_own on public.student_verifications
  for insert with check (profile_id = auth.uid());

create policy student_verifications_update on public.student_verifications
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- Requests
create policy requests_select on public.requests
  for select using (
    public.is_admin()
    or owner_id = auth.uid()
    or (is_hidden = false and status in ('open', 'in_progress', 'closed'))
  );

create policy requests_insert on public.requests
  for insert with check (
    owner_id = auth.uid()
    and public.is_verified_student()
  );

create policy requests_update on public.requests
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy requests_delete on public.requests
  for delete using (owner_id = auth.uid() or public.is_admin());

-- Request images
create policy request_images_select on public.request_images
  for select using (
    exists (
      select 1 from public.requests r
      where r.id = request_images.request_id
        and (
          public.is_admin()
          or r.owner_id = auth.uid()
          or (r.is_hidden = false)
        )
    )
  );

create policy request_images_write on public.request_images
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.requests r
      where r.id = request_images.request_id and r.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.requests r
      where r.id = request_images.request_id
        and r.owner_id = auth.uid()
        and public.is_verified_student()
    )
  );

-- Applications (private between owner and applicant)
create policy applications_select on public.applications
  for select using (
    public.is_admin()
    or applicant_id = auth.uid()
    or exists (
      select 1 from public.requests r
      where r.id = applications.request_id and r.owner_id = auth.uid()
    )
  );

create policy applications_insert on public.applications
  for insert with check (
    applicant_id = auth.uid()
    and public.is_verified_student()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.owner_id <> auth.uid()
        and r.status = 'open'
        and r.is_hidden = false
    )
  );

create policy applications_update on public.applications
  for update using (
    public.is_admin()
    or applicant_id = auth.uid()
    or exists (
      select 1 from public.requests r
      where r.id = applications.request_id and r.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or applicant_id = auth.uid()
    or exists (
      select 1 from public.requests r
      where r.id = applications.request_id and r.owner_id = auth.uid()
    )
  );

-- Conversations
create policy conversations_select on public.conversations
  for select using (
    public.is_admin() or public.is_conversation_participant(id)
  );

create policy conversations_insert on public.conversations
  for insert with check (
    created_by = auth.uid() and public.is_verified_student()
  );

create policy conversations_update on public.conversations
  for update using (
    public.is_admin() or public.is_conversation_participant(id)
  )
  with check (
    public.is_admin() or public.is_conversation_participant(id)
  );

create policy conversation_participants_select on public.conversation_participants
  for select using (
    public.is_admin()
    or profile_id = auth.uid()
    or public.is_conversation_participant(conversation_id)
  );

create policy conversation_participants_insert on public.conversation_participants
  for insert with check (
    public.is_admin()
    or profile_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy conversation_participants_update on public.conversation_participants
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy messages_select on public.messages
  for select using (
    public.is_admin() or public.is_conversation_participant(conversation_id)
  );

create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_verified_student()
    and public.is_conversation_participant(conversation_id)
  );

create policy messages_update on public.messages
  for update using (sender_id = auth.uid() or public.is_admin())
  with check (sender_id = auth.uid() or public.is_admin());

-- Saved requests
create policy saved_requests_own on public.saved_requests
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.is_verified_student());

-- Collaborations
create policy collaborations_select on public.collaborations
  for select using (
    public.is_admin()
    or requester_id = auth.uid()
    or helper_id = auth.uid()
  );

create policy collaborations_insert on public.collaborations
  for insert with check (
    requester_id = auth.uid() and public.is_verified_student()
  );

create policy collaborations_update on public.collaborations
  for update using (
    public.is_admin()
    or requester_id = auth.uid()
    or helper_id = auth.uid()
  )
  with check (
    public.is_admin()
    or requester_id = auth.uid()
    or helper_id = auth.uid()
  );

-- Reviews
create policy reviews_select on public.reviews
  for select using (
    public.is_admin()
    or is_hidden = false
    or reviewer_id = auth.uid()
    or reviewee_id = auth.uid()
  );

create policy reviews_insert on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and public.is_verified_student()
    and exists (
      select 1 from public.collaborations c
      where c.id = collaboration_id
        and c.status = 'completed'
        and (c.requester_id = auth.uid() or c.helper_id = auth.uid())
    )
  );

create policy reviews_update on public.reviews
  for update using (reviewer_id = auth.uid() or public.is_admin())
  with check (reviewer_id = auth.uid() or public.is_admin());

-- Reports
create policy reports_select on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid());

create policy reports_update on public.reports
  for update using (reporter_id = auth.uid() or public.is_admin())
  with check (reporter_id = auth.uid() or public.is_admin());

-- Blocked users
create policy blocked_users_own on public.blocked_users
  for all using (blocker_id = auth.uid() or public.is_admin())
  with check (blocker_id = auth.uid());

-- Notifications
create policy notifications_own on public.notifications
  for select using (profile_id = auth.uid() or public.is_admin());

create policy notifications_update_own on public.notifications
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy notifications_insert_admin on public.notifications
  for insert with check (public.is_admin() or profile_id = auth.uid());

-- Admin audit logs
create policy admin_audit_logs_admin on public.admin_audit_logs
  for select using (public.is_admin());

create policy admin_audit_logs_insert on public.admin_audit_logs
  for insert with check (public.is_admin() and admin_id = auth.uid());

-- Storage buckets (run via dashboard or storage API as well)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'verification-documents',
    'verification-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'request-images',
    'request-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- Storage policies
create policy verification_docs_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-documents'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy verification_docs_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy verification_docs_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verification-documents'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy request_images_public_read on storage.objects
  for select using (bucket_id = 'request-images');

create policy request_images_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'request-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy request_images_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'request-images'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
