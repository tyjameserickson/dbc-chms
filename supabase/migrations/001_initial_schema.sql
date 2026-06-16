-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Households ──────────────────────────────────────────────────────────────
create table households (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  zip           text,
  created_at    timestamptz default now()
);

-- ─── People ──────────────────────────────────────────────────────────────────
create type member_status as enum ('visitor', 'attendee', 'member', 'inactive');
create type gender_type   as enum ('male', 'female', 'other', 'prefer_not_to_say');

create table people (
  id               uuid primary key default uuid_generate_v4(),
  first_name       text not null,
  last_name        text not null,
  email            text unique,
  phone            text,
  mobile           text,
  birthday         date,
  gender           gender_type,
  photo_url        text,
  address_line1    text,
  address_line2    text,
  city             text,
  state            text,
  zip              text,
  status           member_status not null default 'visitor',
  household_id     uuid references households(id) on delete set null,
  envelope_number  text,
  notes            text,
  tags             text[] default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index people_last_name_idx  on people (last_name);
create index people_status_idx     on people (status);
create index people_household_idx  on people (household_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as 'begin new.updated_at = now(); return new; end;';

create trigger people_updated_at
  before update on people
  for each row execute function set_updated_at();

-- ─── Custom Fields ───────────────────────────────────────────────────────────
create type field_entity  as enum ('person', 'group', 'household');
create type field_type    as enum ('text', 'number', 'date', 'boolean', 'select');

create table custom_fields (
  id           uuid primary key default uuid_generate_v4(),
  entity_type  field_entity not null,
  field_name   text not null,
  field_type   field_type not null default 'text',
  options      text[],
  is_required  boolean default false,
  sort_order   int default 0
);

create table custom_field_values (
  id        uuid primary key default uuid_generate_v4(),
  field_id  uuid not null references custom_fields(id) on delete cascade,
  entity_id uuid not null,
  value     text
);

-- ─── Funds ───────────────────────────────────────────────────────────────────
create table funds (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

insert into funds (name, description) values
  ('General Fund',   'General operating budget'),
  ('Building Fund',  'Building and facility projects'),
  ('Missions Fund',  'Local and global missions');

-- ─── Giving Transactions ─────────────────────────────────────────────────────
create type giving_method as enum ('card', 'ach', 'cash', 'check', 'other');

create table giving_transactions (
  id                      uuid primary key default uuid_generate_v4(),
  person_id               uuid references people(id) on delete set null,
  household_id            uuid references households(id) on delete set null,
  fund_id                 uuid not null references funds(id),
  amount                  numeric(10,2) not null check (amount > 0),
  method                  giving_method not null default 'card',
  check_number            text,
  stripe_payment_intent_id text unique,
  given_at                timestamptz not null default now(),
  notes                   text,
  created_at              timestamptz default now()
);

create index giving_person_idx   on giving_transactions (person_id);
create index giving_fund_idx     on giving_transactions (fund_id);
create index giving_given_at_idx on giving_transactions (given_at desc);

-- ─── Groups ──────────────────────────────────────────────────────────────────
create type group_type as enum ('life_group', 'ministry', 'committee', 'class', 'other');

create table groups (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  type         group_type not null default 'life_group',
  leader_id    uuid references people(id) on delete set null,
  is_active    boolean default true,
  meeting_day  text,
  meeting_time time,
  location     text,
  created_at   timestamptz default now()
);

create table group_members (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  person_id  uuid not null references people(id) on delete cascade,
  role       text not null default 'member' check (role in ('leader','co_leader','member')),
  joined_at  timestamptz default now(),
  unique (group_id, person_id)
);

-- ─── Services & Attendance ───────────────────────────────────────────────────
create type service_type as enum ('sunday_am', 'sunday_pm', 'wednesday', 'special', 'other');

create table services (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  service_date date not null,
  service_time time,
  type         service_type not null default 'sunday_am',
  notes        text,
  created_at   timestamptz default now()
);

create index services_date_idx on services (service_date desc);

create table attendance (
  id              uuid primary key default uuid_generate_v4(),
  person_id       uuid not null references people(id) on delete cascade,
  service_id      uuid not null references services(id) on delete cascade,
  checked_in_at   timestamptz default now(),
  checked_in_by   uuid references people(id),
  unique (person_id, service_id)
);

create index attendance_service_idx on attendance (service_id);
create index attendance_person_idx  on attendance (person_id);

-- ─── Row-Level Security ──────────────────────────────────────────────────────
alter table people               enable row level security;
alter table households           enable row level security;
alter table giving_transactions  enable row level security;
alter table groups               enable row level security;
alter table group_members        enable row level security;
alter table services             enable row level security;
alter table attendance           enable row level security;
alter table funds                enable row level security;
alter table custom_fields        enable row level security;
alter table custom_field_values  enable row level security;

-- Authenticated users can read/write all records (staff-only app)
-- Scope down further per role once role system is built
create policy "authenticated_all" on people              for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on households          for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on giving_transactions for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on groups              for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on group_members       for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on services            for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on attendance          for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on funds               for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on custom_fields       for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on custom_field_values for all using (auth.role() = 'authenticated');
