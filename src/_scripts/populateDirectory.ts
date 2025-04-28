import axios from 'axios';
import fs from "fs";
const limit = 32;
const pages = 100;
async function populateDirectory() {
  let mangasDirectory: { id: string; label: string }[] = [];
  console.log(`Populating mangas directory with ${pages} pages and ${limit} items per page`);

  for (let i = 0; i < pages; i++) {
    const result = await axios.get(`https://weebcentral.com/search/data?limit=${limit}&offset=${i * limit}&sort=Popularity&order=Descending&official=Any&anime=Any&adult=Any&display_mode=Minimal%20Display`)

    const regex = /<a href="https:\/\/weebcentral\.com\/series\/(.*?)\/.*?<h2 .*?>(.*?)<\/h2>/gs;
    const matches = [...result.data.matchAll(regex)];

    const partialDirectory = matches.map(([_, id, label]) => ({ id, label }));
    mangasDirectory = mangasDirectory.concat(partialDirectory);

    console.log(`Done with page ${i}`);
  };

  fs.writeFileSync(`./mangasDirectory.json`, JSON.stringify(mangasDirectory, null, 2));
}

populateDirectory();
