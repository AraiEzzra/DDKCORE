CREATE TABLE IF NOT EXISTS migrations
(
  id   VARCHAR(25) NOT NULL
    CONSTRAINT migrations_pkey
      PRIMARY KEY,
  name TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS block
(
  id                   CHAR(64)  NOT NULL PRIMARY KEY,
  version              INTEGER   NOT NULL,
  created_at           INTEGER   NOT NULL,
  height               INTEGER   NOT NULL,
  previous_block_id    CHAR(64)  REFERENCES block ON DELETE SET NULL,
  transaction_count    INTEGER   NOT NULL,
  amount               BIGINT    NOT NULL,
  fee                  BIGINT    NOT NULL,
  payload_hash         CHAR(64)  NOT NULL,
  generator_public_key CHAR(64)  NOT NULL,
  signature            CHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS trs
(
  id                CHAR(64)  NOT NULL PRIMARY KEY,
  block_id          CHAR(64)  NOT NULL REFERENCES block ON DELETE CASCADE,
  type              SMALLINT  NOT NULL,
  created_at        INTEGER   NOT NULL,
  sender_public_key CHAR(64)  NOT NULL,
  signature         CHAR(128) NOT NULL,
  second_signature  CHAR(128),
  salt              CHAR(32)  NOT NULL DEFAULT '' :: BPCHAR,
  asset             JSON      NOT NULL DEFAULT '{}' :: JSON
);

CREATE INDEX IF NOT EXISTS trs_sender_public_key
  ON trs (sender_public_key);

CREATE TABLE IF NOT EXISTS round
(
  height_start  INTEGER PRIMARY KEY,
  height_finish INTEGER NOT NULL,
  slots         JSON    NOT NULL DEFAULT '{}' :: JSON
);
