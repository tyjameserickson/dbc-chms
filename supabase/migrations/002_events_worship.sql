-- ─── Events ──────────────────────────────────────────────────────────────────
create table events (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  location     text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  capacity     int,
  image_url    text,
  is_public    boolean default true,
  created_by   uuid references people(id) on delete set null,
  created_at   timestamptz default now()
);

create index events_starts_at_idx on events (starts_at);

create table event_registrations (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references events(id) on delete cascade,
  person_id    uuid references people(id) on delete cascade,
  name         text,
  email        text,
  status       text not null default 'registered' check (status in ('registered','attended','cancelled')),
  registered_at timestamptz default now(),
  unique (event_id, person_id)
);

create index event_reg_event_idx on event_registrations (event_id);

-- ─── Songs ───────────────────────────────────────────────────────────────────
create table songs (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  author       text,
  ccli_number  text,
  default_key  text,
  tempo        text,
  themes       text[] default '{}',
  lyrics       text,
  chord_chart  text,
  notes        text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger songs_updated_at
  before update on songs
  for each row execute function set_updated_at();

-- ─── Worship Services ────────────────────────────────────────────────────────
create table worship_services (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  service_date date not null,
  service_time time,
  notes        text,
  created_at   timestamptz default now()
);

create index worship_services_date_idx on worship_services (service_date desc);

create table service_items (
  id               uuid primary key default uuid_generate_v4(),
  worship_service_id uuid not null references worship_services(id) on delete cascade,
  type             text not null check (type in ('song','scripture','prayer','announcement','offering','sermon','other')),
  title            text not null,
  song_id          uuid references songs(id) on delete set null,
  duration_minutes int,
  notes            text,
  sort_order       int not null default 0
);

create index service_items_service_idx on service_items (worship_service_id, sort_order);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table events                enable row level security;
alter table event_registrations   enable row level security;
alter table songs                  enable row level security;
alter table worship_services       enable row level security;
alter table service_items          enable row level security;

create policy "authenticated_all" on events              for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on event_registrations for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on songs               for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on worship_services    for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on service_items       for all using (auth.role() = 'authenticated');
