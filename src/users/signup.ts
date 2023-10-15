import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import fs from "fs"
import bcrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"
import { sessions, Session } from "./sessions";

export const signup: RequestHandler = async(req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username
    const password = req.body.password

    const users = fs.readFileSync('users.json').toString()
    const oldUsers = JSON.parse(users)

    if(!username || !password){
        throw createHttpError(404, "No username or password")
    }

    if(oldUsers[username]){
        throw createHttpError(400, "Username already exists")
    }

    bcrypt.hash(password, 10, async function(err, hash) {

        const usersUpdated = {
            ...oldUsers,
            [username]: hash
        }

        await fs.writeFile('users.json', JSON.stringify(usersUpdated, null, 2), err => {
            if(err) throw err;
            console.log("User saved");
        });

        fs.closeSync(fs.openSync(`links${username}.json`, 'w'))
        fs.closeSync(fs.openSync(`save${username}.json`, 'w'))

        const sessionToken = uuidv4()

        const now = new Date()
        const expiresAt = new Date(+now + 2629800000)

        const session = new Session(username, expiresAt, now)
        sessions[sessionToken] = session

        console.log(`New user signup ${username}`)
        res.cookie("session_token", sessionToken, { expires: expiresAt, sameSite:'none', secure: true})
        res.send(username)
    });
}

export default signup