import { Controller, Post, SessionData } from "../../lib";
import { Observable } from "rxjs";
import * as E from "../../lib/artemisa-interfaces/artemisa-server-auth/endpoints";
import { map } from "rxjs/operators";
import { DatabaseService } from "../database/database-service";


@Controller
export class AuthController {

    
    constructor(
        private db: DatabaseService
    ){}

    @Post(E.GET_SESSION_DATA)
    public getConcessions(dto: { token: string }, session: SessionData, domain: string): Observable<SessionData> {
        return this.db.getOne<{ id: string; username: string; admin: boolean; }>(
            `select id,username,super_admin as "admin" from users where id = (select "user" from sessions where token = $1);`, 
            [ dto.token ]).pipe(
            map(user => {
                if (!user) {
                    return null;
                }
                return {
                    token: dto.token,
                    user: user
                };
            })
        );
    }
    
}