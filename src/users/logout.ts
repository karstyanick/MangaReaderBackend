import { NextFunction, Request, RequestHandler, Response } from "express";
import { sessions } from "./sessions";
import jsonwebtoken from "jsonwebtoken"
import { validateEnvironmentVariable } from "../business logic/utils";
import createHttpError from "http-errors";

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {

    const secret = validateEnvironmentVariable("JWT_SECRET")

    const token = req.header("Authorization");

    if (!token) {
        throw createHttpError(401, 'Authorization header not set')
    }

    const payload = jsonwebtoken.verify(token, secret) as jsonwebtoken.JwtPayload;

    jsonwebtoken.sign({ username: payload["username"] }, secret, { expiresIn: "1m" });

    delete sessions[token as string]

    res.end()
}

export default logout
