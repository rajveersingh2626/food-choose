-- ==============================================================================
-- Migration: AI Context-Aware Perishability & Gamified Pantry Audit Schema
-- ==============================================================================

-- 1. Add storage_method to pantry_items table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pantry_items' and column_name = 'storage_method'
  ) then
    alter table public.pantry_items 
      add column storage_method text not null default 'fridge' check (storage_method in ('fridge', 'freezer', 'counter'));
  end if;
end $$;

-- 2. Add audit fields to track gamified swipe history and extensions
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pantry_items' and column_name = 'last_audited_at'
  ) then
    alter table public.pantry_items 
      add column last_audited_at timestamptz default now() not null,
      add column audit_extension_count integer default 0 not null;
  end if;
end $$;

-- 3. Index for Gamified Pantry Audit queries (expiring soonest, active)
create index if not exists idx_pantry_audit_queue
  on public.pantry_items(household_id, expires_at)
  where is_active = true and expires_at is not null;

-- 4. Atomic Function: Extend Freshness (Swipe Right / "Still Good")
create or replace function public.extend_pantry_item_freshness(
  target_item_id uuid,
  extension_days integer default 2
)
returns jsonb
security definer
language plpgsql as $$
declare
  target_item record;
  new_expiry timestamptz;
begin
  -- Fetch and verify household membership
  select * into target_item 
  from public.pantry_items 
  where id = target_item_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Item not found');
  end if;

  if not public.is_household_member(target_item.household_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  -- Calculate extended expiration date (from current expires_at or now if already passed)
  new_expiry := greatest(coalesce(target_item.expires_at, now()), now()) + (extension_days || ' days')::interval;

  update public.pantry_items
  set 
    expires_at = new_expiry,
    last_audited_at = now(),
    audit_extension_count = target_item.audit_extension_count + 1,
    updated_at = now()
  where id = target_item_id;

  return jsonb_build_object(
    'success', true,
    'id', target_item_id,
    'new_expires_at', new_expiry,
    'extension_count', target_item.audit_extension_count + 1
  );
end;
$$;

-- 5. Atomic Function: Soft Delete on Audit (Swipe Left / "Trashed / Ran Out")
create or replace function public.audit_soft_delete_pantry_item(
  target_item_id uuid
)
returns jsonb
security definer
language plpgsql as $$
declare
  target_item record;
begin
  select * into target_item 
  from public.pantry_items 
  where id = target_item_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Item not found');
  end if;

  if not public.is_household_member(target_item.household_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  update public.pantry_items
  set 
    is_active = false,
    quantity = 0,
    last_audited_at = now(),
    updated_at = now()
  where id = target_item_id;

  return jsonb_build_object(
    'success', true,
    'id', target_item_id,
    'is_active', false
  );
end;
$$;
