import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
import { LinksJson } from "../model";

export const getManga: RequestHandler = async function(req: Request, res: Response, next: NextFunction) {
    const mangaName: string = req.query.name as string
    const username = res.locals.username
    const rawData = fs.readFileSync(`links${username}.json`).toString();
    let linksJson: LinksJson = {}

    if (rawData !== "") {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName]
    const chapterKeys = Object.keys(links).filter(key => key !== "poster").map(key => parseFloat(key)).sort(function(a, b) { return a - b; }).map(key => key.toString())

    res.send(chapterKeys)
}

export default getManga
