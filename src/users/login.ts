import { NextFunction, RequestHandler, Request, Response } from "express";
import createHttpError from "http-errors";
import fs from "fs"
import bcrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"
import { sessions, Session } from "./sessions";

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body

    if (!username) {
        throw createHttpError(404, "No username present")
    }

    const users = fs.readFileSync('users.json').toString()

    const usersObj = JSON.parse(users)

    const hash = usersObj[username]

    bcrypt.compare(password, hash, async function(err, result) {
        if(result) {
            const sessionToken = uuidv4()

            const now = new Date()
            const expiresAt = new Date(+now + 2629800000)
    
            const session = new Session(username, expiresAt, now)
            sessions[sessionToken] = session
            console.log(`User signin ${username}`)

            res.cookie("session_token", sessionToken, { expires: expiresAt, sameSite:'none', secure: true})
            res.send(username)
        }else{
            res.send("Wrong password")
        }
    });
}

export default login