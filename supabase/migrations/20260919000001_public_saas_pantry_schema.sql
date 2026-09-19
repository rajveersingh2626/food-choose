-- ==============================================================================
-- Food Decision & Smart Pantry Platform: Production Public Multi-Tenant Schema
-- ==============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. HOUSEHOLDS (Multi-Tenant Collaborative Isolation)
-- ------------------------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Kitchen',
  invite_code text unique default upper(substring(md5(random()::text) from 1 for 6)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  city text default 'Mumbai',
  household_id uuid references public.households(id) on delete set null,
  phone_number text, -- For WhatsApp / Push alerts
  dietary_preferences jsonb default '{
    "vegetarian": false,
    "vegan": false,
    "allergies": [],
    "favorite_cuisines": ["Modern Indian", "Italian", "Asian Cafe"],
    "spice_level": "medium"
  }'::jsonb,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  monthly_ai_usage integer default 0,
  monthly_ocr_usage integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 3. HOUSEHOLD MEMBERS (Collaborative Kitchen Sharing)
-- ------------------------------------------------------------------------------
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now() not null,
  unique(household_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 4. PANTRY ITEMS (Scoped to Household with Soft-Deletes)
-- ------------------------------------------------------------------------------
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  category text not null check (category in ('perishable', 'staple')),
  quantity numeric(10, 2) not null default 1.0,
  unit text not null default 'units', -- 'g', 'ml', 'units', 'packs', 'tbsp', etc.
  brand text,                         -- e.g., 'Urban Platter', 'Blue Tokai', 'Epigamia', etc.
  added_at timestamptz default now() not null,
  expires_at timestamptz,
  is_active boolean default true not null, -- Soft-delete: never drop exhausted items
  source text default 'manual' check (source in ('manual', 'ocr_receipt', 'ai_suggestion')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 5. RECIPES
-- ------------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  prep_time_minutes integer default 15,
  cook_time_minutes integer default 20,
  servings integer default 2,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  recipe_url text, -- Link to Instagram Reel / YouTube / Food52
  image_url text,
  is_aesthetic boolean default true,
  tags text[] default array['aesthetic', 'quick']::text[],
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 6. MEAL PLANS
-- ------------------------------------------------------------------------------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  planned_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid references public.recipes(id) on delete set null,
  custom_title text,
  ingredients jsonb not null default '[]'::jsonb,
  is_cooked boolean default false not null,
  cooked_at timestamptz,
  pantry_deducted boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
create index if not exists idx_household_members_lookup on public.household_members(user_id, household_id);
create index if not exists idx_pantry_household_active on public.pantry_items(household_id, is_active);
create index if not exists idx_pantry_expiry on public.pantry_items(expires_at) where is_active = true and category = 'perishable';
create index if not exists idx_meal_plans_household_date on public.meal_plans(household_id, planned_date);
create index if not exists idx_meal_plans_cooked_deduct on public.meal_plans(household_id, is_cooked, pantry_deducted);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;

-- Security Definer: Check household membership cleanly
create or replace function public.is_household_member(h_id uuid)
returns boolean security definer language sql stable as $$
  select exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

-- Drop existing policies if re-running migration
drop policy if exists "Household members can view household" on public.households;
drop policy if exists "Authenticated users can create households" on public.households;
drop policy if exists "Users can view own profile or household co-members" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Members can view co-members" on public.household_members;
drop policy if exists "Users can join households" on public.household_members;
drop policy if exists "Household pantry read access" on public.pantry_items;
drop policy if exists "Household pantry write access" on public.pantry_items;
drop policy if exists "Household pantry update access" on public.pantry_items;
drop policy if exists "Household recipes read access" on public.recipes;
drop policy if exists "Household recipes write access" on public.recipes;
drop policy if exists "Household meal plans read access" on public.meal_plans;
drop policy if exists "Household meal plans write access" on public.meal_plans;
drop policy if exists "Household meal plans update access" on public.meal_plans;

-- Household Policies
create policy "Household members can view household"
  on public.households for select
  using (public.is_household_member(id) or created_by = auth.uid());

create policy "Authenticated users can create households"
  on public.households for insert
  with check (auth.uid() is not null);

-- Profile Policies
create policy "Users can view own profile or household co-members"
  on public.profiles for select
  using (
    id = auth.uid() or 
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Household Members Policies
create policy "Members can view co-members"
  on public.household_members for select
  using (public.is_household_member(household_id));

create policy "Users can join households"
  on public.household_members for insert
  with check (user_id = auth.uid());

-- Pantry Items Policies
create policy "Household pantry read access"
  on public.pantry_items for select
  using (public.is_household_member(household_id));

create policy "Household pantry write access"
  on public.pantry_items for insert
  with check (public.is_household_member(household_id) and auth.uid() = created_by);

create policy "Household pantry update access"
  on public.pantry_items for update
  using (public.is_household_member(household_id));

-- Recipes Policies
create policy "Household recipes read access"
  on public.recipes for select
  using (public.is_household_member(household_id));

create policy "Household recipes write access"
  on public.recipes for insert
  with check (public.is_household_member(household_id) and auth.uid() = created_by);

-- Meal Plans Policies
create policy "Household meal plans read access"
  on public.meal_plans for select
  using (public.is_household_member(household_id));

create policy "Household meal plans write access"
  on public.meal_plans for insert
  with check (public.is_household_member(household_id) and auth.uid() = created_by);

create policy "Household meal plans update access"
  on public.meal_plans for update
  using (public.is_household_member(household_id));

-- ------------------------------------------------------------------------------
-- 9. TRIGGERS: ONBOARDING & TIMESTAMP MANAGEMENT
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pantry_updated_at on public.pantry_items;
create trigger tr_pantry_updated_at before update on public.pantry_items for each row execute procedure public.handle_updated_at();

drop trigger if exists tr_meal_plans_updated_at on public.meal_plans;
create trigger tr_meal_plans_updated_at before update on public.meal_plans for each row execute procedure public.handle_updated_at();

-- Auto-create Household and Profile upon auth.users signup
create or replace function public.handle_new_user()
returns trigger security definer language plpgsql as $$
declare
  new_household_id uuid;
begin
  -- 1. Create personal default household
  insert into public.households (name, created_by)
  values ('My Kitchen', new.id)
  returning id into new_household_id;

  -- 2. Link user as household owner
  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  -- 3. Create profile
  insert into public.profiles (id, email, full_name, household_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new_household_id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
