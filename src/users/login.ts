import bcrypt from "bcrypt";
import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { validateEnvironmentVariable } from "../business logic/utils";
import { Session, sessions } from "./sessions";

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body

    const secret = validateEnvironmentVariable("JWT_SECRET")

    if (!username) {
        throw createHttpError(404, "No username present")
    }

    const users = fs.readFileSync('users.json').toString()

    const usersObj = JSON.parse(users)

    const hash = usersObj[username]

    bcrypt.compare(password, hash, async function(err, result) {
        if(result) {

            const token = jsonwebtoken.sign({ username }, secret, { expiresIn: "30d" });

            const now = new Date()
            const expiresAt = new Date(+now + 2629800000)
    
            const session = new Session(username, expiresAt, now)
            sessions[token] = session

            console.log(`User signin ${username}`)

            res.send({
                username,
                token
            })
        }else{
            res.send("Wrong password")
        }
    });
}

export default login