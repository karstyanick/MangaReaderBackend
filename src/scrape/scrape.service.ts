import createHttpError from "http-errors";
import * as puppeteer from "puppeteer"
import { LinksJson } from "../model"

type ChapterObjects = {
    [key: string]: {
        chapterLink: string
    }
}

export interface MangaChapters {
    [key: string]: {
        original: string
    }[]
}
export class ScrapeService {

    async fetch(link: string, selector: string){
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        await page.goto(link);
        
        if(selector === ""){
            const htmlContent = await page.content();
            browser.close()
            return htmlContent
        }else{
            try{
                await page.waitForSelector(selector)
                await page.click(selector)
            }catch{
                console.log("selector not found")
            }
            const htmlContent = await page.content();
            browser.close()
            return htmlContent
        }
    }


    getPoster(htmlContent: string, mangaName: string): string {
        let regexString = `https://temp.compsci88.com/cover/${mangaName}.jpg`
        let regex = new RegExp(regexString,"g");
        let posterLink = [...htmlContent.matchAll(regex)].map(page => page[0])
        return posterLink[0]
    }
    
    generatePageObjects(htmlContent: string){
       
        let pageObjects: {original: string}[] = []
    
        const regexList = [
            /https:\/\/scans.*?\/manga\/.*?\.png/g,
            /https:\/\/official.*?\/manga\/.*?\.png/g,
            /https:\/\/temp.*?\/manga\/.*?\.png/g,
            /https:\/\/hot.*?\/manga\/.*?\.png/g
        ]
    
        regexList.forEach(regex => {
            const duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
            const pageLinks: string[] = []

            for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
                pageLinks.push(duplicatedPageLinks[i]);
            };
            
            pageObjects = pageObjects.concat(pageLinks.map(link => ({"original": link})))
        });
    
        if(pageObjects.length === 0){
            throw createHttpError(404, "No matching regex pattern found")
        }
    
        return pageObjects
    }
    
    generateChapterObjects(htmlContent: string): ChapterObjects{
        const regex = /\/read-online\/.*?chapter-(.*?)-page-1\.html/g
        const chapterObjects = [...htmlContent.matchAll(regex)].map(page => ({[page[1].replace("-index-2","")]: {chapterLink: `https://mangasee123.com${page[0].replace("-page-1", "")}`}}))
        const chaptersObject: ChapterObjects = Object.assign({}, ...chapterObjects)
        return chaptersObject
    }
    
    async getPagesFromChapters(chapterObjects: ChapterObjects, chapterRange: string): Promise<MangaChapters>{
        const keys = Object.keys(chapterObjects).map(key => parseFloat(key)).sort(function(a,b) { return a - b;})
        const wholeChapters = Object.fromEntries(Object.entries(chapterObjects).filter(([key]) => parseFloat(key) % 1 === 0));
        const dotChapters = Object.fromEntries(Object.entries(chapterObjects).filter(([key]) => parseFloat(key) % 1 !== 0));
    
        const chapters = chapterRange.split("-")
        let start: number;
        let end: number; 
    
        let completeObject: MangaChapters = {}

        if(chapterRange === "latest"){
            start = keys[keys.length - 1]
            end = keys[keys.length - 1]
        }
        else if(chapterRange === "first"){
            start = 1
            end = 10
        }
        else{
            start = parseInt(chapters[0])
            end = parseInt(chapters[1])
        }
    
        try{
            if(start > keys[keys.length - 1]){
                return {}
            }
    
            if(end > keys[keys.length - 1]){
                end = keys[keys.length - 1]
            }
    
            for(let i = start; i <= end; i++){
                if(wholeChapters[i]){
                    const pageHtmlContent = await this.fetch(wholeChapters[i].chapterLink, "")
                    const pageObjects = this.generatePageObjects(pageHtmlContent)
                    completeObject = Object.assign(completeObject, {[i]: pageObjects})
                    console.log("Chapter " + wholeChapters[i].chapterLink + " done")
                }
                for(let j = 1; j < 10; j++){
                    if(dotChapters[`${i}.${j}`]){
                        const pageHtmlContent = await this.fetch(dotChapters[`${i}.${j}`].chapterLink, "")
                        const pageObjects = this.generatePageObjects(pageHtmlContent)
                        completeObject = Object.assign(completeObject, {[`${i}.${j}`]: pageObjects})
                        console.log("Chapter " + dotChapters[`${i}.${j}`].chapterLink + " done")
                    }
                }
            }
        }
        catch(e){
            console.log(e)
        }
    
        return completeObject
    }
    

}