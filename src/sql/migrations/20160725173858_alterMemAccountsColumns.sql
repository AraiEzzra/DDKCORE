/* Alter Mem Accounts Columns
 *
 */

BEGIN;

ALTER TABLE "mem_accounts" ALTER COLUMN "multimin" TYPE SMALLINT;

ALTER TABLE "mem_accounts" ALTER COLUMN "u_multimin" TYPE SMALLINT;

ALTER TABLE "mem_accounts" ALTER COLUMN "multilifetime" TYPE SMALLINT;

ALTER TABLE "mem_accounts" ALTER COLUMN "u_multilifetime" TYPE SMALLINT;

ALTER TABLE "mem_accounts" ADD COLUMN "u_totalFrozeAmount" BIGINT DEFAULT 0 ;

COMMIT;
