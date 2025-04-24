import axios from "axios";
import createHttpError from "http-errors";

type ChapterObjects = {
  [key: string]: {
    chapterLink: string;
  };
};

export interface MangaChapters {
  [key: string]: {
    original: string;
  }[];
}
export class ScrapeService {

  getPoster(htmlContent: string, mangaName: string): string {
    let regexString = `https://temp.compsci88.com/cover/${mangaName}.jpg`;
    let regex = new RegExp(regexString, "g");
    let posterLink = [...htmlContent.matchAll(regex)].map((page) => page[0]);
    return posterLink[0];
  }

  generatePageObjects(htmlContent: string) {
    let pageObjects: { original: string }[] = [];

    const regexList = [
      /https:\/\/scans.*?\/manga\/.*?\.png/g,
      /https:\/\/official.*?\/manga\/.*?\.png/g,
      /https:\/\/temp.*?\/manga\/.*?\.png/g,
      /https:\/\/hot.*?\/manga\/.*?\.png/g,
    ];

    regexList.forEach((regex) => {
      const pageLinks = [...htmlContent.matchAll(regex)].map(
        (page) => page[0]
      );

      pageObjects = pageObjects.concat(
        pageLinks.map((link) => ({ original: link }))
      );
    });

    if (pageObjects.length === 0) {
      throw createHttpError(404, "No matching regex pattern found");
    }

    return pageObjects;
  }

  generateChapterObjects(htmlContent: string): ChapterObjects {
    const regex = /"(https:\/\/weebcentral\.com\/chapters\/.*?)".*?Chapter (.*?)<\/span>/gs;
    const matchResult = [...htmlContent.matchAll(regex)];
    const chapterObjects = matchResult.map((page) => ({
      [page[2]]: {
        chapterLink: page[1],
      },
    }));
    const chaptersObject: ChapterObjects = Object.assign({}, ...chapterObjects);
    return chaptersObject;
  }

  async getPagesFromChapters(
    chapterObjects: ChapterObjects,
    chapterRange: string
  ): Promise<MangaChapters> {
    const keys = Object.keys(chapterObjects)
      .map((key) => parseFloat(key))
      .sort(function(a, b) {
        return a - b;
      });
    const wholeChapters = Object.fromEntries(
      Object.entries(chapterObjects).filter(
        ([key]) => parseFloat(key) % 1 === 0
      )
    );
    const dotChapters = Object.fromEntries(
      Object.entries(chapterObjects).filter(
        ([key]) => parseFloat(key) % 1 !== 0
      )
    );

    const chapters = chapterRange.split("-");
    let start: number;
    let end: number;

    let completeObject: MangaChapters = {};

    if (chapterRange === "latest") {
      start = keys[keys.length - 1];
      end = keys[keys.length - 1];
    } else if (chapterRange === "first") {
      start = 1;
      end = 10;
    } else {
      start = parseInt(chapters[0]);
      end = parseInt(chapters[1]);
    }

    try {
      if (start > keys[keys.length - 1]) {
        return {};
      }

      if (end > keys[keys.length - 1]) {
        end = keys[keys.length - 1];
      }

      for (let i = start; i <= end; i++) {
        if (wholeChapters[i]) {
          const link = `${wholeChapters[i].chapterLink}/images?is_prev=True&current_page=1&reading_style=long_strip`;
          const result = await axios.get(`${chapterObjects[i].chapterLink}/images?is_prev=True&current_page=1&reading_style=long_strip`);
          const pageObjects = this.generatePageObjects(result.data);
          completeObject = Object.assign(completeObject, { [i]: pageObjects });
          console.log(`Chapter ${i} with id ${wholeChapters[i].chapterLink} done`);
        }
        for (let j = 1; j < 10; j++) {
          if (dotChapters[`${i}.${j}`]) {
            const result = await axios.get(`https://weebcentral.com/chapters/${dotChapters[`${i}.${j}`].chapterLink}/images?is_prev=True&current_page=1&reading_style=long_strip`);
            const pageObjects = this.generatePageObjects(result.data);
            completeObject = Object.assign(completeObject, {
              [`${i}.${j}`]: pageObjects,
            });
            console.log(
              `Chapter ${i}.${j} with id ${dotChapters[`${i}.${j}`].chapterLink} done`
            );
          }
        }
      }
    } catch (e) {
      console.log(e);
    }

    return completeObject;
  }
}
