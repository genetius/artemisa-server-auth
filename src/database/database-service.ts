import { Injectable } from "@piros/ioc";
import { Client, ClientConfig, QueryResult } from "pg";
import { Observable, Subscriber } from "rxjs";
import { map } from "rxjs/operators";

const DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR';

@Injectable
export class DatabaseService {

    private postgresClient: Client;
    private connected: boolean;
    private inprogressQueries: Set<Subscriber<any>> = new Set();

    constructor() {
        this.connect();
    }

    private connect() {
        const config: ClientConfig = {
            user: process.env.POSTGRES_USERNAME,
            database: process.env.POSTGRES_DATABASE,
            password: process.env.POSTGRES_PASSWORD,
            port: <any>process.env.POSTGRES_PORT,
            host: process.env.POSTGRES_HOST
        };

        this.postgresClient = new Client(config);
        this.postgresClient.on('error', e => {
            this.connected = false;
            this.inprogressQueries.forEach(obs => {
                obs.error(DATABASE_CONNECTION_ERROR);
            });
            this.inprogressQueries.clear();

            console.log(`Database connection terminated unexpectedly: '${config.host}:${config.port}'.`);
            const retryConnectionTime = 2000;
            console.log(`Will retry connection in ${retryConnectionTime}ms`);
            setTimeout(() => {
                this.connect();
            }, retryConnectionTime);
        });

        console.log(`Connecting to database on: '${config.host}:${config.port}'.`);
        this.postgresClient.connect().then(() => {
            this.connected = true;
            console.log(`Succesfully connected to database on: '${config.host}:${config.port}'.`);
        }).catch(() => {
            this.connected = false;
            console.log(`Error creating database connection on: '${config.host}:${config.port}'.`);
            const retryConnectionTime = 2000;
            console.log(`Will retry connection in ${retryConnectionTime}ms`);
            setTimeout(() => {
                this.connect();
            }, retryConnectionTime);
        });
    }

    private query<T>(sqlQuery: string, values: any[]): Observable<QueryResult<T>> {
        return new Observable<QueryResult<T>>((obs) => {
            if (!this.connected) {
                obs.error(DATABASE_CONNECTION_ERROR);
            } else {
                this.inprogressQueries.add(obs);
                this.postgresClient.query(sqlQuery, values, (err, res) => {
                    if (err) {
                        console.error(err);
                        obs.error(err);
                    } else {
                        obs.next(res);
                        obs.complete();
                    }
                    this.inprogressQueries.delete(obs);
                });
            }
        });
    }

    public getAll<T>(sqlQuery: string, values: any[]): Observable<T[]> {
        return this.query<T>(sqlQuery, values).pipe(
            map(r => r.rows)
        );
    }

    public getAllAsCamel<T>(sqlQuery: string, values: any[]): Observable<T[]> {
        return this.query<T>(sqlQuery, values).pipe(
            map(r => r.rows.map(r => this.camelize(r)))
        );
    }

    public execute(sqlQuery: string, values: any[]): Observable<void> {
        return this.query(sqlQuery, values).pipe(
            map(r => <void>undefined)
        );
    }

    public getOne<T>(sqlQuery: string, values: any[]): Observable<T> {
        return this.query<T>(sqlQuery, values).pipe(
            map(r => r.rows[0])
        );
    }

    public getOneAsCamel<T>(sqlQuery: string, values: any[]): Observable<T> {
        return this.query<T>(sqlQuery, values).pipe(
            map(r => {
                
                if (!r.rows[0]) {
                    return null;
                }
                const result = {};

                Object.keys(r.rows[0]).forEach(k => result[this.snakeToCamel(k)] = r.rows[0][k]);

                return <T>result;
            })
        );
    }

    private camelize(input: any): any {
        if (input) {
            const result = {};
    
            Object.keys(input).forEach(k => result[this.snakeToCamel(k)] = input[k]);
    
            return result;
        }
    }

    private snakeToCamel(str: string) {
        return str.replace(
            /([-_][a-z])/g,
            (group) => group.toUpperCase()
                            .replace('_', '')
        );
    }

}