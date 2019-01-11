/* Create Memory Tables
 *
 */

BEGIN;

CREATE TABLE IF NOT EXISTS "mem_accounts"(
  "username" VARCHAR(20),
  "status" SMALLINT DEFAULT 1,
  "isDelegate" SMALLINT DEFAULT 0,
  "u_isDelegate" SMALLINT DEFAULT 0,
  "url" VARCHAR(100),
  "secondSignature" SMALLINT DEFAULT 0,
  "u_secondSignature" SMALLINT DEFAULT 0,
  "u_username" VARCHAR(20),
  "address" VARCHAR(25) NOT NULL UNIQUE PRIMARY KEY,
  "publicKey" BYTEA,
  "secondPublicKey" BYTEA,
  "balance" BIGINT DEFAULT 0,
  "u_balance" BIGINT DEFAULT 0,
  "voteCount" BIGINT DEFAULT 0,
  "vote" BIGINT DEFAULT 0,
  "rate" BIGINT DEFAULT 0,
  "delegates" TEXT,
  "u_delegates" TEXT,
  "multisignatures" TEXT,
  "u_multisignatures" TEXT,
  "multimin" BIGINT DEFAULT 0,
  "u_multimin" BIGINT DEFAULT 0,
  "multilifetime" BIGINT DEFAULT 0,
  "u_multilifetime" BIGINT DEFAULT 0,
  "blockId" CHAR(64),
  "nameexist" SMALLINT DEFAULT 0,
  "u_nameexist" SMALLINT DEFAULT 0,
  "producedblocks" int DEFAULT 0,
  "missedblocks" int DEFAULT 0,
  "fees" BIGINT DEFAULT 0,
  "rewards" BIGINT DEFAULT 0,
  "acc_type" SMALLINT DEFAULT 0,
  "transferedAmount" BIGINT DEFAULT 0,
  "endTime" INT,
  "totalFrozeAmount" BIGINT DEFAULT 0,
  "isMigrated" SMALLINT DEFAULT 0,
  "name" VARCHAR(20),
  "email" VARCHAR(40),
  "country" VARCHAR(20),
  "phoneNumber" BIGINT,
  "referralLink" VARCHAR(100),
  "group_bonus" BIGINT DEFAULT 0,
  "pending_group_bonus" BIGINT DEFAULT 0,
  "introducer" VARCHAR(25)
);

CREATE INDEX IF NOT EXISTS "mem_accounts_balance" ON "mem_accounts"("balance");

CREATE TABLE IF NOT EXISTS "mem_round"(
  "address" VARCHAR(25),
  "amount" BIGINT,
  "delegate" VARCHAR(64),
  "blockId" CHAR(64),
  "round" BIGINT
);

CREATE TABLE IF NOT EXISTS "mem_accounts2delegates"(
  "accountId" VARCHAR(25) NOT NULL,
  "dependentId" VARCHAR(64) NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES mem_accounts("address") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "mem_accounts2u_delegates"(
  "accountId" VARCHAR(25) NOT NULL,
  "dependentId" VARCHAR(64) NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES mem_accounts("address") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "mem_accounts2multisignatures"(
  "accountId" VARCHAR(25) NOT NULL,
  "dependentId" VARCHAR(64) NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES mem_accounts("address") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "mem_accounts2u_multisignatures"(
  "accountId" VARCHAR(25) NOT NULL,
  "dependentId" VARCHAR(64) NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES mem_accounts("address") ON DELETE CASCADE
);

COMMIT;
