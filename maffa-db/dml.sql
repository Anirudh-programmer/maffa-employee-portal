-- ============================================================
-- DML Script — Seed data for Employee Engagement Platform
-- Aligned to Virtual Humanoid User Flow document
-- ============================================================
SET search_path TO "maffa", public;

-- Clear existing data
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE approvals RESTART IDENTITY CASCADE;
TRUNCATE TABLE query_escalations RESTART IDENTITY CASCADE;
TRUNCATE TABLE query_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE knowledge_base_articles RESTART IDENTITY CASCADE;
TRUNCATE TABLE survey_answers RESTART IDENTITY CASCADE;
TRUNCATE TABLE survey_responses RESTART IDENTITY CASCADE;
TRUNCATE TABLE survey_questions RESTART IDENTITY CASCADE;
TRUNCATE TABLE surveys RESTART IDENTITY CASCADE;
TRUNCATE TABLE event_participants RESTART IDENTITY CASCADE;
TRUNCATE TABLE engagement_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE recognition_delivery_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE recognition_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE recognition_templates RESTART IDENTITY CASCADE;
TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE employees RESTART IDENTITY CASCADE;

-- 1. Employees (matching humanoid doc personas)
INSERT INTO employees (name, role, department, email, date_of_birth, joining_date, employment_status, recognition_preference, location) VALUES
('Aisha Mehta',     'Employee',            'HR',          'aisha.mehta@example.com',   '1990-05-15', '2022-01-10', 'active',      'public',  'Bangalore'),
('Yogesh Y',        'HR Coordinator',      'HR',          'yogesh.y@example.com',      '1988-11-20', '2021-03-15', 'active',      'public',  'Hyderabad'),
('Rajesh Kumar',    'HR Ops Manager',      'HR',          'rajesh.kumar@example.com',  '1985-02-28', '2019-06-01', 'active',      'public',  'Hyderabad'),
('Rajib Basu',      'Compliance Reviewer', 'Compliance',  'rajib.basu@example.com',    '1982-08-12', '2020-11-20', 'active',      'private', 'Kolkata'),
('Sneha Rao',       'Lead Engineer',       'Engineering', 'sneha.rao@example.com',     '1992-03-05', '2021-07-01', 'active',      'public',  'Bangalore'),
('Vikram Singh',    'Product Manager',     'Product',     'vikram.singh@example.com',  '1987-12-10', '2020-02-15', 'active',      'public',  'Mumbai'),
('Ananya Iyer',     'Data Scientist',      'Engineering', 'ananya.iyer@example.com',   '1994-06-25', '2023-01-05', 'new_joiner',  'public',  'Bangalore'),
('Arjun Mehta',     'Sales Exec',          'Sales',       'arjun.mehta@example.com',   '1991-09-30', '2022-05-20', 'active',      'public',  'Delhi'),
('Priya Sharma',    'Finance Lead',        'Finance',     'priya.sharma@example.com',  '1989-04-18', '2021-09-10', 'active',      'public',  'Mumbai'),
('Rahul Verma',     'Ops Manager',         'Operations',  'rahul.verma@example.com',   '1986-10-05', '2020-08-01', 'active',      'public',  'Pune'),
('Suresh G',        'Software Engineer',   'Engineering', 'suresh.g@example.com',      '1993-01-12', '2023-03-15', 'on_leave',    'public',  'Hyderabad'),
('Meera K',         'QA Lead',             'Engineering', 'meera.k@example.com',       '1990-07-08', '2022-10-01', 'active',      'off',     'Bangalore');

