BEGIN;

DROP VIEW IF EXISTS full_blocks_list;
DROP VIEW IF EXISTS blocks_list;
DROP VIEW IF EXISTS trs_list;
DROP VIEW IF EXISTS full_trs_list;
DROP INDEX "mem_accounts_get_delegates";
DROP INDEX IF EXISTS trs_encode_sender_rcpt;

--change bytea to CHAR with converting to hex
ALTER TABLE "mem_accounts"
 ALTER COLUMN "publicKey" TYPE CHAR(64) USING ENCODE("publicKey",'hex'),
 ALTER COLUMN "secondPublicKey" TYPE CHAR(64) USING ENCODE("secondPublicKey",'hex');

ALTER TABLE "signatures"
 ALTER COLUMN "publicKey" TYPE CHAR(64) USING ENCODE("publicKey",'hex');

ALTER TABLE "peers"
 ALTER COLUMN "broadhash" TYPE CHAR(64) USING ENCODE("broadhash",'hex');

ALTER TABLE "rounds_fees"
 ALTER COLUMN "publicKey" TYPE CHAR(64) USING ENCODE("publicKey",'hex');

ALTER TABLE "blocks"
 ALTER COLUMN "payloadHash" TYPE CHAR(64) USING ENCODE("payloadHash",'hex'),
 ALTER COLUMN "generatorPublicKey" TYPE CHAR(64) USING ENCODE("generatorPublicKey",'hex'),
 ALTER COLUMN "blockSignature" TYPE CHAR(128) USING ENCODE("blockSignature",'hex');

ALTER TABLE "trs"
 ALTER COLUMN "senderPublicKey" TYPE CHAR(64) USING ENCODE("senderPublicKey",'hex'),
 ALTER COLUMN "signature" TYPE CHAR(128) USING ENCODE("signature",'hex'),
 ALTER COLUMN "signSignature" TYPE CHAR(128) USING ENCODE("signSignature",'hex'),
 ALTER COLUMN "requesterPublicKey" TYPE CHAR(64) USING ENCODE("requesterPublicKey",'hex');

--indexes
CREATE INDEX IF NOT EXISTS "mem_accounts_get_delegates" ON "mem_accounts" ("vote" DESC, "publicKey" ASC) WHERE "isDelegate" = 1;
CREATE INDEX trs_encode_sender_rcpt
  ON public.trs ("senderPublicKey", "recipientId");

CREATE TABLE IF NOT EXISTS "signatures" (
  "transactionId" CHAR(64) NOT NULL PRIMARY KEY,
  "publicKey"     CHAR(64) NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES trs (id) ON DELETE CASCADE
);

--views
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
      b."payloadHash" AS "b_payloadHash",
      b."generatorPublicKey" AS "b_generatorPublicKey",
      b."blockSignature" AS "b_blockSignature",
      (SELECT MAX("height") + 1 FROM blocks) - b."height" AS "b_confirmations"

FROM blocks b

LEFT JOIN mem_accounts m ON b."generatorPublicKey" = m."publicKey";

