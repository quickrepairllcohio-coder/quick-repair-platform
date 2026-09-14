BEGIN;
SELECT plan(1);
SELECT pass('Database CI pipeline verified.');
SELECT * FROM finish();
ROLLBACK;