-- 2. Recognition Templates
INSERT INTO recognition_templates (template_name, event_type, content, version, approved_status, created_by) VALUES
('Birthday Greeting v1',   'birthday',    'Happy Birthday, {employee_name}! Wishing you a fantastic day and a wonderful year ahead.', 1, 'approved', 2),
('Anniversary Greeting v1','anniversary', 'Happy {years} Year Anniversary, {employee_name}! Thank you for your incredible contribution.', 1, 'approved', 2),
('5-Year Milestone',       'anniversary', 'Congratulations, {employee_name}! Five years of impact.', 1, 'pending', 2),
('10-Year Milestone',      'anniversary', 'A decade of dedication, {employee_name}.', 1, 'pending', 2),
('Promotion Shoutout',     'other',       'Congratulations on your promotion, {employee_name}! Well deserved.', 1, 'approved', 2);

-- 3. Recognition Events
INSERT INTO recognition_events (employee_id, event_type, trigger_date, template_id, delivery_status) VALUES
(1, 'birthday',    '2026-04-24', 1, 'success'),
(5, 'anniversary', '2026-04-24', 2, 'success'),
(7, 'birthday',    '2026-04-25', 1, 'success'),
(8, 'other',       '2026-04-26', 5, 'success'),
(11,'other',       '2026-04-26', 5, 'failed'),
(12,'birthday',    '2026-04-27', 1, 'pending');

-- 4. Recognition Delivery Logs (multi-channel pipeline)
INSERT INTO recognition_delivery_logs (event_id, channel, delivery_status, retry_count, delivered_at) VALUES
(1, 'email',    'success', 0, '2026-04-24 09:00:00'),
(2, 'email',    'success', 0, '2026-04-24 09:00:00'),
(2, 'chat',     'success', 0, '2026-04-24 09:00:00'),
(3, 'email',    'success', 0, '2026-04-25 09:00:00'),
(4, 'email',    'success', 0, '2026-04-26 09:00:00'),
(5, 'email',    'failed',  2, NULL),
(5, 'chat',     'failed',  1, NULL),
(5, 'intranet', 'failed',  1, NULL);

-- 5. Engagement Events
INSERT INTO engagement_events (event_name, event_type, description, target_audience, registration_start, registration_end, event_start_time, event_end_time, event_date, status, approved_status, created_by) VALUES
('Wellness Week - Yoga',         'Team',     'Morning yoga session for wellness.',        'All Employees',         '2026-04-15', '2026-04-22', '2026-04-25 09:00:00', '2026-04-25 10:30:00', '2026-04-25', 'published', 'approved', 2),
('Tech Talk: AI Trends',         'Company',  'Monthly tech talk on AI.',                  'Engineering',           '2026-04-20', '2026-04-27', '2026-04-30 14:00:00', '2026-04-30 16:00:00', '2026-04-30', 'published', 'approved', 2),
('Townhall Q2',                  'Company',  'Quarterly townhall with leadership.',       'All Employees',         '2026-04-25', '2026-05-05', '2026-05-10 11:00:00', '2026-05-10 12:30:00', '2026-05-10', 'draft',     'pending',  2),
('Spring Hackathon',             'Team',     'Internal hackathon for product ideas.',     'Engineering, Product',  '2026-05-01', '2026-05-15', '2026-05-20 09:00:00', '2026-05-21 18:00:00', '2026-05-20', 'draft',     'pending',  2),
('Wellness Week - Day 2: Mindfulness','Team','Mindfulness session as part of wellness week.','All Employees',     '2026-04-25', '2026-04-29', '2026-04-30 10:00:00', '2026-04-30 11:00:00', '2026-04-30', 'draft',     'pending',  2);

-- 6. Event Participants
INSERT INTO event_participants (event_id, employee_id, registration_status, participation_status, feedback_rating) VALUES
(1, 1,  TRUE, 'participated', 4.5),
(1, 2,  TRUE, 'participated', 5.0),
(1, 3,  TRUE, 'absent',       NULL),
(2, 5,  TRUE, 'registered',   NULL),
(2, 6,  TRUE, 'registered',   NULL),
(2, 7,  TRUE, 'registered',   NULL),
(2, 11, TRUE, 'registered',   NULL);

