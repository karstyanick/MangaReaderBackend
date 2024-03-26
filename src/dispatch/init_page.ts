import { RequestHandler, Request, Response, NextFunction } from "express";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { LinksJson, SaveJson } from "../model"
import { mangasDirectoryReturn } from "../init"


export const initPage: RequestHandler = async function(req: Request, res: Response, next: NextFunction){
    const username = res.locals.username
    const rawData = fs.readFileSync(`links${username}.json`).toString()
    const saveData = fs.readFileSync(`save${username}.json`).toString()

    let linksJson: LinksJson = {}
    let saveJson: SaveJson = {
        chapter: {},
        page: {},
        scrollOffset: {},
        chapterNumber: {}
    }
    
    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }
    if (saveData.length !== 0) {
        saveJson = JSON.parse(saveData);
    }

    const mangaKeys = Object.keys(linksJson)
    const initPosterList = mangaKeys.map(manga => ({id: uuidv4(), name: manga, poster: linksJson[manga].poster}));

    const initObject = {
        username: username,
        posters: initPosterList,
        state: {
            currentChapter: saveJson.chapter,
            currentPage: saveJson.page,
            currentScrollOffset: saveJson.scrollOffset,
            currentChapterNumber: saveJson.chapterNumber
        },
        availableMangas: mangasDirectoryReturn,
        scrollPreference: saveJson.scrollPreference || "horizontal"
    }

    res.send(initObject)
}

export default initPage