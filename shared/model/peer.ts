export class Peer {
       id: number;
       ip: string;
       port: number;
       state: number;
       os: string;
       version: string;
       clock: number;
       broadhash: string;
       height: number;

       constructor(rawData) {

       }
}