-- 7. Surveys (Q2 = 5 questions, Anonymous, 74% response; Wellness Pulse = pending, non-anonymous)
INSERT INTO surveys (title, description, target_audience, audience, open_date, close_date, is_anonymous, status, approved_status, created_by) VALUES
('Q2 Engagement Survey',  'Quarterly engagement pulse — 5 questions, anonymous.', 'All Employees', 'All Employees', '2026-04-15', '2026-04-30', TRUE,  'active',           'approved', 2),
('Wellness Pulse Check',  'APAC region wellness check — non-anonymous.',           'APAC',          'APAC',          '2026-05-01', '2026-05-07', FALSE, 'pending_approval', 'pending',  2);

-- 8. Survey Questions for Q2 (5 questions per humanoid spec)
INSERT INTO survey_questions (survey_id, question_order, question_text, question_type, options) VALUES
(1, 1, 'How would you rate your overall work-life balance this quarter?', 'rating',
   '{"min":1,"max":5,"min_label":"Poor","max_label":"Excellent"}'::jsonb),
(1, 2, 'How clear is communication from leadership?', 'mcq',
   '["Very clear — always informed","Mostly clear — occasional gaps","Sometimes unclear — needs context","Not clear at all"]'::jsonb),
(1, 3, 'How would you rate the quality of HR programs and events?', 'rating',
   '{"min":1,"max":5,"min_label":"Poor","max_label":"Excellent"}'::jsonb),
(1, 4, 'Do you feel recognized for your contributions?', 'mcq',
   '["Always","Often","Sometimes","Rarely","Never"]'::jsonb),
(1, 5, 'What one thing could HR do to improve your experience?', 'text', NULL);

-- Wellness Pulse questions
INSERT INTO survey_questions (survey_id, question_order, question_text, question_type, options) VALUES
(2, 1, 'How would you rate your overall wellbeing this month?', 'rating',
   '{"min":1,"max":5,"min_label":"Poor","max_label":"Excellent"}'::jsonb),
(2, 2, 'Are you taking adequate breaks during work?', 'mcq',
   '["Yes, daily","Most days","Rarely","Never"]'::jsonb);

-- 9. Survey Responses for Q2 (simulating ~74% of 12 employees = ~9 responses, anonymous)
INSERT INTO survey_responses (survey_id, employee_id, is_anonymous) VALUES
(1, NULL, TRUE),(1, NULL, TRUE),(1, NULL, TRUE),(1, NULL, TRUE),(1, NULL, TRUE),
(1, NULL, TRUE),(1, NULL, TRUE),(1, NULL, TRUE),(1, NULL, TRUE);

