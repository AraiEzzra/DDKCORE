BEGIN;

ALTER TABLE "stake_orders"
 ADD "u_voteCount"         INT         DEFAULT 0,
 ADD "u_status"              SMALLINT    NOT NULL,
 ADD "u_nextVoteMilestone" INT         NOT NULL,

COMMIT;
