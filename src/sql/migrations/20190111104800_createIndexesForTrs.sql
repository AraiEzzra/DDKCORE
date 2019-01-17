BEGIN;

-- ALTER TABLE votes
--   ADD CONSTRAINT votes_transactionId_pk PRIMARY KEY ("transactionId");

DROP INDEX IF EXISTS trs_upper_recipient_id RESTRICT;
CREATE INDEX trs_upper_recipient_id
  ON trs ("recipientId");
DROP INDEX IF EXISTS trs_upper_sender_id RESTRICT;
CREATE INDEX trs_upper_sender_id
  ON trs ("senderId");

DROP INDEX IF EXISTS trs_encode_sender_rcpt RESTRICT;
CREATE INDEX trs_encode_sender_rcpt
  ON public.trs (encode("senderPublicKey", 'hex' :: TEXT), "recipientId");

COMMIT;
