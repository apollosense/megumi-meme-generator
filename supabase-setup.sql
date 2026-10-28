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

-- 6. block slurs and explicit words on the server too (people can post straight
--    to the API and skip the website's filter). catches look-alike letters,
--    a lowercase l in place of an I, spaces and dots between letters
create or replace function public.wall_norm(t text) returns text language sql immutable as $$
  select translate(lower(normalize(coalesce(t,''), NFKC)),
    '0@4$5!1|3€7аеорсухкмтнвіїјѕıοαιενκρτυ',
    'oaassiiieetaeopcyxkmthbiijsioaieevkptu')
$$;

create or replace function public.wall_is_bad(t text) returns boolean language plpgsql immutable as $$
declare n text; tight text; v text;
begin
  n := public.wall_norm(t);
  foreach v in array array[n, replace(n,'l','i')] loop
    tight := regexp_replace(v, '[^a-zçğöşü]', '', 'g');
    tight := regexp_replace(tight, '(.)\1{2,}', '\1\1', 'g');
    if tight ~ '(nigg(er|a|az|as|ers)|faggot)' then return true; end if;
    if regexp_replace(v, '(.)\1{2,}', '\1\1', 'g') ~ '(^|[^a-z])(cunt|porn|whore|slut|dildo|blowj|orospu|siktir|retard|fags?([^a-z]|$))' then return true; end if;
  end loop;
  return false;
end $$;

create or replace function public.wall_check() returns trigger language plpgsql as $$
begin
  if public.wall_is_bad(new.name) or public.wall_is_bad(new.body) then
    raise exception 'message not allowed' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists wall_check on public.messages;
create trigger wall_check before insert or update of name, body on public.messages
  for each row execute function public.wall_check();
