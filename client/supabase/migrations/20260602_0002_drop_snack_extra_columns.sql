drop trigger if exists set_snacks_updated_at on public.snacks;

alter table if exists public.snacks
	drop column if exists sku,
	drop column if exists unit_1,
	drop column if exists unit_2,
	drop column if exists unit_3,
	drop column if exists regular_price,
	drop column if exists total_price,
	drop column if exists unit,
	drop column if exists is_active,
	drop column if exists created_at,
	drop column if exists updated_at;
