import { RequestHandler, Request, Response, NextFunction } from "express";
import fs from "fs"
import { LinksJson } from "../model"

export const getChapter: RequestHandler = async function(req: Request, res: Response, next: NextFunction){
    const mangaName: string = req.query.name as string
    const chapter: string = req.query.chapter as string
    const username: string = res.locals.username

    const rawData = fs.readFileSync(`links${username}.json`).toString();
    let linksJson: LinksJson = {}

    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName][chapter]
    
    res.send({chapter, links})
}

export default getChapter