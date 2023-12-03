import { RequestHandler, Response, NextFunction, Request } from "express"
import fs from "fs"
import { LinksJson } from "../model";
import { MangaChapters, ScrapeService } from "../scrape/scrape.service";
import * as _ from "lodash"
import { saveState } from "../business logic/logic";
import { v4 as uuidv4 } from "uuid"

export const addManga: RequestHandler = async function(req: Request, res: Response, next: NextFunction){

    let mangaName: string = req.body.name
    let chapters: string = req.body.chapters
    const username: string = res.locals.username

    const scrapeService = new ScrapeService()

    const rawData = fs.readFileSync(`links${username}.json`).toString();
    
    let linksJson: LinksJson = {}

    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const chapterHtmlContent = await scrapeService.fetch(`https://mangasee123.com/manga/${mangaName}/`, ".ShowAllChapters")
    const poster = scrapeService.getPoster(chapterHtmlContent, mangaName)
    const chapterObjects = scrapeService.generateChapterObjects(chapterHtmlContent)
    const completeObject = await scrapeService.getPagesFromChapters(chapterObjects, chapters)

    const saveObject: LinksJson = {[mangaName]:{poster:poster, ...completeObject}}
    
    const saveManga = _.merge(saveObject, linksJson)

    const sorted = Object.keys(saveManga).sort().reduce((accumulator: LinksJson, key) => {
        if(key !== "poster"){
            accumulator[key] = saveManga[key]
            return accumulator
        }
        return accumulator
    }, {})

    fs.writeFileSync(`links${username}.json`, JSON.stringify(sorted, null, 2));

    console.log(`Manga added: ${mangaName}`)
    
    const chapterKeys = Object.keys(sorted[mangaName]).filter( key => key !== "poster").map(key => parseFloat(key)).sort(function(a,b) { return a - b;}).map(key => key.toString())

    saveState({[mangaName]:saveObject[mangaName][chapterKeys[0]]} as MangaChapters, {[mangaName]:0}, {[mangaName]:chapterKeys[0]}, username)

    res.send({metaData:{id: uuidv4(), name: mangaName, poster: poster}, chapters: chapterKeys})
}