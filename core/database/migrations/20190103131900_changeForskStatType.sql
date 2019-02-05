BEGIN;

DROP VIEW IF EXISTS full_trs_list;
DROP VIEW IF EXISTS full_blocks_list;
DROP VIEW IF EXISTS trs_list;

ALTER TABLE trs
  ALTER COLUMN "stakeId" TYPE CHAR(64);
ALTER TABLE trs
  ADD COLUMN "salt" CHAR(32) NOT NULL DEFAULT '';
ALTER TABLE forks_stat
  ALTER COLUMN "previousBlock" TYPE CHAR(64);

ALTER TABLE intransfer
  ALTER COLUMN "dappId" TYPE CHAR(64);
ALTER TABLE outtransfer
  ALTER COLUMN "dappId" TYPE CHAR(64);
ALTER TABLE outtransfer
  ALTER COLUMN "outTransactionId" TYPE CHAR(64);
ALTER TABLE peers_dapp
  ALTER COLUMN "dappid" TYPE CHAR(64);


CREATE VIEW full_trs_list AS

  SELECT
    t.id                                          AS t_id,
    t."blockId"                                   AS "t_blockId",
    t."rowId"                                     AS "t_rowId",
    t.type                                        AS t_type,
    t."timestamp"                                 AS t_timestamp,
    t."trsName"                                   AS "t_trsName",
    encode(t."senderPublicKey", 'hex' :: TEXT)    AS "t_senderPublicKey",
    t."senderId"                                  AS "t_senderId",
    t."recipientId"                               AS "t_recipientId",
    t.amount                                      AS t_amount,
    t.fee                                         AS t_fee,
    t.reward                                      AS t_reward,
    encode(t.signature, 'hex' :: TEXT)            AS t_signature,
    encode(t."signSignature", 'hex' :: TEXT)      AS "t_signSignature",
    t."stakedAmount"                              AS "t_stakedAmount",
    t."stakeId"                                   AS "t_stakeId",
    t."groupBonus"                                AS "t_groupBonus",
    t."pendingGroupBonus"                         AS "t_pendingGroupBonus",
    encode(t."requesterPublicKey", 'hex' :: TEXT) AS "t_requesterPublicKey",
    t.signatures                                  AS t_signatures,
    t.salt                                        AS t_salt,
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
    ENCODE(t."requesterPublicKey", 'hex') AS "t_requesterPublicKey",
    t."signatures"                        AS "t_signatures",
    t.salt                                AS t_salt,
    t."reward"                            AS "t_reward",
    d."username"                          AS "d_username",
    v."votes"                             AS "v_votes",
    v."reward"                            AS "v_reward",
    v."unstake"                           AS "v_unstake",
    v."airdropReward"                     AS "v_airdropReward",
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
    LEFT OUTER JOIN dapps AS dapp ON dapp."transactionId" = t."id"
    LEFT OUTER JOIN intransfer AS it ON it."transactionId" = t."id"
    LEFT OUTER JOIN outtransfer AS ot ON ot."transactionId" = t."id"
    LEFT JOIN stake_orders so ON so."id" = t."id"
    LEFT JOIN referals ref ON ref."address" = t."senderId";


CREATE VIEW trs_list AS

  SELECT
    t."id"                             AS "t_id",
    b."height"                         AS "b_height",
    t."blockId"                        AS "t_blockId",
    t."type"                           AS "t_type",
    t."timestamp"                      AS "t_timestamp",
    ENCODE(t."senderPublicKey", 'hex') AS "t_senderPublicKey",
    t."senderId"                       AS "t_senderId",
    t."recipientId"                    AS "t_recipientId",
    t."amount"                         AS "t_amount",
    t."stakedAmount"                   AS "t_stakedAmount",
    t."stakeId"                        AS "t_stakeId",
    t."groupBonus"                     AS "t_groupBonus",
    t."fee"                            AS "t_fee",
    ENCODE(t."signature", 'hex')       AS "t_signature",
    ENCODE(t."signSignature", 'hex')   AS "t_SignSignature",
    t."signatures"                     AS "t_signatures",
    t.salt                             AS t_salt,
    t."trsName"                        AS "t_trsName",
    (SELECT MAX("height") + 1
     FROM blocks) - b."height"         AS "confirmations",
    s."id"                             AS "s_id",
    t."reward"                         AS "t_reward"

  FROM trs t

    LEFT JOIN blocks b ON t."blockId" = b."id"
    LEFT JOIN mem_accounts m ON t."recipientId" = m."address"
    LEFT JOIN stake_orders s ON s."id" = t."id";

COMMIT;
