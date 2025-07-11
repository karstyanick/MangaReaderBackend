import express from "express"
import { addManga } from "./dispatch/add_manga"
import deleteManga from "./dispatch/delete_Manga"
import getChapter from "./dispatch/get_Chapter"
import getManga from "./dispatch/get_Manga"
import { initPage } from "./dispatch/init_page"
import save from "./dispatch/save"
import saveDefaultValues from "./dispatch/saveDefaultValues"
import { init } from "./init"
import { authenticateUser } from "./middleware/auth/authenticate_user"
import { errorHandler } from "./middleware/errors/error_handler"
import { login } from "./users/login"
import { logout } from "./users/logout"
import { signup } from "./users/signup"

const cors = require("cors");
const bodyParser = require("body-parser")
const expressAsyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");

const frontendHostLocal = "http://localhost:3000"
const frontendHost = "https://www.reallyfluffy.dev" //REMOVE BACKSLASH FROM END !!!!!!
const frontendHostBeta = "https://beta.reallyfluffy.dev" //REMOVE BACKSLASH FROM END !!!!!!

const app = express()
app.use(bodyParser.json())
app.use(cors({
    "origin": [frontendHost, frontendHostLocal, frontendHostBeta],
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

app.post("/saveDefaultValues", expressAsyncHandler(authenticateUser), expressAsyncHandler(saveDefaultValues))

app.use(errorHandler())
