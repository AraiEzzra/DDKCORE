BEGIN;

DROP VIEW IF EXISTS full_blocks_list;
DROP VIEW IF EXISTS trs_list;
DROP TABLE IF EXISTS "stake_orders";
DROP TABLE IF EXISTS "votes";

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
  "transferCount"     INT     DEFAULT 0,
  "airdropReward"     JSON
);

CREATE TABLE IF NOT EXISTS "votes" (
  "votes"         TEXT,
  "transactionId" CHAR(64) NOT NULL,
  "reward"        BIGINT,
  "unstake"       BIGINT,
  "airdropReward" JSON,
  FOREIGN KEY ("transactionId") REFERENCES "trs" ("id") ON DELETE CASCADE
);

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
    ENCODE(b."payloadHash", 'hex')        AS "b_payloadHash",
    ENCODE(b."generatorPublicKey", 'hex') AS "b_generatorPublicKey",
    ENCODE(b."blockSignature", 'hex')     AS "b_blockSignature",
    t."id"                                AS "t_id",
    t."rowId"                             AS "t_rowId",
    t."type"                              AS "t_type",
    t."timestamp"                         AS "t_timestamp",
    t."trsName"                           AS "t_trsName",
    ENCODE(t."senderPublicKey", 'hex')    AS "t_senderPublicKey",
    t."senderId"                          AS "t_senderId",
    t."recipientId"                       AS "t_recipientId",
    (t."amount") :: BIGINT                AS "t_amount",
    (t."fee") :: BIGINT                   AS "t_fee",
    ENCODE(t."signature", 'hex')          AS "t_signature",
    ENCODE(t."signSignature", 'hex')      AS "t_signSignature",
    t."stakedAmount"                      AS "t_stakedAmount",
    t."stakeId"                           AS "t_stakeId",
    t."groupBonus"                        AS "t_groupBonus",
    t."pendingGroupBonus"                 AS "t_pendingGroupBonus",
    ENCODE(s."publicKey", 'hex')          AS "s_publicKey",
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
    ENCODE(t."requesterPublicKey", 'hex') AS "t_requesterPublicKey",
    t."signatures"                        AS "t_signatures",
    so."id"                               AS "so_id",
    so."status"                           AS "so_status",
    so."startTime"                        AS "so_startTime",
    so."insertTime"                       AS "so_insertTime",
    so."senderId"                         AS "so_senderId",
    so."recipientId"                      AS "so_recipientId",
    so."freezedAmount"                    AS "so_freezedAmount",
    so."nextVoteMilestone"                AS "so_nextVoteMilestone",
    so."airdropReward"                    AS "so_airdropReward",
    t."reward"                            AS "t_reward",
    ref."level"                           AS "ref_level"

  FROM blocks b

    LEFT OUTER JOIN trs AS t ON t."blockId" = b."id"
    LEFT OUTER JOIN delegates AS d ON d."transactionId" = t."id"
    LEFT OUTER JOIN votes AS v ON v."transactionId" = t."id"
    LEFT OUTER JOIN signatures AS s ON s."transactionId" = t."id"
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
    UPPER(t."senderId")              AS "t_senderId",
    UPPER(t."recipientId")           AS "t_recipientId",
    t."amount"                       AS "t_amount",
    t."stakedAmount"                 AS "t_stakedAmount",
    t."stakeId"                      AS "t_stakeId",
    t."groupBonus"                   AS "t_groupBonus",
    t."fee"                          AS "t_fee",
    ENCODE(t."signature", 'hex')     AS "t_signature",
    ENCODE(t."signSignature", 'hex') AS "t_SignSignature",
    t."signatures"                   AS "t_signatures",
    t."trsName"                      AS "t_trsName",
    (SELECT height + 1
     FROM blocks
     ORDER BY height DESC
     LIMIT 1) - b."height"           AS "confirmations",
    s."id"                           AS "s_id",
    t."reward"                       AS "t_reward",
    t."pendingGroupBonus"            AS "t_pendingGroupBonus"

  FROM trs t

    LEFT JOIN blocks b ON t."blockId" = b."id"
    LEFT JOIN mem_accounts m ON t."recipientId" = m."address"
    LEFT JOIN stake_orders s ON s."id" = t."id";

CREATE INDEX IF NOT EXISTS "trs_upper_sender_id"
  ON "trs" (UPPER("senderId"));
CREATE INDEX IF NOT EXISTS "trs_upper_recipient_id"
  ON "trs" (UPPER("recipientId"));


COMMIT;
