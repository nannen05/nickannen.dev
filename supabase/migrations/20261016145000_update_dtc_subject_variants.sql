-- Apply the current DTC A/B/C/D subject-line set without rewriting subjects
-- already assigned to enrollments. Existing sequences keep their original
-- subject for thread continuity and accurate send history.
update subject_variants sv
set
  subject = case sv.variant
    when 'A' then 'Quick question about {{company}}''s Shopify store'
    when 'B' then 'More Shopify projects than dev capacity?'
    when 'C' then 'Extra Shopify dev support for {{company}}?'
    when 'D' then 'More Shopify ideas than dev capacity?'
  end,
  enabled = true
from campaigns c
where sv.campaign_id = c.id
  and c.kind = 'dtc'
  and sv.variant in ('A', 'B', 'C', 'D');
