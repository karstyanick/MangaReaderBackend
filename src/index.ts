import { errorHandler } from "./middleware/errors/error_handler"
import { login } from "./users/login"
import { signup } from "./users/signup"
import { logout } from "./users/logout"
import { authenticateUser } from "./middleware/auth/authenticate_user"
import { MangasDirectoryReturn } from "./model"
import { addManga } from "./dispatch/add_manga"
import { initPage } from "./dispatch/init_page"
import getChapter from "./dispatch/get_Chapter"
import getManga from "./dispatch/get_Manga"
import deleteManga from "./dispatch/delete_Manga"
import save from "./dispatch/save"
import express from "express"
import { init } from "./init"

const cors = require("cors");
const bodyParser = require("body-parser")
var _ = require('lodash');
const expressAsyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");


const frontendHost = "http://localhost:3000"
//const frontendHost = "https://fluffy-jalebi-fdc9ee.netlify.app" //REMOVE BACKSLASH FROM END !!!!!!

const app = express()
app.use(bodyParser.json())
app.use(cors({
    "origin": frontendHost,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "credentials": true
}));

init(app)

app.use(cookieParser());


app.post("/signup", expressAsyncHandler(signup))
app.post("/login", expressAsyncHandler(login))
app.post("/logout", expressAsyncHandler(logout))

app.get("/", expressAsyncHandler(authenticateUser), expressAsyncHandler(initPage))

app.post("/save", expressAsyncHandler(authenticateUser), expressAsyncHandler(save))

app.post("/deleteManga", expressAsyncHandler(authenticateUser), expressAsyncHandler(deleteManga))

app.get("/getManga", expressAsyncHandler(authenticateUser), expressAsyncHandler(getManga));

app.get("/getChapter", expressAsyncHandler(authenticateUser), expressAsyncHandler(getChapter));

app.post("/addManga", expressAsyncHandler(authenticateUser), expressAsyncHandler(addManga))

app.use(errorHandler)