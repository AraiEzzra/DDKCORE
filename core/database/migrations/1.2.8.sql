CREATE TABLE IF NOT EXISTS address_to_trs
(
  trs_id               CHAR(64)  NOT NULL PRIMARY KEY,
  recipient_address    CHAR(32)  NOT NULL
);

CREATE INDEX IF NOT EXISTS recipient_address_index ON address_to_trs(recipient_address);

WITH data AS (
  SELECT id as trs_id, jsonb_extract_path_text(trs.asset, 'recipientAddress') as recipient_address FROM trs WHERE asset ->> 'recipientAddress' IS NOT NULL
) INSERT INTO address_to_trs (trs_id, recipient_address) SELECT trs_id, recipient_address FROM data;
