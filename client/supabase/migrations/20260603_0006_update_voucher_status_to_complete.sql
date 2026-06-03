do $$
begin
	if exists (
		select 1
		from pg_type
		where typnamespace = 'public'::regnamespace
		  and typname = 'voucher_status'
	) then
		alter type public.voucher_status rename to voucher_status_old;
	end if;
end $$;

create type public.voucher_status as enum ('draft', 'complete');

alter table public.vouchers
	alter column status drop default,
	alter column status type public.voucher_status
	using (
		case
			when status::text = 'draft' then 'draft'::public.voucher_status
			else 'complete'::public.voucher_status
		end
	),
	alter column status set default 'draft';

drop type if exists public.voucher_status_old;