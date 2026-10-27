create or replace function public.admin_lead_queue(
  search_term text default '',
  page_number integer default 1,
  rows_per_page integer default 50,
  order_mode text default 'updated'
)
returns table(
  id bigint,
  company_id bigint,
  first_name text,
  last_name text,
  email text,
  title text,
  score integer,
  status text,
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  paused_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  company_name text,
  company_domain text,
  enrollment_id bigint,
  enrollment_status text,
  subject_line text,
  enrolled_at timestamptz,
  next_due_at timestamptz,
  reply_status text,
  reply_classification text,
  next_step_number integer,
  next_step_status text,
  next_step_due_at timestamptz,
  next_step_sent_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path=public
as $$
  with latest_enrollment as (
    select distinct on (e.contact_id)
      e.id, e.contact_id, e.status, e.subject_line, e.enrolled_at, e.next_due_at,
      e.reply_status, e.reply_classification
    from enrollments e
    order by e.contact_id, e.enrolled_at desc, e.id desc
  ),
  next_step as (
    select distinct on (ss.enrollment_id)
      ss.enrollment_id, ss.step_number, ss.status, ss.due_at, ss.sent_at
    from sequence_steps ss
    where ss.status in ('pending', 'sending')
    order by ss.enrollment_id, ss.step_number asc
  ),
  queue as (
    select
      c.id, c.company_id, c.first_name, c.last_name, c.email, c.title, c.score, c.status,
      c.unsubscribed_at, c.bounced_at, c.paused_at, c.created_at, c.updated_at,
      co.name as company_name, co.domain as company_domain,
      e.id as enrollment_id, e.status as enrollment_status, e.subject_line, e.enrolled_at,
      e.next_due_at, e.reply_status, e.reply_classification,
      ss.step_number as next_step_number, ss.status as next_step_status,
      ss.due_at as next_step_due_at, ss.sent_at as next_step_sent_at,
      case
        when c.unsubscribed_at is not null or c.bounced_at is not null or c.paused_at is not null then 6
        when e.id is null then 5
        when e.status = 'queued' then 1
        when e.status = 'active' then 2
        when e.status = 'replied' then 3
        when e.status = 'complete' then 4
        else 7
      end as sequence_rank
    from contacts c
    left join companies co on co.id = c.company_id
    left join latest_enrollment e on e.contact_id = c.id
    left join next_step ss on ss.enrollment_id = e.id
    where trim(search_term) = ''
      or concat_ws(' ', c.first_name, c.last_name, c.email, c.title) ilike '%' || trim(search_term) || '%'
  )
  select
    id, company_id, first_name, last_name, email, title, score, status,
    unsubscribed_at, bounced_at, paused_at, created_at, updated_at,
    company_name, company_domain, enrollment_id, enrollment_status, subject_line,
    enrolled_at, next_due_at, reply_status, reply_classification,
    next_step_number, next_step_status, next_step_due_at, next_step_sent_at,
    count(*) over()::bigint as total_count
  from queue
  order by
    case when order_mode = 'sequence' then sequence_rank else 0 end asc,
    updated_at desc,
    id desc
  limit least(greatest(rows_per_page, 10), 100)
  offset greatest(page_number - 1, 0) * least(greatest(rows_per_page, 10), 100);
$$;
