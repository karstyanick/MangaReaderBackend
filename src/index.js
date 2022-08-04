const express = require("express")
const cors = require("cors");
const { default: axios } = require("axios");
const bodyParser = require("body-parser")
const puppeteer = require("puppeteer")
const fs = require("fs")
var _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const http = require("http")
const https = require('https');

const app = express();
app.use(bodyParser.json())
app.use(cors())

async function fetch(link, selector){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    
    if(selector === ""){
        const htmlContent = await page.content();
        browser.close()
        return htmlContent
    }else{
        await page.waitForSelector(selector)
        await page.click(selector)
        const htmlContent = await page.content();
        browser.close()
        return htmlContent
    }
}

function getPoster(htmlContent, mangaName){
    let regexString = "https://temp.compsci88.com/cover/" + mangaName + ".jpg"
    let regex = new RegExp(regexString,"g");
    let posterLink = [...htmlContent.matchAll(regex)].map(page => page[0])
    return posterLink[0]
}

function generatePageObjects(htmlContent){
    let regex = /https:\/\/official-ongoing-2.gamindustri.us\/manga\/.*?\.png/g
    let duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
    let pageLinks = []
    for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
        pageLinks.push(duplicatedPageLinks[i]);
    };
    let pageObjects = pageLinks.map(link => ({"original": link}))

    if(pageObjects.length === 0){
        regex = /https:\/\/scans-hot\.leanbox.us\/manga.*?\.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    if(pageObjects.length === 0){
        regex = /https:\/\/scans-complete.hydaelyn.us\/manga\/.*?\.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    if(pageObjects.length === 0){
        regex = /https:\/\/official-complete-1\.granpulse.us\/manga\/.*?\.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    if(pageObjects.length === 0){
        regex = /https:\/\/official-complete-2\.eorzea\.us\/manga\/.*?\.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    

    return pageObjects
}

function generateChapterObjects(htmlContent){
    const regex = /\/read-online\/.*?chapter-(.*?)-page-1\.html/g
    const chapterObjects = [...htmlContent.matchAll(regex)].map(page => ({[page[1]]: {"Chapter Link": "https://mangasee123.com" + page[0].replace("-page-1", "")}}))
    const chaptersObject = Object.assign({}, ...chapterObjects)
    console.log(chaptersObject)
    return chaptersObject
}

async function getPagesFromChapters(chaptersObject, chaptersRange){
    const chapters = chaptersRange.split("-")
    const start = parseInt(chapters[0])
    const end = parseInt(chapters[1])
    let keys = Object.keys(chaptersObject);
    //keys = keys.reverse() 
    var completeObject = {}
    //Math.min(keys.length, 3)
    for(let i = start-1; i < end; i++){
        const pageHtmlContent = await fetch(chaptersObject[keys[i]]["Chapter Link"], "")
        const pageObjects = generatePageObjects(pageHtmlContent)
        completeObject = Object.assign(completeObject, {[i+1]: pageObjects})
        chaptersObject[keys[i]]["pagelinks"] = pageObjects
        console.log("Chapter " + chaptersObject[keys[i]]["Chapter Link"] + " done")
    }
    return completeObject
}

app.get("/", async function(req, res, next){
    const rawData = await fs.readFileSync('links.json');
    const saveData = await fs.readFileSync('save.json')
    let linksJson = {}
    let saveJson = {}
    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }
    if (saveData.length !== 0) {
        saveJson = JSON.parse(saveData);
    }

    const mangaKeys = Object.keys(linksJson)
    const initPosterList = mangaKeys.map(manga => ({id: uuidv4(), name: manga, poster: linksJson[manga].poster}));

    const initObject = {
        posters: initPosterList,
        state: {
            currentChapter: saveJson.chapter,
            currentPage: saveJson.page,
            currentChapterNumber: saveJson.chapterNumber
        }
    }

    res.send(initObject)
})

app.post("/save", async function(req, res, next){
    const chapter = req.body.chapter
    const page = req.body.page
    const chapterNumber = req.body.chapterNumber

    const rawData = await fs.readFileSync('save.json');
    let saveJson = {}

    if (rawData.length !== 0) {
        saveJson = JSON.parse(rawData);
    }

    const saveComb = {
        chapter: {...saveJson.chapter, ...chapter},
        page: {...saveJson.page, ...page},
        chapterNumber: {...saveJson.chapterNumber, ...chapterNumber}
    }
    await fs.writeFile('save.json', JSON.stringify(saveComb, null, 2), err => {
        if(err) throw err;
        console.log("Data saved");
    });

    res.send("success")
})

app.get("/getManga", async function(req,res,next){
    const mangaName = req.query.name
    const rawData = await fs.readFileSync('links.json');
    let linksJson = {}
    if (rawData !== "") {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName]
    const chapterKeys = Object.keys(links)
    chapterKeys.pop()

    console.log(chapterKeys)

    res.send(chapterKeys)
});

app.get("/getChapter", async function(req,res,next){

    const mangaName = req.query.name
    const chapter = req.query.chapter
   
    console.log(mangaName)
    console.log(chapter)


    const rawData = await fs.readFileSync('links.json');
    let linksJson = {}
    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName][chapter]
    

    console.log(`reached getChapter call returned ${chapter, links}`)

    res.send({chapter, links})
});

app.post("/addManga", async function(req,res,next){
    let mangaName = req.body.name
    let chapters = req.body.chapters

    const rawData = await fs.readFileSync('links.json');
    let linksJson = {}

    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    //if(mangaName in linksJson){
    //    console.log("manga alraedy exists")
    //    res.send("success")
    //}

    const chapterHtmlContent = await fetch("https://mangasee123.com/manga/" + mangaName + "/", ".ShowAllChapters")
    const poster = await getPoster(chapterHtmlContent, mangaName)
    const chaptersObject = generateChapterObjects(chapterHtmlContent)

    const completeObject = await getPagesFromChapters(chaptersObject, chapters)

    const saveObject = {[mangaName]:{poster:poster, ...completeObject}}
    
    const saveManga = _.merge(saveObject, linksJson)

    const sorted  = Object.keys(saveManga).sort().reduce((accumulator, key) => {
        if(key !== "poster"){
            accumulator[key] = saveManga[key]
            return accumulator
        }
    }, {})

    await fs.writeFile('links.json', JSON.stringify(sorted, null, 2), err => {
        if(err) throw err;
        console.log("New data added");
    });
    

    const chapterKeys = Object.keys(sorted[mangaName])
    chapterKeys.pop()

    console.log(JSON.stringify(chapterKeys))

    res.send({metaData:{id: uuidv4(), name: mangaName, poster: poster}, chapters: chapterKeys})
});


if(process.env.NODE_ENV === 'production'){

    const privateKey = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/privkey1.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/cert1.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/chain1.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
}else {
    const httpServer = http.createServer(app);

    httpServer.listen(5000, () => {
        console.log('HTTP Server running on port 5000');
    });
}




