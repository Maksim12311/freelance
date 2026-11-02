-- Sync profile.verification_status when a verification row is inserted/updated
-- so users never need to write privileged profile columns themselves.

create or replace function public.sync_profile_verification_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
      set verification_status = 'pending_review',
          updated_at = timezone('utc', now())
    where id = new.profile_id
      and verification_status in ('not_verified', 'rejected', 'expired');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'verified' then
      update public.profiles
        set verification_status = 'verified',
            verified_at = coalesce(new.reviewed_at, timezone('utc', now())),
            verification_expires_at = new.expires_at,
            updated_at = timezone('utc', now())
      where id = new.profile_id;
    elsif new.status in ('rejected', 'expired', 'pending_review', 'not_verified') then
      update public.profiles
        set verification_status = new.status,
            updated_at = timezone('utc', now())
      where id = new.profile_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger student_verifications_sync_profile
  after insert or update of status on public.student_verifications
  for each row execute function public.sync_profile_verification_from_submission();
