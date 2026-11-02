-- Private student-only marketplace: browse requests/profiles only when verified.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or (
      public.is_verified_student()
      and not is_suspended
      and privacy_show_in_directory = true
      and verification_status = 'verified'
    )
  );

drop policy if exists profile_skills_select on public.profile_skills;
create policy profile_skills_select on public.profile_skills
  for select using (
    profile_id = auth.uid()
    or public.is_admin()
    or (
      public.is_verified_student()
      and exists (
        select 1 from public.profiles p
        where p.id = profile_skills.profile_id
          and p.privacy_show_in_directory = true
          and p.verification_status = 'verified'
          and not p.is_suspended
      )
    )
  );

drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests
  for select using (
    public.is_admin()
    or owner_id = auth.uid()
    or (
      public.is_verified_student()
      and is_hidden = false
      and status in ('open', 'in_progress', 'closed')
    )
  );

drop policy if exists request_images_select on public.request_images;
create policy request_images_select on public.request_images
  for select using (
    exists (
      select 1 from public.requests r
      where r.id = request_images.request_id
        and (
          public.is_admin()
          or r.owner_id = auth.uid()
          or (
            public.is_verified_student()
            and r.is_hidden = false
          )
        )
    )
  );
