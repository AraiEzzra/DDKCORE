BEGIN;

ALTER TABLE trs ADD COLUMN body json;

DROP VIEW IF EXISTS trs_list;

CREATE VIEW trs_list AS

SELECT t."id" AS "t_id",
       b."height" AS "b_height",
       t."blockId" AS "t_blockId",
       t."type" AS "t_type",
       t."timestamp" AS "t_timestamp",
       t."senderPublicKey" AS "t_senderPublicKey",
       m."publicKey" AS "m_recipientPublicKey",
       UPPER(t."senderId") AS "t_senderId",
       UPPER(t."recipientId") AS "t_recipientId",
       t."amount" AS "t_amount",
       t."stakedAmount" AS "t_stakedAmount",
       t."stakeId" AS "t_stakeId",
       t."groupBonus" AS "t_groupBonus",
       t."fee" AS "t_fee",
       ENCODE(t."signature", 'hex') AS "t_signature",
       ENCODE(t."signSignature", 'hex') AS "t_SignSignature",
       t."signatures" AS "t_signatures",
       t."trsName" AS "t_trsName",
       (SELECT height + 1 FROM blocks ORDER BY height DESC LIMIT 1) - b."height" AS "confirmations",
       s."id" AS "s_id",
       t."reward" AS "t_reward",
       t."pendingGroupBonus" AS "t_pendingGroupBonus",
       t."body" AS "body"

FROM trs t

LEFT JOIN blocks b ON t."blockId" = b."id"
LEFT JOIN mem_accounts m ON t."recipientId" = m."address"
LEFT JOIN stake_orders s ON s."id" = t."id";

CREATE INDEX IF NOT EXISTS "trs_upper_sender_id" ON "trs"(UPPER("senderId"));
CREATE INDEX IF NOT EXISTS "trs_upper_recipient_id" ON "trs"(UPPER("recipientId"));

COMMIT;