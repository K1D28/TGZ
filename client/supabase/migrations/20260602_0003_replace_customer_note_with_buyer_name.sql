-- Migration: replace customer_note with buyer_name on vouchers
begin;

-- Add buyer_name column (nullable)
alter table if exists public.vouchers
add column if not exists buyer_name text;

-- Copy existing customer_note values into buyer_name (if present)
update public.vouchers
set buyer_name = customer_note
where customer_note is not null;

-- Drop customer_note column
alter table if exists public.vouchers
drop column if exists customer_note;

commit;

-- Update: this migration preserves old values by moving them to buyer_name before dropping the column.
