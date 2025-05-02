import { NextFunction, Request, RequestHandler, Response } from "express";
import { saveState } from "../business logic/logic";
import { MangaChapters } from "../scrape/scrape.service";

export const save: RequestHandler = async function(req: Request, res: Response, next: NextFunction) {
    const chapter: MangaChapters = req.body.chapter
    const page: { [key: string]: number } = req.body.page
    const chapterNumber: { [key: string]: string } = req.body.chapterNumber
    const username: string = res.locals.username

    await saveState(chapter, page, chapterNumber, username)
    res.send("success")
}

export default save
