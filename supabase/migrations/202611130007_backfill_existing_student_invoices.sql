-- Backfill tuition invoices for students enrolled before Finance was installed.
-- Safe to run more than once: existing invoices are never duplicated or overwritten.

create or replace function public.admin_generate_missing_student_invoices()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  term_row public.academic_terms%rowtype;
  tuition_row public.tuition_settings%rowtype;
  student_row record;
  invoice_row public.student_invoices%rowtype;
  created_count integer := 0;
  skipped_count integer := 0;
  generated_numbers text[] := array[]::text[];
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'สิทธิ์ไม่เพียงพอ';
  end if;

  select * into term_row
  from public.academic_terms
  where status = 'active'
  limit 1;

  if not found then
    raise exception 'กรุณากำหนดภาคเรียนที่ใช้งานก่อนสร้างใบแจ้งหนี้ย้อนหลัง';
  end if;

  select * into tuition_row
  from public.tuition_settings
  where academic_term_id = term_row.id;

  if not found then
    raise exception 'ไม่พบค่าเล่าเรียนของภาคเรียนปัจจุบัน';
  end if;

  -- Process only enrolled students. A unique constraint on (student_id, academic_term_id)
  -- prevents duplicate invoices even if this RPC is invoked concurrently.
  for student_row in
    select s.id, s.first_name, s.last_name
    from public.students s
    where not exists (
      select 1
      from public.student_invoices i
      where i.student_id = s.id
        and i.academic_term_id = term_row.id
    )
    order by s.created_at, s.id
    for update
  loop
    insert into public.student_invoices (
      invoice_number, student_id, academic_term_id, due_date, total_amount
    ) values (
      'INV-' || to_char(now(), 'YYYY') || '-' ||
        lpad(nextval('public.student_invoice_number_seq')::text, 6, '0'),
      student_row.id, term_row.id, term_row.due_date, tuition_row.tuition_amount
    )
    on conflict (student_id, academic_term_id) do nothing
    returning * into invoice_row;

    if invoice_row.id is not null then
      insert into public.invoice_items (
        invoice_id, description, quantity, unit_price, line_total
      ) values (
        invoice_row.id,
        'ค่าเล่าเรียน ภาคเรียนที่ ' || term_row.term_number ||
          ' ปีการศึกษา ' || term_row.academic_year,
        1, tuition_row.tuition_amount, tuition_row.tuition_amount
      );
      created_count := created_count + 1;
      generated_numbers := array_append(generated_numbers, invoice_row.invoice_number);
    else
      skipped_count := skipped_count + 1;
    end if;

    invoice_row := null;
  end loop;

  return jsonb_build_object(
    'academic_year', term_row.academic_year,
    'term_number', term_row.term_number,
    'tuition_amount', tuition_row.tuition_amount,
    'created_count', created_count,
    'skipped_count', skipped_count,
    'invoice_numbers', to_jsonb(generated_numbers)
  );
end;
$$;

revoke all on function public.admin_generate_missing_student_invoices() from public;
grant execute on function public.admin_generate_missing_student_invoices() to authenticated;
