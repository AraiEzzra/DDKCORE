import path from 'path';
import fs from 'fs';
import { QueryFile, IDatabase } from 'pg-promise';

import { compareTags } from 'core/util/versionChecker';
import migration_1_3_11 from 'core/database/migrations/1.3.11';

type PropertyFile = {
    id: number | bigint;
    name: string | any;
    path: string;
    type: string;
};

export class Migrator {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
    }

    async run(migrationsPath = undefined) {
        const filesMigration = this.read(migrationsPath);
        await this.runMigrate(filesMigration);

    }

    read(migrationsPath?: string): Array<Object | void> {
        if (!migrationsPath) {
            migrationsPath = path.join(process.cwd(), 'core/database', 'migrations');
        }

        const filesMigration: Array<PropertyFile> = [];
        fs.readdirSync(migrationsPath)
            .sort(compareTags)
            .forEach((file, id) => {
                const pathToFile: string = path.join(migrationsPath, file);
                const isFile: boolean = fs.statSync(pathToFile).isFile() && /\.sql|\.ts$/.test(pathToFile);

                if (isFile) {
                    const fileName = file.match(/^(\d+\.\d+\.\d+)\.(sql|ts)$/);
                    filesMigration.push({
                        id,
                        name: fileName[1],
                        path: pathToFile,
                        type: fileName[2]
                    });
                }
            });
        return filesMigration;
    }

    /**
     * Read file migration and run it
     * @param files
     */
    async runMigrate(files: Array<any>): Promise<void> {
        if (!files || files.length === 0) {
            return;
        }

        for (let file of files) {

            const result = await this.db.query(
                'INSERT INTO migrations (id, name) VALUES($1, $2) ON CONFLICT DO NOTHING RETURNING id ',
                [file.id.toString(), file.name]
            );
            if (result.length) {
                if (file.type === 'sql') {
                    const sql = new QueryFile(file.path, { minify: true });
                    await this.db.query(sql);
                } else if (file.name === '1.3.11' && file.type === 'ts') {
                    await migration_1_3_11(this.db);
                }
            }
        }
    }
}

