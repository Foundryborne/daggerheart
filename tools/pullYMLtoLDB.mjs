import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';

const MODULE_ID = process.cwd();
const yaml = false;

const packs = await deepGetDirectories('./packs');
console.log(packs);
for (const pack of packs) {
    if (pack === '.gitattributes') continue;
    console.log('Packing ' + pack);
    await compilePack(`${MODULE_ID}/src/${pack}`, `${MODULE_ID}/${pack}`, { yaml });
}

async function deepGetDirectories(distPath) {
    const dirr = await fs.readdir('src/' + distPath);
    const dirrsWithSub = [];
    for (let file of dirr) {
        const stat = await fs.stat('src/' + distPath + '/' + file);
        if (stat.isDirectory()) {
            const deeper = await deepGetDirectories(distPath + '/' + file);
            if (deeper.length > 0) {
                dirrsWithSub.push(...deeper);
            } else {
                dirrsWithSub.push(distPath + '/' + file);
            }
        }
    }

    return dirrsWithSub;
}
