import { RequestHandler, Request, Response, NextFunction } from "express";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { LinksJson, MangasDirectoryReturn, SaveJson } from "../model"

export const initPage: RequestHandler = async function(req: Request, res: Response, next: NextFunction) {
    const username = res.locals.username

    let rawData: string;
    let saveData: string;
    let mangasDirectoryData: string;

    try {
        rawData = fs.readFileSync(`links${username}.json`).toString()
    } catch {
        fs.writeFileSync(`links${username}.json`, '{}');
        rawData = '{}';
    }

    try {
        saveData = fs.readFileSync(`save${username}.json`).toString()
    } catch {
        fs.writeFileSync(`save${username}.json`, '{}');
        saveData = '{}';
    }

    try {
        mangasDirectoryData = fs.readFileSync(`mangasDirectory.json`).toString()
    } catch {
        mangasDirectoryData = "[]";
    }

    let linksJson: LinksJson = {}
    let saveJson: SaveJson = {
        chapter: {},
        page: {},
        scrollOffset: {},
        chapterNumber: {}
    }
    let mangasDirectory: MangasDirectoryReturn = [];

    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }
    if (saveData.length !== 0) {
        saveJson = JSON.parse(saveData);
    }
    if (mangasDirectoryData.length !== 0) {
        mangasDirectory = JSON.parse(mangasDirectoryData);
    }
    const mangaKeys = Object.keys(linksJson)
    const initPosterList = mangaKeys.map(manga => ({ id: uuidv4(), label: manga, poster: linksJson[manga].poster }));

    const initObject = {
        username: username,
        posters: initPosterList,
        state: {
            currentChapter: saveJson.chapter,
            currentPage: saveJson.page,
            currentScrollOffset: saveJson.scrollOffset,
            currentChapterNumber: saveJson.chapterNumber
        },
        availableMangas: mangasDirectory,
        scrollPreference: saveJson.scrollPreference || "horizontal"
    }

    res.send(initObject)
}

export default initPage
