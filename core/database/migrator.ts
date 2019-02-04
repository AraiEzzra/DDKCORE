import path from 'path';
import fs from 'fs';
import { QueryFile, IDatabase } from 'pg-promise';
import Response from '../../shared/model/response';

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

    async run(migrationsPath ?: string) {
       const filesMigration = this.read(migrationsPath);
       const isDone = await this.runMigrate(filesMigration);
        if (isDone) {
           await this.applyRuntimeQueryFile();
           return true;
       }
    }

    read(migrationsPath ?: string): Array<Object> {
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
    async runMigrate(files: Array<any>) {
        for (let file of files) {
            const sql = new QueryFile(file.path, { minify: true });

            await this.db.query(sql)
                .then((res) => {
                    this.db.query(
                        'INSERT INTO migrations (id, name) VALUES($1, $2) ON CONFLICT DO NOTHING',
                        [file.id.toString(), file.name]);
                })
                .catch(err => {
                    return new Response({
                        errors: err.message
                    });
                });
        }
        return true;
    }

    async applyRuntimeQueryFile() {
        const pathToRuntime = path.join(process.cwd(), 'core/database/sql', 'runtime.sql');
        const sql = new QueryFile(pathToRuntime, { minify: true });
        await this.db.query(sql);
    }
}
