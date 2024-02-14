import { format } from "date-fns";
import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { validateEnvironmentVariable } from "../../business logic/utils";
import { Session, sessions } from "../../users/sessions";

type PrintType = {[key: string]: {expiresAt: string, lastCall: string}}

export const authenticateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
    const secret = validateEnvironmentVariable("JWT_SECRET")

    if(!token){
        throw createHttpError(401, 'Authorization header not set')
    }

    try{
        const payload = jsonwebtoken.verify(token, secret) as jsonwebtoken.JwtPayload;

        res.locals.username = payload["username"]

        console.log(`Call by user ${payload["username"]}`)

        const now = new Date()
        const expiresAt = new Date(+now + 2629800000)
        const session = new Session(payload["username"], expiresAt, now)
            
        sessions[token] = session

        const sessionPrintObj = Object.entries(sessions).reduce((result: PrintType, [key, value]) => {
            const { username, ...data } = value;
            result[username] = {
                expiresAt:  format(data.expiresAt, "MMM do hh:mm:ss"),
                lastCall:  format(data.lastCall, "MMM do hh:mm:ss")
            };
            return result;
        }, {});
    
        console.log(`Sessions: ${JSON.stringify(sessionPrintObj, null, 2)}`)

        next();
    }catch(e){
        if((e as jsonwebtoken.TokenExpiredError).name){
            delete sessions[token as string]
            throw createHttpError(401, "Expired token")
        }

        throw createHttpError(403, 'Forbidden error. Token could not be verified')
    }
}

export default authenticateUser