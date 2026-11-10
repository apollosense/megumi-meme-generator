-- Community wall for the Megumi text generator.
-- Paste all of this into Supabase: SQL Editor > New query > Run.
--
-- What it does:
--   * a "messages" table: visitor name (optional), message, your reply
--   * anyone can READ messages (except ones you hide)
--   * anyone can POST a message, but only the name and the message text
--   * nobody but you can reply, edit, hide or delete. You do that in the
--     Supabase dashboard (Table Editor > messages), which is logged in as you
--   * at most 20 new messages per minute in total, so nobody can flood it

create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text check (name is null or char_length(name) between 1 and 30),
  body        text not null check (char_length(btrim(body)) between 1 and 300),
  reply       text check (reply is null or char_length(reply) <= 1000),
  replied_at  timestamptz,
  hidden      boolean not null default false
);

alter table public.messages enable row level security;

-- visitors may only read, and only messages that are not hidden
drop policy if exists "anyone can read visible messages" on public.messages;
create policy "anyone can read visible messages"
  on public.messages for select
  to anon, authenticated
  using (hidden = false);

-- visitors may add a message, never with a reply or hidden flag
drop policy if exists "anyone can post a message" on public.messages;
create policy "anyone can post a message"
  on public.messages for insert
  to anon
  with check (reply is null and replied_at is null and hidden = false);

-- belt and braces: visitors can only ever fill in name and body
revoke all on public.messages from anon, authenticated;
grant select on public.messages to anon, authenticated;
grant insert (name, body) on public.messages to anon;

-- stop floods: max 20 new messages per minute across the whole site
create or replace function public.messages_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many messages right now, try again in a minute';
  end if;
  return new;
end $$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.messages_rate_limit();

-- when you type a reply in the dashboard, stamp the time automatically
create or replace function public.messages_reply_time()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.reply is distinct from old.reply then
    new.replied_at := case when new.reply is null or btrim(new.reply) = '' then null else now() end;
  end if;
  return new;
end $$;

drop trigger if exists messages_reply_time on public.messages;
create trigger messages_reply_time
  before update on public.messages
  for each row execute function public.messages_reply_time();
