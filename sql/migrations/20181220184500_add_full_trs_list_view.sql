BEGIN;

DROP VIEW IF EXISTS full_trs_list;

CREATE VIEW full_trs_list AS

SELECT
    t.id AS t_id,
    t."blockId" AS "t_blockId",
    t."rowId" AS "t_rowId",
    t.type AS t_type,
    t."timestamp" AS t_timestamp,
    t."trsName" AS "t_trsName",
    encode(t."senderPublicKey", 'hex'::text) AS "t_senderPublicKey",
    t."senderId" AS "t_senderId",
    t."recipientId" AS "t_recipientId",
    t.amount AS t_amount,
    t.fee AS t_fee,
    t.reward AS t_reward,
    encode(t.signature, 'hex'::text) AS t_signature,
    encode(t."signSignature", 'hex'::text) AS "t_signSignature",
    t."stakedAmount" AS "t_stakedAmount",
    t."stakeId" AS "t_stakeId",
    t."groupBonus" AS "t_groupBonus",
    t."pendingGroupBonus" AS "t_pendingGroupBonus",
    encode(t."requesterPublicKey", 'hex'::text) AS "t_requesterPublicKey",
    t.signatures AS t_signatures,
    b."height" AS "b_height",
    v."votes" AS "v_votes",
    v."reward" AS "v_reward",
    v."unstake" AS "v_unstake",
    v."airdropReward" AS "v_airdropReward",
    so."id" AS "so_id",
    so."status" AS "so_status",
    so."startTime" AS "so_startTime",
    so."insertTime" AS "so_insertTime",
    so."senderId" AS "so_senderId",
    so."recipientId" AS "so_recipientId",
    so."freezedAmount" AS "so_freezedAmount",
    so."nextVoteMilestone" AS "so_nextVoteMilestone",
    so."airdropReward" AS "so_airdropReward",
    ref."level" AS "ref_level"

FROM trs t

LEFT OUTER JOIN blocks b ON t."blockId" = b."id"
LEFT OUTER JOIN votes AS v ON v."transactionId" = t."id"
LEFT OUTER JOIN stake_orders so ON so."id" = t."id"
LEFT OUTER JOIN referals ref ON ref."address" = t."recipientId";

COMMIT;
