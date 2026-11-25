-- SixSpots schema. Paste into Supabase -> SQL Editor -> New query -> Run.

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null default auth.uid(),
  title text not null check (char_length(title) between 1 and 60),
  category text not null check (category in ('Hidden Car','Side Mission','Collectible','Weapon','Easter Egg')),
  note text check (char_length(note) <= 280),
  x double precision not null check (x between 0 and 4000),
  y double precision not null check (y between 0 and 3000),
  base_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  pin_id uuid not null references public.pins on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  value smallint not null check (value in (-1, 1)),
  primary key (pin_id, user_id)
);

-- base_score only holds the demo pins' starting scores; real votes add on top.
create or replace view public.pin_scores with (security_invoker = true) as
select p.id, p.title, p.category, p.note, p.x, p.y, p.created_at,
       p.base_score + coalesce(sum(v.value), 0)::int as score
from public.pins p
left join public.votes v on v.pin_id = p.id
group by p.id;

alter table public.pins enable row level security;
alter table public.votes enable row level security;

drop policy if exists "pins readable by everyone" on public.pins;
drop policy if exists "signed-in users add pins" on public.pins;
drop policy if exists "owners edit pins" on public.pins;
drop policy if exists "owners delete pins" on public.pins;
create policy "pins readable by everyone" on public.pins for select using (true);
create policy "signed-in users add pins" on public.pins for insert to authenticated with check (user_id = auth.uid() and base_score = 0);
create policy "owners edit pins" on public.pins for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and base_score = 0);
create policy "owners delete pins" on public.pins for delete to authenticated using (user_id = auth.uid());

drop policy if exists "votes readable by everyone" on public.votes;
drop policy if exists "signed-in users vote" on public.votes;
drop policy if exists "owners change votes" on public.votes;
drop policy if exists "owners remove votes" on public.votes;
create policy "votes readable by everyone" on public.votes for select using (true);
create policy "signed-in users vote" on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy "owners change votes" on public.votes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners remove votes" on public.votes for delete to authenticated using (user_id = auth.uid());

grant select on public.pin_scores to anon, authenticated;

-- 12 demo pins (only inserted once)
insert into public.pins (title, category, note, x, y, base_score, user_id, created_at)
select * from (values
  ('Rooftop garage sports car', 'Hidden Car', 'Top floor of the parking garage by the beach. Climb the ramp at night.', 1140, 1260, 4, null::uuid, now() - interval '180 minutes'),
  ('Muscle car behind the diner', 'Hidden Car', 'Under a tarp behind the roadside diner off the highway.', 240, 720, 7, null, now() - interval '300 minutes'),
  ('Dune buggy in the swamp shack', 'Hidden Car', 'Inside the shack on stilts. Take the airboat in.', 530, 1150, 2, null, now() - interval '95 minutes'),
  ('Police cruiser at the airport hangar', 'Hidden Car', 'Hangar door opens after the second story mission.', 650, 1230, 6, null, now() - interval '40 minutes'),
  ('Classic convertible at the lake house', 'Hidden Car', 'Garage on the north shore of the lake.', 690, 515, 3, null, now() - interval '220 minutes'),
  ('Speedboat under the island bridge', 'Hidden Car', 'Tied up under the bridge on the island side.', 1000, 1390, 1, null, now() - interval '15 minutes'),
  ('Street race meetup', 'Side Mission', 'Shows up on Friday nights in the city.', 1080, 880, 9, null, now() - interval '260 minutes'),
  ('Airboat smuggling run', 'Side Mission', 'Talk to the guy on the dock at the swamp edge.', 450, 1050, 3, null, now() - interval '130 minutes'),
  ('Rooftop photo job', 'Side Mission', 'Phone call after you reach the tallest towers downtown.', 800, 1350, 2, null, now() - interval '60 minutes'),
  ('Gold coin in the lighthouse', 'Collectible', 'Top of the lighthouse at the southern tip of the keys.', 130, 1890, 5, null, now() - interval '340 minutes'),
  ('Alien figurine on the hill', 'Collectible', 'Behind the launch tower out at the cape.', 1020, 150, -1, null, now() - interval '25 minutes'),
  ('Signal jammer on the water tower', 'Collectible', 'Climb the ladder on the tower by the highway.', 680, 270, 4, null, now() - interval '75 minutes')
) as seed(title, category, note, x, y, base_score, user_id, created_at)
where not exists (select 1 from public.pins where user_id is null);

