BEGIN;

DROP TABLE IF EXISTS "stake_orders";

CREATE TABLE IF NOT EXISTS "stake_orders"(
  "id" VARCHAR(20) ,
  "stakeId" SERIAL PRIMARY KEY,
  "status" SMALLINT NOT NULL,
  "startTime" INT NOT NULL,
  "insertTime" INT NOT NULL,
  "senderId" VARCHAR(25) NOT NULL,
  "recipientId" VARCHAR(25),
  "freezedAmount" BIGINT DEFAULT 0,
  "rewardCount" INT DEFAULT 0,
  "voteCount" INT DEFAULT 0,
  "nextVoteMilestone" INT NOT NULL,
  "isVoteDone" BOOLEAN DEFAULT FALSE,
  "isTransferred" INT DEFAULT 0,
  "airdropReward" json
);

DROP TABLE IF EXISTS "votes";

CREATE TABLE IF NOT EXISTS "votes"(
  "votes" TEXT,
  "transactionId" VARCHAR(20) NOT NULL,
  "reward" BIGINT,
  "unstake" BIGINT,
  "airdropReward" json,
  FOREIGN KEY("transactionId") REFERENCES "trs"("id") ON DELETE CASCADE
);

COMMIT;