import fs from "fs"
import axios from "axios"
const https = require("https")
const http = require("http")
import { MangasDirectoryReturn } from "./model"
import { Express } from "express-serve-static-core"
import * as dotenv from "dotenv";

export let mangasDirectoryReturn: MangasDirectoryReturn
export let mangasDirectory: any = {}

export async function init(app: Express){

    dotenv.config()

    if(process.env.NODE_ENV === 'production'){

        const privateKey = fs.readFileSync('/etc/letsencrypt/live/reallfluffy.site/privkey.pem', 'utf8');
        const certificate = fs.readFileSync('/etc/letsencrypt/live/reallfluffy.site/cert.pem', 'utf8');
        const ca = fs.readFileSync('/etc/letsencrypt/live/reallfluffy.site/chain.pem', 'utf8');
    
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
                mangasDirectory[array[2]] = array[1]
            }
    
            mangasDirectoryReturn = Object.keys(mangasDirectory).map(manga => {return {label: manga, id: mangasDirectory[manga]}})
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
                mangasDirectory[array[2]] = array[1]
            }
    
            mangasDirectoryReturn = Object.keys(mangasDirectory).map(manga => {return {label: manga, id: mangasDirectory[manga]}})
        }).catch(function (e) {
            console.log(e)
        })
    
    
        httpServer.listen(5000, () => {
            console.log('HTTP Server running on port 5000');
        });
    }
}