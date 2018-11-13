/* Rename isTransferred TO transferCount for better understanding */
BEGIN;

ALTER TABLE "stake_orders" RENAME COLUMN "isTransferred" TO "transferCount";

COMMIT;