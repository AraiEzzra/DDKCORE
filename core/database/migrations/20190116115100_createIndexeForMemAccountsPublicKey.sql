BEGIN;

DROP INDEX IF EXISTS mem_accounts_publicKey_index RESTRICT;
CREATE INDEX mem_accounts_publicKey_index
  ON public.mem_accounts ("publicKey");

COMMIT;
