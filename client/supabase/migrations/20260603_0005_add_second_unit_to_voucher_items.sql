begin;

alter table if exists public.voucher_items
add column if not exists unit_2 numeric(12,2) not null default 1;

update public.voucher_items
set unit_2 = 1
where unit_2 is null or unit_2 <= 0;

alter table if exists public.voucher_items
drop column if exists line_total;

alter table public.voucher_items
add column line_total numeric(12,2) generated always as (quantity * unit * unit_2 * unit_price) stored;

commit;