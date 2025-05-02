import { RequestHandler, Request, Response, NextFunction } from "express";
import fs from "fs"
import { SaveJson } from "../model"

export const saveDefaultValues: RequestHandler = async function(req: Request, res: Response, next: NextFunction) {
    const username = res.locals.username
    const scrollPreference = req.body.scrollPreference
    const rawData = fs.readFileSync(`save${username}.json`).toString();

    let saveJson: SaveJson = {
        chapter: {},
        page: {},
        chapterNumber: {},
        scrollPreference: "horizontal"
    }

    if (rawData.length !== 0) {
        saveJson = JSON.parse(rawData);
    }

    const saveComb = {
        ...saveJson,
        scrollPreference
    }

    fs.writeFileSync(`save${username}.json`, JSON.stringify(saveComb, null, 2))
    console.log("Default values saved")

    res.send('success')
}

export default saveDefaultValues
