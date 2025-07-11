import * as dotenv from "dotenv";
import { Express } from "express-serve-static-core";
import fs from "fs";
import http from "http";
import https from "https";

export async function init(app: Express) {
  dotenv.config();

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
