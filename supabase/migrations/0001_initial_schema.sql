create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'free',
  time_zone text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  email text not null,
  role text default 'parent' check (role = 'parent'),
  kid_mode_pin_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  avatar text,
  age_band text check (age_band in ('younger', 'older')),
  total_xp integer default 0 not null,
  coin_balance integer default 0 not null,
  current_level integer default 1 not null check (current_level between 1 and 20),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.activity_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  category text not null,
  default_duration_minutes integer not null check (default_duration_minutes >= 0),
  default_approval_mode text not null check (default_approval_mode in ('auto', 'parent')),
  is_system_template boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.assigned_quests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  name text not null,
  icon text,
  category text not null,
  duration_minutes integer not null check (duration_minutes >= 0),
  xp_value integer not null check (xp_value >= 0),
  coin_value integer not null check (coin_value >= 0),
  active_days text[] not null,
  suggested_time_window text,
  completion_deadline text,
  approval_mode text not null check (approval_mode in ('auto', 'parent')),
  unlock_mode text not null check (unlock_mode in ('always', 'after_one', 'after_multiple')),
  prerequisite_quest_ids uuid[] default '{}' not null,
  parent_note text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint assigned_quests_active_days_weekdays check (
    active_days <@ array['monday','tuesday','wednesday','thursday','friday','saturday','sunday']::text[]
  )
);

create table public.quest_instances (
  id uuid primary key default gen_random_uuid(),
  assigned_quest_id uuid not null references public.assigned_quests(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  quest_date date not null,
  name text not null,
  icon text,
  category text not null,
  duration_minutes integer not null check (duration_minutes >= 0),
  xp_value integer not null check (xp_value >= 0),
  coin_value integer not null check (coin_value >= 0),
  approval_mode text not null check (approval_mode in ('auto', 'parent')),
  suggested_time_window text,
  completion_deadline text,
  parent_note text,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','completed','denied')),
  started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  denied_at timestamptz,
  denial_note text,
  elapsed_seconds integer default 0 not null check (elapsed_seconds >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (assigned_quest_id, quest_date)
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  icon text,
  coin_cost integer not null check (coin_cost >= 0),
  description text,
  approval_required boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','approved','denied','approved_for_later','cancelled')),
  requested_at timestamptz default now(),
  approved_at timestamptz,
  denied_at timestamptz,
  scheduled_for date,
  parent_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  amount integer not null,
  reason text not null,
  quest_instance_id uuid references public.quest_instances(id) on delete cascade,
  created_at timestamptz default now(),
  unique (quest_instance_id, reason)
);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('quest_completed','reward_redeemed','parent_adjustment','bonus')),
  quest_instance_id uuid references public.quest_instances(id) on delete cascade,
  redemption_id uuid references public.reward_redemptions(id) on delete cascade,
  created_at timestamptz default now(),
  unique (quest_instance_id, reason),
  unique (redemption_id, reason)
);

