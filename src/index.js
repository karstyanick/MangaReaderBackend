const express = require("express")
const cors = require("cors");
const { default: axios } = require("axios");
const bodyParser = require("body-parser")
const puppeteer = require("puppeteer")
const fs = require("fs")
var _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const expressAsyncHandler = require("express-async-handler");
const createError = require('http-errors')
const http = require("http")
const https = require('https');
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
const allMangas = {}
let allMangasReturn;
const origin = "http://localhost:3000"
//const origin = "https://62f0c3e9488b4a40a3a0716d--fluffy-jalebi-fdc9ee.netlify.app"

const app = express();
app.use(bodyParser.json())
app.use(cors({
    "origin": origin,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "credentials": true
}));

app.use(cookieParser());

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

    if(pageObjects.length === 0){
        regex = /https:\/\/official-ongoing-1.ivalice.us\/manga\/.*?.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    if(pageObjects.length === 0){
        regex = /https:\/\/temp\.compsci88\.com\/manga\/.*?.png/g
        duplicatedPageLinks = [...htmlContent.matchAll(regex)].map(page => page[0])
        pageLinks = []
        for (let i = 0; i < duplicatedPageLinks.length-6; i = i+2) {
            pageLinks.push(duplicatedPageLinks[i]);
        };
        pageObjects = pageLinks.map(link => ({"original": link}))
    }

    if(pageObjects.length === 0){
        regex = /https:\/\/scans-ongoing-1\.lastation\.us\/manga\/.*?.png/g
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
    const chapterObjects = [...htmlContent.matchAll(regex)].map(page => ({[page[1].replace("-index-2","")]: {"Chapter Link": "https://mangasee123.com" + page[0].replace("-page-1", "")}}))
    const chaptersObject = Object.assign({}, ...chapterObjects)
    console.log(chaptersObject)
    return chaptersObject
}

async function getPagesFromChapters(chaptersObject, chaptersRange){

    const filterdObject = Object.fromEntries(Object.entries(chaptersObject).filter(([key]) => parseFloat(key) % 1 === 0));
    
    const chapters = chaptersRange.split("-")
    let start = 1;
    let end = 5;

    if(chaptersRange === "latest"){
        start = Object.keys(filterdObject).length
        end = Object.keys(filterdObject).length
    }
    else if(chaptersRange === "first"){
        start = 1
        end = 10
    }
    else{
        start = parseInt(chapters[0])
        end = parseInt(chapters[1])
    }
    try{
        if(end+1 > filterdObject.length){
            throw new Error("Requesting chapter that does not exist")
        }
        let keys = Object.keys(filterdObject);
        
        var completeObject = {}
        for(let i = start-1; i < end; i++){
            const pageHtmlContent = await fetch(filterdObject[keys[i]]["Chapter Link"], "")
            const pageObjects = generatePageObjects(pageHtmlContent)
            completeObject = Object.assign(completeObject, {[i+1]: pageObjects})
            filterdObject[keys[i]]["pagelinks"] = pageObjects
            console.log("Chapter " + filterdObject[keys[i]]["Chapter Link"] + " done")
        }
    }
    catch(e){
        console.log(e)
    }

    return completeObject
}

class Session {
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt
    }

    isExpired() {
        this.expiresAt < (new Date())
    }
}

const sessions = {}

const authenticateUser = async (req, res, next) => {
    if (!req.cookies) {
        throw createError(401, 'No cookies present')
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        throw createError(401, 'No session token in cookies')
    }

    console.log(`sessions: ${JSON.stringify(sessions)}`)
    console.log(`SessionToken: ${sessionToken}`)
    
    userSession = sessions[sessionToken]
    if (!userSession) {
        throw createError(401, 'session not found')
    }
    if (userSession.isExpired()) {
        delete sessions[sessionToken]
        throw createError(401, 'session expired')
    }

    const username = sessions[sessionToken].username
    
    console.log(sessions)

    const newSessionToken = uuidv4()

    const now = new Date()
    const expiresAt = new Date(+now + 10000 * 1000)
    const session = new Session(userSession.username, expiresAt)

    sessions[newSessionToken] = session
    delete sessions[sessionToken]

    res.locals.username = username;  

    res.cookie("session_token", newSessionToken, { expires: expiresAt, sameSite:'none', secure: true})
    next()
}

app.post("/signup", expressAsyncHandler(async(req, res) => {
    const username = req.body.username
    const password = req.body.password

    const users = await fs.readFileSync('users.json')
    const oldUsers = JSON.parse(users)

    if(!username || !password){
        throw createError(404)
    }
    if(oldUsers[username]){
        throw createError(400, "Username already exists")
    }

    bcrypt.hash(password, 10, async function(err, hash) {

        const usersUpdated = {
            ...oldUsers,
            [username]: hash
        }

        await fs.writeFile('users.json', JSON.stringify(usersUpdated, null, 2), err => {
            if(err) throw err;
            console.log("User saved");
        });

        fs.closeSync(fs.openSync(`links${username}.json`, 'w'))
        fs.closeSync(fs.openSync(`save${username}.json`, 'w'))

        const sessionToken = uuidv4()

        const now = new Date()
        const expiresAt = new Date(+now + 120 * 1000)

        const session = new Session(username, expiresAt)
        sessions[sessionToken] = session

        console.log(sessions)

        res.cookie("session_token", sessionToken, { expires: expiresAt, sameSite:'none', secure: true})
        res.send(username)
    });
}))