-- 10. Knowledge Base Articles
INSERT INTO knowledge_base_articles (title, content, category, role_tag, author, version, status, last_reviewed_date, review_due_date, keywords) VALUES
('Performance Management Policy v3', 'The next appraisal cycle starts 1 June 2026. Self-assessments due 7 June. Manager reviews complete by 30 June. Final calibration in July.', 'Performance', 'All', 3, 3, 'published', '2026-01-15', '2026-07-15', 'appraisal cycle next begin start performance review evaluation rating'),
('Annual Leave Policy',              '25 days per year including public holidays. Carry-over up to 5 days. Apply via HRMS.', 'Leave', 'All', 3, 2, 'published', '2026-02-10', '2026-08-10', 'annual leave policy days vacation holiday time off'),
('Travel Insurance Guidelines',      '$50 per day for food and incidentals. Submit receipts within 14 days of return.', 'Insurance', 'All', 3, 1, 'published', '2026-03-01', '2026-09-01', 'travel insurance reimbursement claim food per diem incidentals'),
('Parental Leave Process',           'Submit request via HRMS 3 months in advance. 26 weeks paid leave for primary caregiver.', 'Benefits', 'All', 3, 2, 'published', '2026-01-20', '2026-07-20', 'parental leave maternity paternity caregiver apply process'),
('VPN Setup Guide',                  'Install Cisco AnyConnect from the app portal. Use SSO credentials. Contact IT for issues.', 'IT', 'All', 3, 1, 'published', '2026-02-15', '2026-08-15', 'vpn setup install cisco anyconnect remote network'),
('Remote Work Policy v3',            'Remote work abroad is allowed for up to 30 days. Manager approval required. Tax implications apply.', 'Policy', 'All', 3, 3, 'published', '2026-03-10', '2026-09-10', 'remote work wfh abroad foreign overseas country travel approval'),
('New Joiner Onboarding',            'New joiners complete orientation in week 1. Buddy assigned for first 30 days. Standard kit issued day 1.', 'Onboarding', 'All', 3, 2, 'published', '2026-02-01', '2026-08-01', 'new joiner onboarding orientation buddy kit week first day'),
('WFH Allowance Schedule',           'WFH allowance is INR 2000/month for confirmed employees. New joiners eligible after 90 days.', 'Benefits', 'All', 3, 1, 'published', '2026-02-20', '2026-08-20', 'wfh work from home allowance new joiners stipend eligibility'),
('Visa & Work Permit Guide',         'Visa applications require 6 weeks lead time. HR Travel desk handles all processing.', 'Travel', 'All', 3, 1, 'published', '2026-03-15', '2026-09-15', 'visa work permit international travel application processing'),
('Health Benefits Summary',          'Comprehensive health cover for self + dependents. INR 5L base + INR 10L top-up available.', 'Benefits', 'All', 3, 1, 'published', '2026-01-25', '2026-07-25', 'health insurance benefits medical dependents top-up cover');

-- 11. Query Logs (with three-tier confidence: high, partial, low)
INSERT INTO query_logs (employee_id, query_text, matched_article_id, confidence_score, confidence_band, response_delivered, escalation_flag) VALUES
(1, 'When does the next appraisal cycle begin?',  1,    0.94, 'high',    'The next appraisal cycle starts 1 June 2026. Self-assessments due 7 June.', FALSE),
(5, 'Can I work from Thailand?',                   6,    0.91, 'high',    'Remote work abroad is allowed for up to 30 days with manager approval.',     FALSE),
(8, 'How much is travel reimbursement?',           3,    0.78, 'partial', 'Found 3 related articles — see Travel Insurance, Health Benefits.',          FALSE),
(11,'What about insurance for my parents?',       NULL,  0.55, 'low',     'I do not have a confident match. Routing to HR.',                            TRUE),
(8, 'Can I combine sabbatical with unpaid leave?',NULL,  0.32, 'low',     'I do not have a confident match. Routing to HR.',                            TRUE);

-- 12. Query Escalations
INSERT INTO query_escalations (query_id, employee_id, ticket_ref, assigned_to, status, sla_due_at, created_at) VALUES
(4, 11, 'EMP-3010', 3, 'open',        CURRENT_TIMESTAMP + INTERVAL '40 hours', CURRENT_TIMESTAMP - INTERVAL '8 hours'),
(5, 8,  'EMP-3011', 3, 'in_progress', CURRENT_TIMESTAMP + INTERVAL '36 hours', CURRENT_TIMESTAMP - INTERVAL '12 hours');

