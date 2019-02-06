import path from 'path';
import fs from 'fs';
import { QueryFile, IDatabase } from 'pg-promise';

interface IPropertyFile {
    id: number | bigint;
    name: string | any;
    path: string;
}

export class Migrator {
    private db;
    constructor(db: IDatabase<any>) {
        this.db = db;
    }

    async run(migrationsPath = undefined) {
       const filesMigration = this.read(migrationsPath);
       await this.runMigrate(filesMigration);
       await this.applyRuntimeQueryFile();
    }

    read(migrationsPath ?: string): Array<Object | void> {
        if (!migrationsPath) {
            migrationsPath = path.join(process.cwd(), 'core/database', 'migrations');
        }

        const filesMigration: Array<IPropertyFile> = [];
        fs.readdirSync(migrationsPath)
           .sort()
           .forEach(file => {
               const pathToFile: string = path.join(migrationsPath, file);
               const isFile: boolean = fs.statSync(pathToFile).isFile() &&  /\.sql$/.test(pathToFile);

               if (isFile) {
                   const splitName = file.split('_');
                   const fileName = file.match(/_.+\.sql$/);
                   filesMigration.push({
                       id: parseInt(splitName[0], 10),
                       name: Array.isArray(fileName) ? fileName[0]
                                                        .replace(/_/, '')
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
            const sql = new QueryFile(file.path, { minify: true });
            await this.db.query(sql);
            await this.db.query(
                'INSERT INTO migrations (id, name) VALUES($1, $2) ON CONFLICT DO NOTHING',
                [file.id.toString(), file.name]
            );
        }
    }

    async applyRuntimeQueryFile() {
        const pathToRuntime = path.join(process.cwd(), 'core/database/sql', 'runtime.sql');
        const sql = new QueryFile(pathToRuntime, { minify: true });
        await this.db.query(sql);
    }
}