CREATE VIEW full_blocks_list AS

  SELECT
    b."id"                                AS "b_id",
    b."version"                           AS "b_version",
    b."timestamp"                         AS "b_timestamp",
    b."height"                            AS "b_height",
    b."previousBlock"                     AS "b_previousBlock",
    b."numberOfTransactions"              AS "b_numberOfTransactions",
    (b."totalAmount") :: BIGINT           AS "b_totalAmount",
    (b."totalFee") :: BIGINT              AS "b_totalFee",
    (b."reward") :: BIGINT                AS "b_reward",
    b."payloadLength"                     AS "b_payloadLength",
    b."payloadHash"                       AS "b_payloadHash",
    b."generatorPublicKey"                AS "b_generatorPublicKey",
    b."blockSignature"                    AS "b_blockSignature",
    t."id"                                AS "t_id",
    t."rowId"                             AS "t_rowId",
    t."type"                              AS "t_type",
    t."timestamp"                         AS "t_timestamp",
    t."trsName"                           AS "t_trsName",
    t."senderPublicKey"                   AS "t_senderPublicKey",
    t."senderId"                          AS "t_senderId",
    t."recipientId"                       AS "t_recipientId",
    (t."amount") :: BIGINT                AS "t_amount",
    (t."fee") :: BIGINT                   AS "t_fee",
    t."signature"                         AS "t_signature",
    t."signSignature"                     AS "t_signSignature",
    t."stakedAmount"                      AS "t_stakedAmount",
    t."stakeId"                           AS "t_stakeId",
    t."groupBonus"                        AS "t_groupBonus",
    t."pendingGroupBonus"                 AS "t_pendingGroupBonus",
    s."publicKey"                         AS "s_publicKey",
    t."requesterPublicKey"                AS "t_requesterPublicKey",
    t."signatures"                        AS "t_signatures",
    t.salt                                AS t_salt,
    t."reward"                            AS "t_reward",
    d."username"                          AS "d_username",
    v."votes"                             AS "v_votes",
    v."reward"                            AS "v_reward",
    v."unstake"                           AS "v_unstake",
    v."airdropReward"                     AS "v_airdropReward",
    m."min"                               AS "m_min",
    m."lifetime"                          AS "m_lifetime",
    m."keysgroup"                         AS "m_keysgroup",
    dapp."name"                           AS "dapp_name",
    dapp."description"                    AS "dapp_description",
    dapp."tags"                           AS "dapp_tags",
    dapp."type"                           AS "dapp_type",
    dapp."link"                           AS "dapp_link",
    dapp."category"                       AS "dapp_category",
    dapp."icon"                           AS "dapp_icon",
    it."dappId"                           AS "in_dappId",
    ot."dappId"                           AS "ot_dappId",
    ot."outTransactionId"                 AS "ot_outTransactionId",
    so."id"                               AS "so_id",
    so."status"                           AS "so_status",
    so."startTime"                        AS "so_startTime",
    so."insertTime"                       AS "so_insertTime",
    so."senderId"                         AS "so_senderId",
    so."recipientId"                      AS "so_recipientId",
    so."freezedAmount"                    AS "so_freezedAmount",
    so."nextVoteMilestone"                AS "so_nextVoteMilestone",
    so."airdropReward"                    AS "so_airdropReward",
    ref."level"                           AS "ref_level"

  FROM blocks b

    LEFT OUTER JOIN trs AS t ON t."blockId" = b."id"
    LEFT OUTER JOIN delegates AS d ON d."transactionId" = t."id"
    LEFT OUTER JOIN votes AS v ON v."transactionId" = t."id"
    LEFT OUTER JOIN signatures AS s ON s."transactionId" = t."id"
    LEFT OUTER JOIN multisignatures AS m ON m."transactionId" = t."id"
    LEFT OUTER JOIN dapps AS dapp ON dapp."transactionId" = t."id"
    LEFT OUTER JOIN intransfer AS it ON it."transactionId" = t."id"
    LEFT OUTER JOIN outtransfer AS ot ON ot."transactionId" = t."id"
    LEFT JOIN stake_orders so ON so."id" = t."id"
    LEFT JOIN referals ref ON ref."address" = t."senderId";

    CREATE VIEW trs_list AS

  SELECT
    t."id"                           AS "t_id",
    b."height"                       AS "b_height",
    t."blockId"                      AS "t_blockId",
    t."type"                         AS "t_type",
    t."timestamp"                    AS "t_timestamp",
    t."senderPublicKey"              AS "t_senderPublicKey",
    m."publicKey"                    AS "m_recipientPublicKey",
    t."senderId"                     AS "t_senderId",
    t."recipientId"                  AS "t_recipientId",
    t."amount"                       AS "t_amount",
    t."stakedAmount"                 AS "t_stakedAmount",
    t."stakeId"                      AS "t_stakeId",
    t."groupBonus"                   AS "t_groupBonus",
    t."fee"                          AS "t_fee",
    t."signature"                    AS "t_signature",
    t."signSignature"                AS "t_SignSignature",
    t."signatures"                   AS "t_signatures",
    t."trsName"                      AS "t_trsName",
    (SELECT MAX("height") + 1
     FROM blocks) - b."height"       AS "confirmations",
    s."id"                           AS "s_id",
    t."reward"                       AS "t_reward",
    t."pendingGroupBonus"            AS "t_pendingGroupBonus"

  FROM trs t

    INNER JOIN blocks b ON t."blockId" = b."id"
    LEFT JOIN mem_accounts m ON t."recipientId" = m."address"
    LEFT JOIN stake_orders s ON s."id" = t."id";


CREATE VIEW full_trs_list AS

  SELECT
    t.id                                          AS t_id,
    t."blockId"                                   AS "t_blockId",
    t."rowId"                                     AS "t_rowId",
    t."type"                                      AS "t_type",
    t."timestamp"                                 AS "t_timestamp",
    t."trsName"                                   AS "t_trsName",
    t."senderPublicKey"                           AS "t_senderPublicKey",
    t."senderId"                                  AS "t_senderId",
    t."recipientId"                               AS "t_recipientId",
    t."amount"                                    AS "t_amount",
    t."fee"                                       AS "t_fee",
    t."reward"                                    AS "t_reward",
    t."signature"                                 AS "t_signature",
    t."signSignature"                             AS "t_signSignature",
    t."stakedAmount"                              AS "t_stakedAmount",
    t."stakeId"                                   AS "t_stakeId",
    t."groupBonus"                                AS "t_groupBonus",
    t."pendingGroupBonus"                         AS "t_pendingGroupBonus",
    t."requesterPublicKey"                        AS "t_requesterPublicKey",
    t."signatures"                                AS "t_signatures",
    t."salt"                                      AS "t_salt",
    b."height"                                    AS "b_height",
    v."votes"                                     AS "v_votes",
    v."reward"                                    AS "v_reward",
    v."unstake"                                   AS "v_unstake",
    v."airdropReward"                             AS "v_airdropReward",
    so."id"                                       AS "so_id",
    so."status"                                   AS "so_status",
    so."startTime"                                AS "so_startTime",
    so."insertTime"                               AS "so_insertTime",
    so."senderId"                                 AS "so_senderId",
    so."recipientId"                              AS "so_recipientId",
    so."freezedAmount"                            AS "so_freezedAmount",
    so."nextVoteMilestone"                        AS "so_nextVoteMilestone",
    so."airdropReward"                            AS "so_airdropReward",
    ref."level"                                   AS "ref_level"

  FROM trs t

    LEFT OUTER JOIN blocks b ON t."blockId" = b."id"
    LEFT OUTER JOIN votes AS v ON v."transactionId" = t."id"
    LEFT OUTER JOIN stake_orders so ON so."id" = t."id"
    LEFT OUTER JOIN referals ref ON ref."address" = t."senderId";

COMMIT;