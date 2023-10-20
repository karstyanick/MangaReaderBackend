import { format } from "date-fns";
import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { validateEnvironmentVariable } from "../../business logic/utils";
import { Session, sessions } from "../../users/sessions";

export const saveDecryptKeyForUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
    sessions[token as string].decryptionKey = req.body.decryptionKey
}

export default saveDecryptKeyForUser