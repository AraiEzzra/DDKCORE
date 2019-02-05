BEGIN;

ALTER TABLE "stake_orders"
 ADD COLUMN "u_voteCount"         INT         DEFAULT 0,
 ADD COLUMN "u_status"            SMALLINT    DEFAULT 0,
 ADD COLUMN "u_nextVoteMilestone" INT         DEFAULT 0;

COMMIT;