create table public.rest_days (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  date date not null,
  type text not null check (type in ('rest_day','sick_day','travel_day','camp_day','family_day','parent_excused_day')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (child_id, date)
);

create trigger families_updated_at before update on public.families for each row execute function public.set_updated_at();
create trigger users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger children_updated_at before update on public.children for each row execute function public.set_updated_at();
create trigger activity_templates_updated_at before update on public.activity_templates for each row execute function public.set_updated_at();
create trigger assigned_quests_updated_at before update on public.assigned_quests for each row execute function public.set_updated_at();
create trigger quest_instances_updated_at before update on public.quest_instances for each row execute function public.set_updated_at();
create trigger rewards_updated_at before update on public.rewards for each row execute function public.set_updated_at();
create trigger reward_redemptions_updated_at before update on public.reward_redemptions for each row execute function public.set_updated_at();
create trigger rest_days_updated_at before update on public.rest_days for each row execute function public.set_updated_at();

create or replace function public.current_family_id()
returns uuid
language sql
stable
as $$
  select family_id from public.users where id = (select auth.uid())
$$;

create or replace function public.child_belongs_to_current_family(child_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.children c
    where c.id = child_uuid
      and c.family_id = public.current_family_id()
  )
$$;

create or replace function public.reward_belongs_to_current_family(reward_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.rewards r
    where r.id = reward_uuid
      and r.family_id = public.current_family_id()
  )
$$;

alter table public.families enable row level security;
alter table public.users enable row level security;
alter table public.children enable row level security;
alter table public.activity_templates enable row level security;
alter table public.assigned_quests enable row level security;
alter table public.quest_instances enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.rest_days enable row level security;

create policy "users can read own row" on public.users for select to authenticated
using (id = (select auth.uid()));
create policy "users can update own row" on public.users for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "families are visible to their parent" on public.families for select to authenticated
using (id = public.current_family_id());
create policy "families are writable by their parent" on public.families for update to authenticated
using (id = public.current_family_id())
with check (id = public.current_family_id());

create policy "children family access" on public.children for all to authenticated
using (family_id = public.current_family_id())
with check (family_id = public.current_family_id());

create policy "system templates are readable" on public.activity_templates for select to authenticated
using (is_system_template = true);

create policy "assigned quests family access" on public.assigned_quests for all to authenticated
using (public.child_belongs_to_current_family(child_id))
with check (public.child_belongs_to_current_family(child_id));

create policy "quest instances family access" on public.quest_instances for all to authenticated
using (public.child_belongs_to_current_family(child_id))
with check (public.child_belongs_to_current_family(child_id));

create policy "rewards family access" on public.rewards for all to authenticated
using (family_id = public.current_family_id())
with check (family_id = public.current_family_id());

create policy "reward redemptions family access" on public.reward_redemptions for all to authenticated
using (
  public.child_belongs_to_current_family(child_id)
  and public.reward_belongs_to_current_family(reward_id)
)
with check (
  public.child_belongs_to_current_family(child_id)
  and public.reward_belongs_to_current_family(reward_id)
);

create policy "xp transactions family access" on public.xp_transactions for all to authenticated
using (public.child_belongs_to_current_family(child_id))
with check (public.child_belongs_to_current_family(child_id));

create policy "coin transactions family access" on public.coin_transactions for all to authenticated
using (public.child_belongs_to_current_family(child_id))
with check (public.child_belongs_to_current_family(child_id));

create policy "rest days family access" on public.rest_days for all to authenticated
using (public.child_belongs_to_current_family(child_id))
with check (public.child_belongs_to_current_family(child_id));

create or replace function public.approve_reward_redemption(
  redemption_id uuid,
  target_status text,
  allow_overdraw boolean default false
)
returns table (
  updated_redemption_id uuid,
  updated_status text,
  resulting_coin_balance integer
)
language plpgsql
as $$
declare
  redemption_record public.reward_redemptions%rowtype;
  reward_record public.rewards%rowtype;
  child_record public.children%rowtype;
  new_balance integer;
begin
  if target_status not in ('approved', 'approved_for_later') then
    raise exception 'target_status must be approved or approved_for_later';
  end if;

  select *
  into redemption_record
  from public.reward_redemptions rr
  where rr.id = redemption_id
  for update;

  if not found then
    raise exception 'Reward redemption not found';
  end if;

  if not public.child_belongs_to_current_family(redemption_record.child_id) then
    raise exception 'Not authorized for this redemption';
  end if;

  if redemption_record.status <> 'requested' then
    raise exception 'Reward redemption is no longer requested';
  end if;

  select *
  into reward_record
  from public.rewards r
  where r.id = redemption_record.reward_id
  for update;

  if not found then
    raise exception 'Reward not found';
  end if;

  select *
  into child_record
  from public.children c
  where c.id = redemption_record.child_id
  for update;

  new_balance := child_record.coin_balance - reward_record.coin_cost;

  if new_balance < 0 and allow_overdraw is not true then
    raise exception 'Approving this reward will reduce the coin balance below zero. Current balance: %. Resulting balance: %. Continue?',
      child_record.coin_balance,
      new_balance;
  end if;

  if exists (
    select 1
    from public.coin_transactions ct
    where ct.redemption_id = redemption_record.id
      and ct.reason = 'reward_redeemed'
  ) then
    raise exception 'Reward redemption has already been deducted';
  end if;

  update public.children
  set coin_balance = new_balance
  where id = child_record.id;

  insert into public.coin_transactions (
    child_id,
    amount,
    reason,
    redemption_id
  )
  values (
    child_record.id,
    -reward_record.coin_cost,
    'reward_redeemed',
    redemption_record.id
  );

  update public.reward_redemptions
  set
    status = target_status,
    approved_at = now(),
    updated_at = now()
  where id = redemption_record.id
  returning id, status into updated_redemption_id, updated_status;

  resulting_coin_balance := new_balance;
  return next;
end;
$$;