-- 13. Approvals queue (1 urgent + 4 pending = 5 items, with SLA timers)
INSERT INTO approvals (content_type, content_id, title, submitter_id, status, reviewer_id, comments, sla_due_at, created_at) VALUES
('article',  9, 'Visa & Work Permit Guide',         2, 'pending', 3, 'New article on visa processing for international employees.', CURRENT_TIMESTAMP + INTERVAL '6 hours',  CURRENT_TIMESTAMP - INTERVAL '18 hours'),
('survey',   2, 'Wellness Pulse Check',             2, 'pending', 3, 'APAC wellness pulse — non-anonymous, requires Ops Mgr review.', CURRENT_TIMESTAMP + INTERVAL '14 hours', CURRENT_TIMESTAMP - INTERVAL '10 hours'),
('article',  6, 'Remote Work Policy v3',            2, 'pending', 3, 'Updated remote work policy with new abroad-work rules.',         CURRENT_TIMESTAMP + INTERVAL '20 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('event',    5, 'Wellness Week - Day 2: Mindfulness',2,'pending', 3, 'Day 2 mindfulness session of wellness week.',                    CURRENT_TIMESTAMP + INTERVAL '22 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('article', 10, 'Leave Policy v4',                  2, 'approved', 3, 'Updated leave policy approved.',                                CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '24 hours');

-- 14. Audit Logs (BR-006 — append-only)
INSERT INTO audit_logs (event_type, employee_id, content_id, channel, outcome, reviewer_decision, detail, is_anonymous) VALUES
('Recognition Delivered', 1,    1, 'email',    'success',   NULL,        'Birthday message delivered to Aisha Mehta',         FALSE),
('Recognition Delivered', 5,    2, 'chat',     'success',   NULL,        '5-year anniversary message delivered to Sneha Rao', FALSE),
('Recognition Failed',    11,   5, 'email',    'failed',    NULL,        'Email delivery failed after 2 retries',             FALSE),
('Event Approved',        3,    1, 'web',      'success',   'approved',  'Wellness Week - Yoga approved',                     FALSE),
('Event Participation',   1,    1, 'web',      'participated', NULL,     'Aisha participated in Wellness Yoga',               FALSE),
('Survey Submitted',      NULL, 1, 'web',      'success',   NULL,        'Anonymous response submitted to Q2 Engagement',     TRUE),
('Survey Submitted',      NULL, 1, 'web',      'success',   NULL,        'Anonymous response submitted to Q2 Engagement',     TRUE),
('Query Resolved',        1,    1, 'chat',     'success',   NULL,        'Query matched at 94%: appraisal cycle',             FALSE),
('Query Partial-Match',   8,    3, 'chat',     'partial',   NULL,        'Query at 78% — 3 related articles returned',        FALSE),
('Query Escalated',       11,   4, 'web',      'escalated', NULL,        'EMP-3010 created — query below 60% confidence',     FALSE),
('Query Escalated',       8,    5, 'web',      'escalated', NULL,        'EMP-3011 created — query below 60% confidence',     FALSE),
('Content Approved',      3,   10, 'web',      'success',   'approved',  'Leave Policy v4 approved by Rajesh Kumar',          FALSE),
('Content Rejected',      3,    9, 'web',      'rejected',  'rejected',  'Visa Guide returned for revision',                  FALSE),
('Article Viewed',        1,    1, 'web',      'success',   NULL,        'Aisha viewed Performance Management Policy',        FALSE);

-- 15. Notifications
INSERT INTO notifications (employee_id, title, message, notification_type, channel, status) VALUES
(1, 'Birthday Wishes',          'Happy Birthday, Aisha! Wishing you a fantastic day.',          'recognition',  'email',    'sent'),
(1, 'Q2 Survey Open',           'The Q2 Engagement Survey is now open. Please respond by 30 April.', 'survey',  'intranet', 'sent'),
(5, 'Tech Talk Reminder',       'Tech Talk: AI Trends starts in 1 hour.',                       'event',        'chat',     'pending'),
(3, 'Approval Pending',         '4 items awaiting your approval — 1 urgent.',                   'system',       'intranet', 'sent'),
(11,'Query Routed to HR',       'EMP-3010 escalated — HR team will respond within 48 hours.',   'query_response','intranet','sent');

-- 16. Tasks (sticky note / today's tasks widget)
INSERT INTO tasks (txt, done) VALUES
('Approve Visa & Work Permit Guide', FALSE),
('Review Q2 survey responses',       FALSE),
('Send weekly engagement digest',    FALSE);
