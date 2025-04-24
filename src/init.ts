import axios from "axios";
import * as dotenv from "dotenv";
import { Express } from "express-serve-static-core";
import fs from "fs";
import http from "http";
import https from "https";
import { MangasDirectoryReturn } from "./model";

export let mangasDirectoryReturn: MangasDirectoryReturn = [];
export let mangasDirectory: any = {};

export async function init(app: Express) {
  dotenv.config();

  const limit = 32;

  for (let i = 0; i < 100; i++) {
    const result = await axios.get(`https://weebcentral.com/search/data?limit=${limit}&offset=${i * limit}&sort=Popularity&order=Descending&official=Any&anime=Any&adult=Any&display_mode=Minimal%20Display`)
    const regex = /<a href="https:\/\/weebcentral\.com\/series\/(.*?)\/.*?<h2 .*?>(.*?)<\/h2>/gs;
    const matches = [...result.data.matchAll(regex)];
    const partialDirectory = matches.map(([_, id, label]) => ({ id, label }));
    mangasDirectoryReturn = mangasDirectoryReturn.concat(partialDirectory);
  }

  if (process.env.NODE_ENV === "production") {
    const privateKey = fs.readFileSync(
      "/etc/letsencrypt/live/reallfluffy.site/privkey.pem",
      "utf8"
    );
    const certificate = fs.readFileSync(
      "/etc/letsencrypt/live/reallfluffy.site/cert.pem",
      "utf8"
    );
    const ca = fs.readFileSync(
      "/etc/letsencrypt/live/reallfluffy.site/chain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
      console.log("HTTPS Server running on port 443");
    });
  } else {
    const httpServer = http.createServer(app);

    httpServer.listen(5000, () => {
      console.log("HTTP Server running on port 5000");
    });
  }
}
