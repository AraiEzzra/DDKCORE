/* Create index for countStakeholders query optimization */
BEGIN;

CREATE INDEX "stake_orders_sAddress"
  ON stake_orders ("senderId");

COMMIT;
