-- Automatically generate student codes: sh00001, sh00002, ...
-- Safe to run whether the students table is newly created or already exists.

create sequence if not exists public.students_student_code_seq
  start with 1
  increment by 1;

do $$
declare
  current_max bigint;
begin
  select coalesce(
    max(substring(student_code from '^sh([0-9]+)$')::bigint),
    0
  )
  into current_max
  from public.students;

  if current_max > 0 then
    perform setval('public.students_student_code_seq', current_max, true);
  else
    perform setval('public.students_student_code_seq', 1, false);
  end if;
end;
$$;

alter table public.students
  alter column student_code
  set default ('sh' || lpad(nextval('public.students_student_code_seq'::regclass)::text, 5, '0'));

alter sequence public.students_student_code_seq
  owned by public.students.student_code;

grant usage, select on sequence public.students_student_code_seq to authenticated;
