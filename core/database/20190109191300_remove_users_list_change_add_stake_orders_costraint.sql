BEGIN;

DROP VIEW IF EXISTS users_list;

ALTER TABLE stake_orders
  DROP CONSTRAINT stake_orders_pkey;
ALTER TABLE stake_orders
  ADD CONSTRAINT stake_orders_pkey PRIMARY KEY (id);
ALTER TABLE stake_orders
  ADD CONSTRAINT stake_orders_trs_id_fk FOREIGN KEY (id) REFERENCES trs (id) ON DELETE CASCADE;
CREATE INDEX ON stake_orders ("stakeId");

COMMIT;
