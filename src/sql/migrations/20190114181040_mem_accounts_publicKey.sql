BEGIN;

DROP VIEW IF EXISTS blocks_list;
DROP INDEX "mem_accounts_get_delegates";

ALTER TABLE "mem_accounts"
 ALTER COLUMN "publicKey" TYPE VARCHAR(64) USING ENCODE("publicKey",'hex');

CREATE INDEX IF NOT EXISTS "mem_accounts_get_delegates" ON "mem_accounts" ("vote" DESC, "publicKey" ASC) WHERE "isDelegate" = 1;

CREATE VIEW blocks_list AS

SELECT b."id" AS "b_id",
      b."version" AS "b_version",
      b."timestamp" AS "b_timestamp",
      b."height" AS "b_height",
      b."previousBlock" AS "b_previousBlock",
      b."numberOfTransactions" AS "b_numberOfTransactions",
      b."totalAmount" AS "b_totalAmount",
      b."totalFee" AS "b_totalFee",
      b."reward" AS "b_reward",
      b."payloadLength" AS "b_payloadLength",
      m."username" AS "m_username",
      ENCODE(b."payloadHash", 'hex') AS "b_payloadHash",
      ENCODE(b."generatorPublicKey", 'hex') AS "b_generatorPublicKey",
      ENCODE(b."blockSignature", 'hex') AS "b_blockSignature",
      (SELECT MAX("height") + 1 FROM blocks) - b."height" AS "b_confirmations"

FROM blocks b

LEFT JOIN mem_accounts m ON ENCODE(b."generatorPublicKey", 'hex') = m."publicKey";


COMMIT;
