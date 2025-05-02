import axios from "axios";
import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { saveState } from "../business logic/logic";
import { LinksJson } from "../model";
import { MangaChapters, ScrapeService } from "../scrape/scrape.service";

export const addManga: RequestHandler = async function(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let mangaId: string = req.body.id;
  let label: string = req.body.label;

  let chapters: string = req.body.chapters;
  const username: string = res.locals.username;

  const scrapeService = new ScrapeService();

  const rawData = fs.readFileSync(`links${username}.json`).toString();

  let linksJson: LinksJson = {};

  if (rawData.length !== 0) {
    linksJson = JSON.parse(rawData);
  }

  const chapterHtmlContent = await axios.get(`https://weebcentral.com/series/${mangaId}/full-chapter-list`);

  const poster = `https://temp.compsci88.com/cover/normal/${mangaId}.webp`
  const chapterObjects = scrapeService.generateChapterObjects(chapterHtmlContent.data);
  const completeObject = await scrapeService.getPagesFromChapters(
    chapterObjects,
    chapters
  );

  const saveObject: LinksJson = {
    [label]: { poster: poster, ...completeObject },
  };

  const saveManga = _.merge(saveObject, linksJson);

  const sorted = Object.keys(saveManga)
    .sort()
    .reduce((accumulator: LinksJson, key) => {
      if (key !== "poster") {
        accumulator[key] = saveManga[key];
        return accumulator;
      }
      return accumulator;
    }, {});

  fs.writeFileSync(`links${username}.json`, JSON.stringify(sorted, null, 2));

  console.log(`Manga added: ${label}`);

  const chapterKeys = Object.keys(sorted[label])
    .filter((key) => key !== "poster")
    .map((key) => parseFloat(key))
    .sort(function(a, b) {
      return a - b;
    })
    .map((key) => key.toString());

  saveState(
    { [label]: saveObject[label][chapterKeys[0]] } as MangaChapters,
    { [label]: 0 },
    { [label]: chapterKeys[0] },
    username
  );

  res.send({
    metaData: { id: uuidv4(), name: label, poster: poster },
    chapters: chapterKeys,
  });
};
