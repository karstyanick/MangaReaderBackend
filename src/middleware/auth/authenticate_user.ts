import { format } from "date-fns";
import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { validateEnvironmentVariable } from "../../business logic/utils";
import { Session, sessions } from "../../users/sessions";

type PrintType = { [username: string]: { issuedAt: string, expiresAt: string, lastCall: string }[]; }

export const authenticateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
    const secret = validateEnvironmentVariable("JWT_SECRET")

    if (!token) {
        throw createHttpError(401, 'Authorization header not set')
    }

    try {
        const payload = jsonwebtoken.verify(token, secret) as jsonwebtoken.JwtPayload;
        res.locals.username = payload["username"]

        console.log(`Call by user ${payload["username"]}`)

        if (!sessions[token]) {
            sessions[token] = {
                username: payload["username"],
                issuedAt: new Date((payload.iat || 0) * 1000),
                expiresAt: new Date((payload.exp || 0) * 1000),
                lastCall: new Date(),
            }
        }

        sessions[token].lastCall = new Date();

        const sessionPrintObj = Object.entries(sessions).reduce((result: PrintType, [_, value]) => {
            const { username, ...data } = value;
            if (result[username]) {
                result[username].push({
                    issuedAt: data.issuedAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" }),
                    expiresAt: data.expiresAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" }),
                    lastCall: data.lastCall.toLocaleString("en-GB", { timeZone: "Europe/Berlin" })
                });
            } else {
                result[username] = [{
                    issuedAt: data.issuedAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" }),
                    expiresAt: data.expiresAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" }),
                    lastCall: data.lastCall.toLocaleString("en-GB", { timeZone: "Europe/Berlin" })
                }];
            }
            return result;
        }, {});

        console.log(`Sessions: ${JSON.stringify(sessionPrintObj, null, 2)}`)

        next();
    } catch (e) {
        if ((e as jsonwebtoken.TokenExpiredError).name) {
            delete sessions[token as string]
            throw createHttpError(401, "Expired token")
        }

        throw createHttpError(403, 'Forbidden error. Token could not be verified')
    }
}

export default authenticateUser
