import db from '../../shared/driver/db';
const QueryFile = require('pg-promise').QueryFile;
import path from 'path';
import fs from 'fs';
import Response from '../../shared/model/response';

interface IPropertyFile {
    id: number | bigint;
    name: string;
    path: string
};

export class Migrator {

    constructor() {}

    read(): Array<Object> {
        const migrationsPath = path.join(process.cwd(), 'core/database', 'migrations');
        let fileMigration: Array<IPropertyFile> = [];

        fs.readdirSync(migrationsPath).forEach(file => {

           const pathToFile: string = path.join(migrationsPath, file);
           const isFile: boolean = fs.statSync(pathToFile).isFile() &&  /\.sql$/.test(pathToFile);

           if (isFile) {
               const splitName = file.split('_');
               fileMigration.push({
                   id: parseInt(splitName[0], 10),
                   name: file,
                   path: pathToFile
               })
           }
        });
        return fileMigration;
    }

    async runMigrate(files: Array<any>) {
        const appliedMigrations = [];
        await db.task( (connect) => {
             files.map(async (file) => {
                 const sql = new QueryFile(file.path, { minify: true });
                 db.query(sql)
                     .then(() => {
                         appliedMigrations.push(file);
                     })
                     .catch(err => {
                         return new Response({
                             errors: err.message
                         })
                     });
             })
        });
    }
}