-- Quick Repair v1.7 database smoke tests.
-- Run with: supabase test db
begin;
select plan(6);

select has_table('public', 'users', 'users table exists');
select has_table('public', 'jobs', 'jobs table exists');
select has_table('public', 'job_status_history', 'job status history exists');
select has_table('public', 'notifications', 'notifications table exists');
select has_table('public', 'messages', 'messages table exists');
select has_function('public', 'current_user_role', 'role helper exists');

select * from finish();
rollback;
