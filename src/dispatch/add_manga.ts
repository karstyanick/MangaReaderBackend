import { RequestHandler, Response, NextFunction, Request } from "express"
import fs from "fs"
import { LinksJson } from "../model";
import { ScrapeService } from "../scrape/scrape.service";

export const addManga: RequestHandler = async function(req: Request, res: Response, next: NextFunction){

    let mangaName: string = req.body.name
    let chapters: string = req.body.chapters
    const username: string = res.locals.username

    const scrapeService = new ScrapeService()

    const rawData = fs.readFileSync(`links${username}.json`).toString();
    
    let linksJson: LinksJson = {}

    if (rawData.length !== 0) {
        linksJson = JSON.parse(rawData);
    }

    const chapterHtmlContent = await scrapeService.fetch(`https://mangasee123.com/manga/${mangaName}/`, ".ShowAllChapters")
    const poster = scrapeService.getPoster(chapterHtmlContent, mangaName)
    const chapterObjects = scrapeService.generateChapterObjects(chapterHtmlContent)
    const completeObject = await scrapeService.getPagesFromChapters(chapterObjects, chapters)

    const saveObject: LinksJson = {[mangaName]:{poster:poster, ...completeObject}}
    
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
    
    const chapterKeys = Object.keys(sorted[mangaName]).filter( key => key !== "poster").map(key => parseFloat(key)).sort(function(a,b) { return a - b;}).map(key => key.toString())

    saveState({[mangaName]:saveObject[mangaName][chapterKeys[0]]}, {[mangaName]:0}, {[mangaName]:chapterKeys[0]}, username)

    res.send({metaData:{id: uuidv4(), name: mangaName, poster: poster}, chapters: chapterKeys})
});


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

        mangasDirectory = Object.keys(mangasDirectory).map(manga => {return {label: manga, id: mangasDirectory[manga]}})
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

        mangasDirectory = Object.keys(mangasDirectory).map(manga => {return {label: manga, id: mangasDirectory[manga]}})
    }).catch(function (e) {
        console.log(e)
    })


    httpServer.listen(5000, () => {
        console.log('HTTP Server running on port 5000');
    });
}