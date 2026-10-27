-- Update the live DTC Day 0 template. The template is resolved at send time,
-- so pending first sends will use this version after the migration is applied.
update templates t
set body = $$Hey {{first_name}},

I'm Nick, a Shopify developer helping ecommerce brands build better shopping experiences and turn new ideas into live, conversion-focused features.

I work on everything from custom PDPs, landing pages, and storefront functionality to A/B testing, subscription experiences, and ongoing site improvements.

Whether your team has a growing development backlog, wants to test new ideas, or just needs an extra experienced developer to keep things moving, I'd love to help as a flexible extension of your team without the need to bring on another full-time hire.

You can check out some of my work at {{website_link}}.

If you're open to chatting, here's my calendar: {{calendar_link}}.

Cheers,
Nick$$
from campaigns c
where t.campaign_id = c.id
  and c.kind = 'dtc'
  and t.step_number = 0;
