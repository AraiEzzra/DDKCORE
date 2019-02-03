BEGIN;

ALTER TABLE "mem_accounts"
  DROP COLUMN IF EXISTS "u_totalFrozeAmount";

ALTER TABLE "mem_accounts"
  ADD COLUMN "u_totalFrozeAmount" BIGINT DEFAULT 0;

COMMIT;