app.post("/login", expressAsyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username) {
        throw createError(401, 'No username present')
    }

    const users = await fs.readFileSync('users.json')

    const usersObj = JSON.parse(users)

    const hash = usersObj[username]

    console.log(hash)
        bcrypt.compare(password, hash, async function(err, result) {
            if(result) {
                const sessionToken = uuidv4()
    
                const now = new Date()
                const expiresAt = new Date(+now + 120 * 1000)
        
                const session = new Session(username, expiresAt)
                sessions[sessionToken] = session
        
                res.cookie("session_token", sessionToken, { expires: expiresAt, sameSite:'none', secure: true})
                res.send(username)
            }else{
                res.send("Wrong password")
            }
        });
}))

app.post("/logout", expressAsyncHandler(async (req, res) => {
    if (!req.cookies) {
        throw createError(401, 'No cookies')
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        throw createError(401, 'No session token')
    }

    delete sessions[sessionToken]

    res.cookie("session_token", "", { expires: new Date() })
    res.end()
}))

app.get("/", expressAsyncHandler(authenticateUser), async function(req, res, next){
    const username = res.locals.username
    const rawData = await fs.readFileSync(`links${username}.json`);
    const saveData = await fs.readFileSync(`save${username}.json`)
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
        username: username,
        posters: initPosterList,
        state: {
            currentChapter: saveJson.chapter,
            currentPage: saveJson.page,
            currentChapterNumber: saveJson.chapterNumber
        },
        availableMangas: allMangasReturn
    }

    res.send(initObject)
})

app.post("/save", expressAsyncHandler(authenticateUser), async function(req, res, next){
    const chapter = req.body.chapter
    const page = req.body.page
    const chapterNumber = req.body.chapterNumber
    const username = res.locals.username


    await saveState(chapter, page, chapterNumber, username)

    res.send("success")
})

async function saveState(chapter, page, chapterNumber, username){
    const rawData = await fs.readFileSync(`save${username}.json`);
    let saveJson = {}

    if (rawData.length !== 0) {
        saveJson = JSON.parse(rawData);
    }

    const saveComb = {
        chapter: {...saveJson.chapter, ...chapter},
        page: {...saveJson.page, ...page},
        chapterNumber: {...saveJson.chapterNumber, ...chapterNumber}
    }
    await fs.writeFile(`save${username}.json`, JSON.stringify(saveComb, null, 2), err => {
        if(err) throw err;
        console.log("Data saved");
    });
}

app.get("/getManga", expressAsyncHandler(authenticateUser), async function(req,res,next){
    const mangaName = req.query.name
    const username = res.locals.username
    const rawData = await fs.readFileSync(`links${username}.json`);
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

app.get("/getChapter", expressAsyncHandler(authenticateUser), async function(req,res,next){

    const mangaName = req.query.name
    const chapter = req.query.chapter
    const username = res.locals.username

    console.log(mangaName)
    console.log(chapter)


    const rawData = await fs.readFileSync(`links${username}.json`);
    let linksJson = {}
    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName][chapter]
    

    console.log(`reached getChapter call returned ${chapter, links}`)

    res.send({chapter, links})
});

app.post("/addManga", expressAsyncHandler(authenticateUser), async function(req,res,next){
    let mangaName = req.body.name
    let chapters = req.body.chapters
    const username = res.locals.username

    const rawData = await fs.readFileSync(`links${username}.json`);
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

    await fs.writeFile(`links${username}.json`, JSON.stringify(sorted, null, 2), err => {
        if(err) throw err;
        console.log("New data added");
    });
    
    const startChapter = Object.keys(completeObject)[0]

    saveState({[mangaName]:saveObject[mangaName][startChapter]}, {[mangaName]:0}, {[mangaName]:startChapter}, username)

    const chapterKeys = Object.keys(sorted[mangaName])
    chapterKeys.pop()

    console.log(JSON.stringify(chapterKeys))

    res.send({metaData:{id: uuidv4(), name: mangaName, poster: poster}, chapters: chapterKeys})
});


if(process.env.NODE_ENV === 'production'){

    const privateKey = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/mangareaderbackend.lol/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    axios.get("https://mangasee123.com/directory/")
    .then(function (response){

        const regex = /vm\.FullDirectory = ({.*]}]})/
        const directory = response.data.match(regex)
        
        const regex2 = /"i":"(.*?)","s":"(.*?)"/g
        let array;
        while (array = regex2.exec(directory[1])) {
            allMangas[array[2]] = array[1]
        }

        allMangasReturn = Object.keys(allMangas).map(manga => {return {label: manga, id: allMangas[manga]}})

//        fs.writeFile("test.txt", JSON.stringify(allMangas, null, 2),()=>{
//            console.log("success")
//        })
    }).catch(function (e) {
        console.log(e)
    })

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
}else {
    const httpServer = http.createServer(app);


    axios.get("https://mangasee123.com/directory/")
    .then(function (response){

        const regex = /vm\.FullDirectory = ({.*]}]})/
        const directory = response.data.match(regex)
        
        const regex2 = /"i":"(.*?)","s":"(.*?)"/g
        let array;
        while (array = regex2.exec(directory[1])) {
            allMangas[array[2]] = array[1]
        }

        allMangasReturn = Object.keys(allMangas).map(manga => {return {label: manga, id: allMangas[manga]}})
    }).catch(function (e) {
        console.log(e)
    })


    httpServer.listen(5000, () => {
        console.log('HTTP Server running on port 5000');
    });
}




