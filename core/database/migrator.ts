import path from 'path';
import fs from 'fs';
import { QueryFile, IDatabase } from 'pg-promise';

type PropertyFile = {
    id: number | bigint;
    name: string | any;
    path: string;
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
            .sort()
            .forEach(file => {
                const pathToFile: string = path.join(migrationsPath, file);
                const isFile: boolean = fs.statSync(pathToFile).isFile() && /\.sql$/.test(pathToFile);

                if (isFile) {
                    const splitName = file.split('_');
                    const fileName = file.match(/^\d+\.\d+\.\d+\.sql$/);

                    filesMigration.push({
                        id: parseInt(splitName[0], 10),
                        name: Array.isArray(fileName) ? fileName[0]
                            .replace(/\.sql$/, '') : null,
                        path: pathToFile
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
                const sql = new QueryFile(file.path, { minify: true });
                await this.db.query(sql);
            }
        }
    }
}
