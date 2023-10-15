import { errorHandler } from "./middleware/errors/error_handler"
import { login } from "./users/login"
import { signup } from "./users/signup"
import { logout } from "./users/logout"
import { authenticateUser } from "./middleware/auth/authenticate_user"
import { MangasDirectoryReturn } from "./model"

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
const cookieParser = require("cookie-parser");
const { format } = require("date-fns");
export const mangasDirectory = {}
export let mangasDirectoryReturn: MangasDirectoryReturn
const frontendHost = "http://localhost:3000"
//const origin = "https://fluffy-jalebi-fdc9ee.netlify.app" //REMOVE BACKSLASH FROM END !!!!!!

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


app.post("/signup", expressAsyncHandler(signup))
app.post("/login", expressAsyncHandler(login))
app.post("/logout", expressAsyncHandler(logout))

app.get("/", expressAsyncHandler(authenticateUser), )

app.post("/save", expressAsyncHandler(authenticateUser), async function(req, res, next){
    const chapter = req.body.chapter
    const page = req.body.page
    const chapterNumber = req.body.chapterNumber
    const username = res.locals.username


    await saveState(chapter, page, chapterNumber, username)

    res.send("success")
})

app.post("/deleteManga", expressAsyncHandler(authenticateUser), async function(req, res, next){
    const username = res.locals.username
    const mangaName = req.body.name

    const rawSaveData = await fs.readFileSync(`save${username}.json`);
    const rawLinksData = await fs.readFileSync(`links${username}.json`);
    let saveJson = {}
    let linksJson = {}
    if (rawSaveData.length !== 0 && rawLinksData.length !== 0) {
        saveJson = JSON.parse(rawSaveData);
        linksJson = JSON.parse(rawLinksData)
    }

    delete saveJson.chapter[mangaName]
    delete saveJson.chapterNumber[mangaName]
    delete saveJson.page[mangaName]
    delete linksJson[mangaName]

    fs.writeFileSync(`save${username}.json`, JSON.stringify(saveJson, null, 2));
    fs.writeFileSync(`links${username}.json`, JSON.stringify(linksJson, null, 2));

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
    const chapterKeys = Object.keys(links).filter( key => key !== "poster").map(key => parseFloat(key)).sort(function(a,b) { return a - b;}).map(key => key.toString())

    res.send(chapterKeys)
});

app.get("/getChapter", expressAsyncHandler(authenticateUser), async function(req,res,next){

    const mangaName = req.query.name
    const chapter = req.query.chapter
    const username = res.locals.username

    const rawData = await fs.readFileSync(`links${username}.json`);
    let linksJson = {}
    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const links = linksJson[mangaName][chapter]
    
    res.send({chapter, links})
});

app.post("/addManga", expressAsyncHandler(authenticateUser))

app.use(errorHandler)

