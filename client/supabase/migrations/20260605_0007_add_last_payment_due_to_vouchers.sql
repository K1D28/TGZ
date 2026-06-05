alter table if exists public.vouchers
add column if not exists last_payment_due numeric(12,2) not null default 0;