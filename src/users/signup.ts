import bcrypt from "bcrypt";
import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
import createHttpError from "http-errors";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { validateEnvironmentVariable } from "../business logic/utils";
import { Session, sessions } from "./sessions";

export const signup: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username
    const password = req.body.password

    const secret = validateEnvironmentVariable("JWT_SECRET")

    const users = fs.readFileSync('users.json').toString()
    const oldUsers = JSON.parse(users)

    if (!username || !password) {
        throw createHttpError(404, "No username or password")
    }

    if (oldUsers[username]) {
        throw createHttpError(400, "Username already exists")
    }

    bcrypt.hash(password, 10, async function(err, hash) {

        const usersUpdated = {
            ...oldUsers,
            [username]: hash
        }

        await fs.writeFile('users.json', JSON.stringify(usersUpdated, null, 2), err => {
            if (err) throw err;
            console.log("User saved");
        });

        fs.closeSync(fs.openSync(`links${username}.json`, 'w'))
        fs.closeSync(fs.openSync(`save${username}.json`, 'w'))

        const token = jsonwebtoken.sign({ username }, secret, { expiresIn: "30d" });

        const decoded = jsonwebtoken.decode(token) as JwtPayload;

        const session: Session = {
            username: username,
            issuedAt: new Date((decoded.iat || 0) * 1000),
            expiresAt: new Date((decoded.exp || 0) * 1000),
            lastCall: new Date(),
        }

        sessions[token] = session

        console.log(`New user signup ${username}`)
        //res.cookie("session_token", sessionToken, { expires: expiresAt, sameSite:'none', secure: true})
        res.send({
            username,
            token
        })
    });
}

export default signup
