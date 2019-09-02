// TODO delete after migration
import { VersionChecker } from 'core/util/versionChecker';

const BYTE_SEND_VERSION = '1.2.6';
export const migrateVersionChecker = new VersionChecker(BYTE_SEND_VERSION);
