import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { sessions } from "./sessions";

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) {
        throw createHttpError(401, 'No cookies')
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        throw createHttpError(401, 'No session token')
    }

    delete sessions[sessionToken]

    res.cookie("session_token", "", { expires: new Date() })
    res.end()
}

export default logout