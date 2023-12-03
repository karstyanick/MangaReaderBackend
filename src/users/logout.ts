import { NextFunction, Request, RequestHandler, Response } from "express";
import { sessions } from "./sessions";
import jsonwebtoken from "jsonwebtoken"
import { validateEnvironmentVariable } from "../business logic/utils";

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {

    const secret = validateEnvironmentVariable("JWT_SECRET")
    
    const token = req.header("Authorization");

    jsonwebtoken.sign({username: sessions[token as string].username}, secret, { expiresIn: "1m" });
    delete sessions[token as string]

    res.end()
}

export default logout