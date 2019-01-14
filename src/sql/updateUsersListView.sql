/* Update users_list view
 *
 */

BEGIN;

DROP VIEW IF EXISTS users_list;

CREATE VIEW users_list AS

  SELECT
    m."username" AS "m_username",
    m."address"  AS "m_address"

  FROM mem_accounts m;

UPDATE users_list
SET "m_username" = 'DSTAKEREWARD'
WHERE "m_address" = 'DDK4995063339468361088';

UPDATE users_list
SET "m_username" = 'DPENDINGGB'
WHERE "m_address" = 'DDK15546849747111093123';

UPDATE users_list
SET "m_username" = 'DCONTRIBUTOR'
WHERE "m_address" = 'DDK5143663806878841341';

UPDATE users_list
SET "m_username" = 'DADVISOR'
WHERE "m_address" = 'DDK14224602569244644359';

UPDATE users_list
SET "m_username" = 'DTEAM'
WHERE "m_address" = 'DDK9758601670400927807';

UPDATE users_list
SET "m_username" = 'DFOUNDER'
WHERE "m_address" = 'DDK12671171770945235882';

UPDATE users_list
SET "m_username" = 'DAIRDROP'
WHERE "m_address" = 'DDK10720340277000928808';

UPDATE users_list
SET "m_username" = 'DRESERVEDEX'
WHERE "m_address" = 'DDK5216737955302030643';

UPDATE users_list
SET "m_username" = 'DPREORDERDNC'
WHERE "m_address" = 'DDK8999840344646463126';

UPDATE users_list
SET "m_username" = 'DBOUNTY'
WHERE "m_address" = 'DDK7214959811294852078';

COMMIT;
