/* Create index for countStakeholders query optimization */
BEGIN;

CREATE index "stake_orders_sAddress" ON stake_orders ("senderId");

COMMIT;
