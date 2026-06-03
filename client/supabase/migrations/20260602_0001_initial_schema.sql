create extension if not exists pgcrypto;

create type public.voucher_status as enum ('draft', 'paid', 'pending', 'void');

drop index if exists vouchers_shop_id_idx;
alter table if exists public.vouchers drop column if exists shop_id;
drop table if exists public.shops cascade;

create table if not exists public.snacks (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	sku text unique,
	unit_1 numeric(12,2) not null default 1,
	unit_2 numeric(12,2) not null default 1,
	unit_3 numeric(12,2) not null default 1,
	regular_price numeric(12,2) not null default 0,
	total_price numeric(12,2) not null default 0,
	unit text not null default 'pc',

	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.vouchers (
	id uuid primary key default gen_random_uuid(),
	voucher_number text not null unique,
	voucher_date date not null default current_date,
	customer_note text,
	status public.voucher_status not null default 'draft',
	subtotal numeric(12,2) not null default 0,
	discount numeric(12,2) not null default 0,
	total numeric(12,2) not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.voucher_items (
	id uuid primary key default gen_random_uuid(),
	voucher_id uuid not null references public.vouchers(id) on delete cascade,
	snack_id uuid references public.snacks(id) on delete set null,
	item_name text not null,
	unit_1 numeric(12,2) not null default 1,
	unit_2 numeric(12,2) not null default 1,
	unit_3 numeric(12,2) not null default 1,
	quantity integer not null check (quantity > 0),
	unit_price numeric(12,2) not null check (unit_price >= 0),
	line_total numeric(12,2) generated always as (quantity * unit_price) stored,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists vouchers_status_idx on public.vouchers(status);
create index if not exists vouchers_voucher_date_idx on public.vouchers(voucher_date desc);
create index if not exists voucher_items_voucher_id_idx on public.voucher_items(voucher_id);
create index if not exists snacks_name_idx on public.snacks(name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists set_snacks_updated_at on public.snacks;
create trigger set_snacks_updated_at
before update on public.snacks
for each row execute function public.set_updated_at();

drop trigger if exists set_vouchers_updated_at on public.vouchers;
create trigger set_vouchers_updated_at
before update on public.vouchers
for each row execute function public.set_updated_at();

drop trigger if exists set_voucher_items_updated_at on public.voucher_items;
create trigger set_voucher_items_updated_at
before update on public.voucher_items
for each row execute function public.set_updated_at();

alter table public.snacks enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_items enable row level security;

drop policy if exists "read snacks" on public.snacks;
create policy "read snacks"
on public.snacks
for select
using (true);

drop policy if exists "manage snacks" on public.snacks;
create policy "manage snacks"
on public.snacks
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "read vouchers" on public.vouchers;
create policy "read vouchers"
on public.vouchers
for select
using (true);

drop policy if exists "manage vouchers" on public.vouchers;
create policy "manage vouchers"
on public.vouchers
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "read voucher items" on public.voucher_items;
create policy "read voucher items"
on public.voucher_items
for select
using (true);

drop policy if exists "manage voucher items" on public.voucher_items;
create policy "manage voucher items"
on public.voucher_items
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create or replace function public.recalculate_voucher_totals(p_voucher_id uuid)
returns void
language plpgsql
security definer
as $$
declare
	calculated_subtotal numeric(12,2);
	calculated_discount numeric(12,2);
begin
	select coalesce(sum(line_total), 0)
	into calculated_subtotal
	from public.voucher_items
	where voucher_id = p_voucher_id;

	select discount
	into calculated_discount
	from public.vouchers
	where id = p_voucher_id;

	update public.vouchers
	set subtotal = coalesce(calculated_subtotal, 0),
		total = greatest(coalesce(calculated_subtotal, 0) - coalesce(calculated_discount, 0), 0),
		updated_at = now()
	where id = p_voucher_id;
end;
$$;

create or replace function public.sync_voucher_totals()
returns trigger
language plpgsql
as $$
begin
	if (tg_op = 'DELETE') then
		perform public.recalculate_voucher_totals(old.voucher_id);
		return old;
	else
		perform public.recalculate_voucher_totals(new.voucher_id);
		return new;
	end if;
end;
$$;

drop trigger if exists sync_voucher_totals_on_items on public.voucher_items;
create trigger sync_voucher_totals_on_items
after insert or update or delete on public.voucher_items
for each row execute function public.sync_voucher_totals();
