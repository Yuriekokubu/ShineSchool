-- ShineSchool Finance foundation
-- Run after migrations 001-005. All amounts are stored as numeric(12,2).
-- Admission approval and payment recording are performed through atomic admin RPCs.

create sequence if not exists public.student_invoice_number_seq start with 1;
create sequence if not exists public.student_receipt_number_seq start with 1;

alter table public.students
  add column if not exists admission_application_id uuid
  references public.admission_applications(id) on delete set null;

create unique index if not exists students_admission_application_id_uidx
  on public.students(admission_application_id)
  where admission_application_id is not null;

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  academic_year integer not null check (academic_year between 2400 and 2700),
  term_number smallint not null check (term_number between 1 and 3),
  start_date date not null,
  end_date date not null,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_terms_dates_valid check (start_date <= end_date),
  constraint academic_terms_due_date_valid check (due_date >= start_date),
  constraint academic_terms_year_term_unique unique (academic_year, term_number)
);

create unique index if not exists academic_terms_one_active_uidx
  on public.academic_terms(status) where status = 'active';

create table if not exists public.tuition_settings (
  id uuid primary key default gen_random_uuid(),
  academic_term_id uuid not null unique references public.academic_terms(id) on delete restrict,
  tuition_amount numeric(12,2) not null check (tuition_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  student_id uuid not null references public.students(id) on delete restrict,
  academic_term_id uuid not null references public.academic_terms(id) on delete restrict,
  issue_date date not null default current_date,
  due_date date not null,
  total_amount numeric(12,2) not null check (total_amount > 0),
  status text not null default 'pending' check (status in ('pending','partial','paid','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, academic_term_id)
);

create index if not exists student_invoices_due_date_idx
  on public.student_invoices(due_date) where status in ('pending','partial');
create index if not exists student_invoices_student_idx
  on public.student_invoices(student_id, created_at desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.student_invoices(id) on delete restrict,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','transfer')),
  paid_at timestamptz not null default now(),
  reference text,
  notes text,
  status text not null default 'posted' check (status in ('posted','void')),
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payments_student_paid_at_idx
  on public.payments(student_id, paid_at desc);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  invoice_id uuid not null references public.student_invoices(id) on delete restrict,
  allocated_amount numeric(12,2) not null check (allocated_amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

create index if not exists payment_allocations_invoice_idx
  on public.payment_allocations(invoice_id);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  invoice_id uuid not null unique references public.student_invoices(id) on delete restrict,
  total_amount numeric(12,2) not null check (total_amount > 0),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Timestamp maintenance.
create or replace function public.set_finance_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists academic_terms_updated_at on public.academic_terms;
create trigger academic_terms_updated_at before update on public.academic_terms
for each row execute function public.set_finance_updated_at();

drop trigger if exists tuition_settings_updated_at on public.tuition_settings;
create trigger tuition_settings_updated_at before update on public.tuition_settings
for each row execute function public.set_finance_updated_at();

drop trigger if exists student_invoices_updated_at on public.student_invoices;
create trigger student_invoices_updated_at before update on public.student_invoices
for each row execute function public.set_finance_updated_at();

-- Finance records are read-only from the browser. Writes are performed by
-- security-definer RPCs so payment history and receipts cannot be deleted or altered.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'academic_terms','tuition_settings','student_invoices','invoice_items',
    'payments','payment_allocations','receipts'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'Admins can read ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      'Admins can read ' || table_name, table_name
    );
  end loop;
end;
$$;

grant select on
  public.academic_terms, public.tuition_settings, public.student_invoices,
  public.invoice_items, public.payments, public.payment_allocations, public.receipts
to authenticated;

-- Enable Realtime updates for the finance screens.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['academic_terms','student_invoices','payments','receipts'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

-- Approve an admission, create its student record and create the current-term invoice atomically.
create or replace function public.admin_accept_admission(p_admission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  application_row public.admission_applications%rowtype;
  student_row public.students%rowtype;
  term_row public.academic_terms%rowtype;
  tuition_row public.tuition_settings%rowtype;
  invoice_row public.student_invoices%rowtype;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'สิทธิ์ไม่เพียงพอ';
  end if;

  select * into application_row
  from public.admission_applications
  where id = p_admission_id
  for update;

  if not found then raise exception 'ไม่พบใบสมัครเรียน'; end if;
  if application_row.status = 'rejected' then
    raise exception 'ใบสมัครนี้ถูกปฏิเสธแล้ว ไม่สามารถรับเข้าเรียนได้';
  end if;

  select * into student_row
  from public.students
  where admission_application_id = p_admission_id;

  if not found then
    select * into term_row from public.academic_terms where status = 'active' limit 1;
    if not found then raise exception 'กรุณากำหนดภาคเรียนที่ใช้งานก่อนรับนักเรียน'; end if;

    select * into tuition_row
    from public.tuition_settings
    where academic_term_id = term_row.id;
    if not found then raise exception 'กรุณากำหนดค่าเล่าเรียนของภาคเรียนปัจจุบันก่อน'; end if;

    insert into public.students (
      first_name, last_name, class_name, status, admission_application_id
    ) values (
      application_row.student_first_name,
      application_row.student_last_name,
      application_row.applying_level,
      'กำลังศึกษา',
      p_admission_id
    )
    returning * into student_row;

    insert into public.student_invoices (
      invoice_number, student_id, academic_term_id, due_date, total_amount
    ) values (
      'INV-' || to_char(now(), 'YYYY') || '-' ||
        lpad(nextval('public.student_invoice_number_seq')::text, 6, '0'),
      student_row.id, term_row.id, term_row.due_date, tuition_row.tuition_amount
    )
    returning * into invoice_row;

    insert into public.invoice_items(invoice_id, description, quantity, unit_price, line_total)
    values (invoice_row.id, 'ค่าเล่าเรียน ภาคเรียนที่ ' || term_row.term_number ||
      ' ปีการศึกษา ' || term_row.academic_year, 1, tuition_row.tuition_amount, tuition_row.tuition_amount);
  else
    select * into invoice_row
    from public.student_invoices
    where student_id = student_row.id
    order by created_at desc
    limit 1;
  end if;

  update public.admission_applications set status = 'accepted'
  where id = p_admission_id;

  return jsonb_build_object(
    'student_id', student_row.id,
    'student_code', student_row.student_code,
    'invoice_id', invoice_row.id,
    'invoice_number', invoice_row.invoice_number,
    'created', true
  );
end;
$$;

-- Record a payment against one invoice; issue the receipt only when the invoice is fully paid.
create or replace function public.admin_record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_paid_at timestamptz default now(),
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.student_invoices%rowtype;
  payment_id uuid;
  paid_total numeric(12,2);
  balance numeric(12,2);
  receipt_row public.receipts%rowtype;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'สิทธิ์ไม่เพียงพอ';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'จำนวนเงินต้องมากกว่า 0'; end if;
  if p_payment_method is null or p_payment_method not in ('cash','transfer') then raise exception 'ช่องทางชำระเงินไม่ถูกต้อง'; end if;

  select * into invoice_row from public.student_invoices
  where id = p_invoice_id for update;
  if not found then raise exception 'ไม่พบใบแจ้งหนี้'; end if;
  if invoice_row.status = 'cancelled' then raise exception 'ใบแจ้งหนี้ถูกยกเลิกแล้ว'; end if;

  select coalesce(sum(pa.allocated_amount),0) into paid_total
  from public.payment_allocations pa
  join public.payments p on p.id = pa.payment_id
  where pa.invoice_id = p_invoice_id and p.status = 'posted';

  balance := invoice_row.total_amount - paid_total;
  if p_amount > balance then raise exception 'จำนวนเงินเกินยอดคงเหลือ %.2f บาท', balance; end if;

  insert into public.payments(student_id, amount, payment_method, paid_at, reference, notes, recorded_by)
  values (invoice_row.student_id, p_amount, p_payment_method, coalesce(p_paid_at, now()), nullif(trim(p_reference),''), nullif(trim(p_notes),''), auth.uid())
  returning id into payment_id;

  insert into public.payment_allocations(payment_id, invoice_id, allocated_amount)
  values (payment_id, p_invoice_id, p_amount);

  paid_total := paid_total + p_amount;
  if paid_total >= invoice_row.total_amount then
    update public.student_invoices set status = 'paid' where id = p_invoice_id;
    insert into public.receipts(receipt_number, invoice_id, total_amount)
    values (
      'REC-' || to_char(now(), 'YYYY') || '-' ||
        lpad(nextval('public.student_receipt_number_seq')::text, 6, '0'),
      p_invoice_id, invoice_row.total_amount
    )
    on conflict (invoice_id) do nothing
    returning * into receipt_row;
    if receipt_row.id is null then
      select * into receipt_row from public.receipts where invoice_id = p_invoice_id;
    end if;
  else
    update public.student_invoices set status = 'partial' where id = p_invoice_id;
  end if;

  return jsonb_build_object(
    'payment_id', payment_id,
    'paid_total', paid_total,
    'balance', invoice_row.total_amount - paid_total,
    'invoice_status', case when paid_total >= invoice_row.total_amount then 'paid' else 'partial' end,
    'receipt_number', receipt_row.receipt_number
  );
end;
$$;

revoke all on function public.admin_accept_admission(uuid) from public;
revoke all on function public.admin_record_payment(uuid,numeric,text,timestamptz,text,text) from public;
grant execute on function public.admin_accept_admission(uuid) to authenticated;
grant execute on function public.admin_record_payment(uuid,numeric,text,timestamptz,text,text) to authenticated;

-- Configure one active academic term and its single tuition rate atomically.
create or replace function public.admin_configure_academic_term(
  p_academic_year integer,
  p_term_number smallint,
  p_start_date date,
  p_end_date date,
  p_due_date date,
  p_tuition_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  term_row public.academic_terms%rowtype;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'สิทธิ์ไม่เพียงพอ';
  end if;
  if p_academic_year not between 2400 and 2700 then raise exception 'ปีการศึกษาไม่ถูกต้อง'; end if;
  if p_term_number not between 1 and 3 then raise exception 'ภาคเรียนไม่ถูกต้อง'; end if;
  if p_start_date is null or p_end_date is null or p_due_date is null or p_start_date > p_end_date or p_due_date < p_start_date then
    raise exception 'กรุณาตรวจสอบวันที่เริ่มต้น วันสิ้นสุด และวันครบกำหนด';
  end if;
  if p_tuition_amount is null or p_tuition_amount <= 0 then raise exception 'ค่าเล่าเรียนต้องมากกว่า 0'; end if;

  update public.academic_terms set status = 'closed' where status = 'active';

  insert into public.academic_terms (
    academic_year, term_number, start_date, end_date, due_date, status
  ) values (
    p_academic_year, p_term_number, p_start_date, p_end_date, p_due_date, 'active'
  )
  on conflict (academic_year, term_number) do update set
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    due_date = excluded.due_date,
    status = 'active'
  returning * into term_row;

  insert into public.tuition_settings(academic_term_id, tuition_amount)
  values (term_row.id, p_tuition_amount)
  on conflict (academic_term_id) do update set tuition_amount = excluded.tuition_amount;

  return jsonb_build_object(
    'id', term_row.id,
    'academic_year', term_row.academic_year,
    'term_number', term_row.term_number,
    'tuition_amount', p_tuition_amount,
    'status', term_row.status
  );
end;
$$;

revoke all on function public.admin_configure_academic_term(integer,smallint,date,date,date,numeric) from public;
grant execute on function public.admin_configure_academic_term(integer,smallint,date,date,date,numeric) to authenticated;