-- Privileged helpers callable by authenticated users for allowed self-service flows

create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
    set is_suspended = true,
        suspension_reason = 'User requested account deletion',
        privacy_show_in_directory = false,
        bio = null,
        avatar_url = null,
        updated_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;

create or replace function public.increment_collaboration_counts(p_requester uuid, p_helper uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if auth.uid() <> p_requester and auth.uid() <> p_helper and not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.profiles
    set completed_collaborations_count = completed_collaborations_count + 1,
        updated_at = timezone('utc', now())
  where id in (p_requester, p_helper);
end;
$$;

revoke all on function public.increment_collaboration_counts(uuid, uuid) from public;
grant execute on function public.increment_collaboration_counts(uuid, uuid) to authenticated;
