import { format } from "date-fns";
import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { sessions, Session } from "../../users/sessions";
import { v4 as uuidv4 } from "uuid"

type PrintType = {[key: string]: {expiresAt: string, lastCall: string}}

export const authenticateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) {
        throw createHttpError(401, 'No cookies present')
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        throw createHttpError(401, 'No session token in cookies')
    }

    const sessionPrintObj = Object.entries(sessions).reduce((result: PrintType, [key, value]) => {
        const { username, ...data } = value;
        result[username] = {
            expiresAt:  format(data.expiresAt, "MMM do hh:mm:ss"),
            lastCall:  format(data.lastCall, "MMM do hh:mm:ss")
        };
        return result;
    }, {});

    console.log(`Sessions: ${JSON.stringify(sessionPrintObj, null, 2)}`)
    
    const userSession = sessions[sessionToken]

    if (!userSession) {
        throw createHttpError(401, 'session not found')
    }
    if (userSession.isExpired()) {
        delete sessions[sessionToken]
        throw createHttpError(401, 'session expired')
    }

    const username = sessions[sessionToken].username
    
    const newSessionToken = uuidv4()

    const now = new Date()
    const expiresAt = new Date(+now + 2629800000)
    const session = new Session(userSession.username, expiresAt, now)

    sessions[newSessionToken] = session
    delete sessions[sessionToken]

    res.locals.username = username;

    console.log(`Call by user ${username}`)

    res.cookie("session_token", newSessionToken, { expires: expiresAt, sameSite:'none', secure: true})
    next()
}

export default authenticateUser