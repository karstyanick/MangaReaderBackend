import { RequestHandler, Request, Response, NextFunction } from "express";
import fs from "fs"
import { LinksJson, SaveJson } from "../model"

export const deleteManga: RequestHandler = async function(req: Request, res: Response, next: NextFunction) {
    const username = res.locals.username
    const mangaName = req.body.name

    const rawSaveData = fs.readFileSync(`save${username}.json`).toString();
    const rawLinksData = fs.readFileSync(`links${username}.json`).toString();

    let saveJson: SaveJson = {
        chapter: {},
        page: {},
        chapterNumber: {}
    }
    let linksJson: LinksJson = {}

    if (rawSaveData.length !== 0 && rawLinksData.length !== 0) {
        saveJson = JSON.parse(rawSaveData);
        linksJson = JSON.parse(rawLinksData)
    }

    delete saveJson.chapter[mangaName]
    delete saveJson.chapterNumber[mangaName]
    delete saveJson.page[mangaName]
    delete linksJson[mangaName]

    fs.writeFileSync(`save${username}.json`, JSON.stringify(saveJson, null, 2));
    fs.writeFileSync(`links${username}.json`, JSON.stringify(linksJson, null, 2));

    console.log(`Manga deleted: ${mangaName}`)

    res.send("success")
}

export default deleteManga
