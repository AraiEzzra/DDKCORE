BEGIN;

DROP TABLE IF EXISTS delegate_to_vote_counter;

CREATE TABLE delegate_to_vote_counter( "publicKey" CHAR(64) PRIMARY KEY, "voteCount" INTEGER NOT NULL DEFAULT 0 );

COMMIT;
