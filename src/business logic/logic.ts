import { SaveJson } from "../model";
import fs from "fs"
import { MangaChapters } from "../scrape/scrape.service";

export async function saveState(chapter: MangaChapters, page: {[key: string]: number}, chapterNumber: {[key: string]: string}, username: string){
    const rawData = fs.readFileSync(`save${username}.json`).toString();
    let saveJson: SaveJson = {
        chapter: {},
        page: {},
        chapterNumber: {}
    }

    if (rawData.length !== 0) {
        saveJson = JSON.parse(rawData);
    }

    const saveComb = {
        chapter: {...saveJson.chapter, ...chapter},
        page: {...saveJson.page, ...page},
        chapterNumber: {...saveJson.chapterNumber, ...chapterNumber}
    }

    fs.writeFileSync(`save${username}.json`, JSON.stringify(saveComb, null, 2))

    console.log("Data saved")
}