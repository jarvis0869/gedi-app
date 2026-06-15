-- Row Level Security for Gedi.
-- Run in Supabase Dashboard → SQL Editor.
-- Requires auth.uid() to match user_id / id on every table.

-- ── users ────────────────────────────────────────────────────────────────────
alter table users enable row level security;

-- Each user reads only their own row
create policy "users: own row select"
  on users for select
  using (auth.uid() = id);

-- Each user updates only their own row
create policy "users: own row update"
  on users for update
  using (auth.uid() = id);

-- Allow insert on sign-up (phone OTP upsert)
create policy "users: insert on signup"
  on users for insert
  with check (auth.uid() = id);

-- ── checkins ─────────────────────────────────────────────────────────────────
alter table checkins enable row level security;

-- Users can read only their own checkins
create policy "checkins: own rows select"
  on checkins for select
  using (auth.uid() = user_id);

-- Users can insert their own checkins
create policy "checkins: own rows insert"
  on checkins for insert
  with check (auth.uid() = user_id);

-- No update / delete (immutable audit log)

-- ── saves ─────────────────────────────────────────────────────────────────────
alter table saves enable row level security;

-- Users can read only their own saves
create policy "saves: own rows select"
  on saves for select
  using (auth.uid() = user_id);

-- Users can manage their own saves
create policy "saves: own rows insert"
  on saves for insert
  with check (auth.uid() = user_id);

create policy "saves: own rows delete"
  on saves for delete
  using (auth.uid() = user_id);

-- Upsert needs update
create policy "saves: own rows update"
  on saves for update
  using (auth.uid() = user_id);

-- ── Ghost mode: server-side no-op (checkins still recorded, just hidden) ─────
-- Ghost mode enforcement is already complete via RLS above: nobody else can
-- query another user's checkins or saves regardless of their privacy_mode,
-- because every select policy filters to auth.uid() = user_id / id.
-- privacy_mode is used client-side to adjust UI messaging ("privately").
