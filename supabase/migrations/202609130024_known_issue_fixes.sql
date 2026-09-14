-- v1.9 used a non-existent users.auth_user_id column. Recreate the RPC against users.id=auth.uid().
create or replace function public.create_expense(
  p_scope public.expense_scope,
  p_amount numeric,
  p_vendor_id uuid default null,
  p_job_id uuid default null,
  p_description text default null,
  p_expense_date date default current_date,
  p_receipt_path text default null
) returns public.expenses
language plpgsql security definer set search_path=public as $$
declare v_exp public.expenses;
begin
  if public.current_user_role() not in ('finance','admin','super_admin') then raise exception 'Not authorized'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  insert into public.expenses(scope,subtotal,vendor_id,job_id,description,expense_date,receipt_path,created_by)
  values(p_scope,p_amount,p_vendor_id,p_job_id,p_description,p_expense_date,p_receipt_path,auth.uid())
  returning * into v_exp;
  return v_exp;
end $$;
grant execute on function public.create_expense(public.expense_scope,numeric,uuid,uuid,text,date,text) to authenticated;
-- v1.6 metadata trigger referenced file_path while request_media uses storage_path.
do $$ begin
  alter table public.request_media drop constraint if exists request_media_metadata_check;
exception when others then null; end $$;
