INSERT INTO "_prisma_migrations" (id, checksum, migration_name, logs, finished_at, applied_steps_count)
VALUES (
  replace(gen_random_uuid()::text, '-', ''),
  '0' || repeat('0', 127),
  '20260718160000_add_zone_name',
  '[]',
  NOW(),
  1
);
