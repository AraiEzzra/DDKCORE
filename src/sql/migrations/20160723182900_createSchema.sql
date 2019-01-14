/* Create Schema
 *
 */

BEGIN;

/* Tables */
CREATE TABLE IF NOT EXISTS "migrations" (
  "id"   VARCHAR(25) NOT NULL PRIMARY KEY,
  "name" TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS "blocks" (
  "id"                   CHAR(64) PRIMARY KEY,
  "rowId"                SERIAL NOT NULL,
  "version"              INT    NOT NULL,
  "timestamp"            INT    NOT NULL,
  "height"               INT    NOT NULL,
  "previousBlock"        CHAR(64),
  "numberOfTransactions" INT    NOT NULL,
  "totalAmount"          BIGINT NOT NULL,
  "totalFee"             BIGINT NOT NULL,
  "reward"               BIGINT NOT NULL,
  "payloadLength"        INT    NOT NULL,
  "payloadHash"          BYTEA  NOT NULL,
  "generatorPublicKey"   BYTEA  NOT NULL,
  "blockSignature"       BYTEA  NOT NULL,
  FOREIGN KEY ("previousBlock")
  REFERENCES "blocks" ("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "trs" (
  "id"                 CHAR(64) PRIMARY KEY,
  "rowId"              SERIAL      NOT NULL,
  "blockId"            CHAR(64)    NOT NULL,
  "type"               SMALLINT    NOT NULL,
  "timestamp"          INT         NOT NULL,
  "senderPublicKey"    BYTEA       NOT NULL,
  "senderId"           VARCHAR(25) NOT NULL,
  "recipientId"        VARCHAR(25),
  "amount"             BIGINT      NOT NULL,
  "stakedAmount"       BIGINT      NOT NULL,
  "stakeId"            VARCHAR(20),
  "groupBonus"         BIGINT,
  "pendingGroupBonus"  BIGINT,
  "fee"                BIGINT      NOT NULL,
  "signature"          BYTEA       NOT NULL,
  "signSignature"      BYTEA,
  "requesterPublicKey" BYTEA,
  "signatures"         TEXT,
  "trsName"            VARCHAR(20) NOT NULL,
  "reward"             TEXT,
  FOREIGN KEY ("blockId") REFERENCES "blocks" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "stake_orders" (
  "id"                CHAR(64),
  "stakeId"           SERIAL PRIMARY KEY,
  "status"            SMALLINT    NOT NULL,
  "startTime"         INT         NOT NULL,
  "insertTime"        INT         NOT NULL,
  "senderId"          VARCHAR(25) NOT NULL,
  "recipientId"       VARCHAR(25),
  "freezedAmount"     BIGINT  DEFAULT 0,
  "rewardCount"       INT     DEFAULT 0,
  "voteCount"         INT     DEFAULT 0,
  "nextVoteMilestone" INT         NOT NULL,
  "isVoteDone"        BOOLEAN DEFAULT FALSE,
  "isTransferred"     INT     DEFAULT 0,
  "airdropReward"     JSON
);

CREATE TABLE IF NOT EXISTS "signatures" (
  "transactionId" CHAR(64) NOT NULL PRIMARY KEY,
  "publicKey"     BYTEA    NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES trs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "delegates" (
  "username"      VARCHAR(20) NOT NULL,
  "transactionId" CHAR(64)    NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "votes" (
  "votes"         TEXT,
  "transactionId" CHAR(64) NOT NULL,
  "reward"        BIGINT,
  "unstake"       BIGINT,
  "airdropReward" JSON,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "forks_stat" (
  "delegatePublicKey" BYTEA       NOT NULL,
  "blockTimestamp"    INT         NOT NULL,
  "blockId"           CHAR(64)    NOT NULL,
  "blockHeight"       INT         NOT NULL,
  "previousBlock"     VARCHAR(20) NOT NULL,
  "cause"             INT         NOT NULL
);

CREATE TABLE IF NOT EXISTS "multisignatures" (
  "min"           INT      NOT NULL,
  "lifetime"      INT      NOT NULL,
  "keysgroup"     TEXT     NOT NULL,
  "transactionId" CHAR(64) NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "dapps" (
  "transactionId" CHAR(64)    NOT NULL,
  "name"          VARCHAR(32) NOT NULL,
  "description"   VARCHAR(160),
  "tags"          VARCHAR(160),
  "link"          TEXT,
  "type"          INT         NOT NULL,
  "category"      INT         NOT NULL,
  "icon"          TEXT,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "intransfer" (
  "dappId"        VARCHAR(20) NOT NULL,
  "transactionId" CHAR(64)    NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "outtransfer" (
  "transactionId"    CHAR(64)    NOT NULL,
  "dappId"           VARCHAR(20) NOT NULL,
  "outTransactionId" VARCHAR(20) NOT NULL UNIQUE,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "peers" (
  "id"      SERIAL   NOT NULL PRIMARY KEY,
  "ip"      INET     NOT NULL,
  "port"    SMALLINT NOT NULL,
  "state"   SMALLINT NOT NULL,
  "os"      VARCHAR(64),
  "version" VARCHAR(11),
  "clock"   BIGINT
);

CREATE TABLE IF NOT EXISTS "peers_dapp" (
  "peerId" INT         NOT NULL,
  "dappid" VARCHAR(20) NOT NULL,
  FOREIGN KEY ("peerId") REFERENCES "peers" ("id") ON DELETE CASCADE
);

/* Unique Indexes */
CREATE UNIQUE INDEX IF NOT EXISTS "blocks_height"
  ON "blocks" ("height");
CREATE UNIQUE INDEX IF NOT EXISTS "blocks_previousBlock"
  ON "blocks" ("previousBlock");
CREATE UNIQUE INDEX IF NOT EXISTS "out_transaction_id"
  ON "outtransfer" ("outTransactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "peers_unique"
  ON "peers" ("ip", "port");
CREATE UNIQUE INDEX IF NOT EXISTS "peers_dapp_unique"
  ON "peers_dapp" ("peerId", "dappid");
CREATE UNIQUE INDEX IF NOT EXISTS "stake_id"
  ON "stake_orders" ("stakeId");

/* Indexes */
CREATE INDEX IF NOT EXISTS "blocks_rowId"
  ON "blocks" ("rowId");
CREATE INDEX IF NOT EXISTS "blocks_generator_public_key"
  ON "blocks" ("generatorPublicKey");
CREATE INDEX IF NOT EXISTS "blocks_reward"
  ON "blocks" ("reward");
CREATE INDEX IF NOT EXISTS "blocks_totalFee"
  ON "blocks" ("totalFee");
CREATE INDEX IF NOT EXISTS "blocks_totalAmount"
  ON "blocks" ("totalAmount");
CREATE INDEX IF NOT EXISTS "blocks_numberOfTransactions"
  ON "blocks" ("numberOfTransactions");
CREATE INDEX IF NOT EXISTS "blocks_timestamp"
  ON "blocks" ("timestamp");
CREATE INDEX IF NOT EXISTS "trs_rowId"
  ON "trs" ("rowId");
CREATE INDEX IF NOT EXISTS "trs_block_id"
  ON "trs" ("blockId");
CREATE INDEX IF NOT EXISTS "trs_sender_id"
  ON "trs" ("senderId");
CREATE INDEX IF NOT EXISTS "trs_recipient_id"
  ON "trs" ("recipientId");
CREATE INDEX IF NOT EXISTS "trs_senderPublicKey"
  ON "trs" ("senderPublicKey");
CREATE INDEX IF NOT EXISTS "trs_type"
  ON "trs" ("type");
CREATE INDEX IF NOT EXISTS "trs_timestamp"
  ON "trs" ("timestamp");
CREATE INDEX IF NOT EXISTS "signatures_trs_id"
  ON "signatures" ("transactionId");
CREATE INDEX IF NOT EXISTS "votes_trs_id"
  ON "votes" ("transactionId");
CREATE INDEX IF NOT EXISTS "delegates_trs_id"
  ON "delegates" ("transactionId");
CREATE INDEX IF NOT EXISTS "multisignatures_trs_id"
  ON "multisignatures" ("transactionId");
CREATE INDEX IF NOT EXISTS "dapps_trs_id"
  ON "dapps" ("transactionId");
CREATE INDEX IF NOT EXISTS "dapps_name"
  ON "dapps" ("name");
CREATE INDEX IF NOT EXISTS "stake_orders_sAddress"
  ON "stake_orders" ("senderId");

COMMIT;