-- ---------- Photo cards (added later) ----------
alter table public.pins add column if not exists image_url text;
alter table public.pins add column if not exists subtitle text check (char_length(subtitle) <= 40);
alter table public.pins add column if not exists details jsonb;

drop policy if exists "signed-in users add pins" on public.pins;
create policy "signed-in users add pins" on public.pins for insert to authenticated
  with check (user_id = auth.uid() and base_score = 0 and image_url is null and subtitle is null and details is null);
drop policy if exists "owners edit pins" on public.pins;
create policy "owners edit pins" on public.pins for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and base_score = 0 and image_url is null and subtitle is null and details is null);

drop view if exists public.pin_scores;
create view public.pin_scores with (security_invoker = true) as
select p.id, p.title, p.category, p.note, p.x, p.y, p.created_at,
       p.base_score + coalesce(sum(v.value), 0)::int as score,
       p.image_url, p.subtitle, p.details
from public.pins p
left join public.votes v on v.pin_id = p.id
group by p.id;
grant select on public.pin_scores to anon, authenticated;

insert into public.pins (title, category, note, x, y, base_score, user_id, created_at, image_url, subtitle, details)
select * from (values
  ('Vapid Smush! Ganado', 'Hidden Car', 'Next to the juice sign in front of the abandoned Smush! Fresh Juice stand, on the highway between Fort Myers and Miami.', 430, 1290, 6, null::uuid, now() - interval '50 minutes', '/pins/vapid-smush-ganado.webp', 'Standout Vehicle',
   '[["Access","Unlocked"],["Security","None"],["Tracker","None"],["Sell Value","$1,730"],["Type","Muscle"],["Era","1970s Antique"],["Seats","2"],["Storage","6"],["Body Condition","Poor"],["Specialist","Muscle"]]'::jsonb),
  ('Kalaga River Stunt Jump', 'Side Mission', 'On a dirt mound on the side of the lake road, just off the highway north of Lake Okeechobee.', 600, 470, 5, null, now() - interval '110 minutes', '/pins/kalaga-river-stunt-jump.webp', 'Stunt Jump',
   '[["Challenge","Land a front flip"]]'::jsonb)
) as s(title, category, note, x, y, base_score, user_id, created_at, image_url, subtitle, details)
where not exists (select 1 from public.pins where pins.title = s.title and pins.user_id is null);

-- ---------- Voting without sign-in (added later) ----------
-- One vote per pin per browser. The browser keeps a random voter id; nobody needs to sign in.
create table if not exists public.browser_votes (
  pin_id uuid not null references public.pins on delete cascade,
  voter_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (pin_id, voter_id)
);
alter table public.browser_votes enable row level security;

create or replace function public.cast_vote(p_pin uuid, p_voter uuid, p_value smallint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_value = 0 then
    delete from browser_votes where pin_id = p_pin and voter_id = p_voter;
  elsif p_value in (-1, 1) then
    insert into browser_votes (pin_id, voter_id, value) values (p_pin, p_voter, p_value)
    on conflict (pin_id, voter_id) do update set value = excluded.value, created_at = now();
  else
    raise exception 'vote must be -1, 0 or 1';
  end if;
end $$;

create or replace function public.my_votes(p_voter uuid)
returns table (pin_id uuid, value smallint) language sql security definer set search_path = public as $$
  select pin_id, value from browser_votes where voter_id = p_voter;
$$;

revoke all on function public.cast_vote(uuid, uuid, smallint) from public;
revoke all on function public.my_votes(uuid) from public;
grant execute on function public.cast_vote(uuid, uuid, smallint) to anon, authenticated;
grant execute on function public.my_votes(uuid) to anon, authenticated;

drop view if exists public.pin_scores;
create view public.pin_scores with (security_invoker = false) as
select p.id, p.title, p.category, p.note, p.x, p.y, p.created_at,
       p.base_score
         + coalesce((select sum(v.value) from votes v where v.pin_id = p.id), 0)::int
         + coalesce((select sum(b.value) from browser_votes b where b.pin_id = p.id), 0)::int as score,
       p.image_url, p.subtitle, p.details
from public.pins p;
grant select on public.pin_scores to anon, authenticated;
