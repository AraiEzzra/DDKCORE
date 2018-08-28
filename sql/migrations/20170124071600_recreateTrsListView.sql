/*
 * Add 'm_recipientPublicKey' column to 'trs_list' view
 * Change 't_senderPublicKey' data type from 'string' to 'bytea'
 */

BEGIN;

DROP VIEW IF EXISTS trs_list;

CREATE VIEW trs_list AS

SELECT t."id" AS "t_id",
       b."height" AS "b_height",
       t."blockId" AS "t_blockId",
       t."type" AS "t_type",
       t."timestamp" AS "t_timestamp",
       t."senderPublicKey" AS "t_senderPublicKey",
       m."publicKey" AS "m_recipientPublicKey",
       t."senderId" AS "t_senderId",
       t."recipientId" AS "t_recipientId",
       t."amount" AS "t_amount",
       t."stakedAmount" AS "t_stakedAmount",
       t."stakeId" AS "t_stakeId",
       t."groupBonus" AS "t_groupBonus",
       t."fee" AS "t_fee",
       ENCODE(t."signature", 'hex') AS "t_signature",
       ENCODE(t."signSignature", 'hex') AS "t_SignSignature",
       t."signatures" AS "t_signatures",
       t."trsName" AS "t_trsName",
       (SELECT MAX("height") + 1 FROM blocks) - b."height" AS "confirmations",
       s."id" AS "s_id"

FROM trs t

INNER JOIN blocks b ON t."blockId" = b."id"
LEFT JOIN mem_accounts m ON t."recipientId" = m."address"
LEFT JOIN stake_orders s ON s."id" = t."id";

DROP VIEW IF EXISTS blocks_list;

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

LEFT JOIN mem_accounts m ON b."generatorPublicKey" = m."publicKey";

COMMIT;
