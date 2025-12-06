import { extractPack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';
import path from 'path';

const MODULE_ID = process.cwd();
const yaml = false;

// const packs = await fs.readdir('./packs');
const packs = await deepGetDirectories('./packs');
console.log(packs);
for (const pack of packs) {
    if (pack === '.gitattributes') continue;
    console.log('Unpacking ' + pack);
    const directory = `./src/${pack}`;
    try {
        for (const file of await fs.readdir(directory)) {
            await fs.unlink(path.join(directory, file));
        }
    } catch (error) {
        if (error.code === 'ENOENT') console.log('No files inside of ' + pack);
        else console.log(error);
    }
    await extractPack(`${MODULE_ID}/${pack}`, `${MODULE_ID}/src/${pack}`, {
        yaml,
        transformName,
        transformEntry,
    });
}
/**
 * Prefaces the document with its type
 * @param {object} doc - The document data
 */
function transformName(doc) {
    const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, '_');
    const type = doc._key.split('!')[1];
    const prefix = ['actors', 'items'].includes(type) ? doc.type : type;

    return `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.${yaml ? 'yml' : 'json'}`;
}

function transformEntry(entry) {
    function prune(stats) {
        return stats ? { compendiumSource: stats.compendiumSource } : stats;
    }

    delete entry._stats;
    for (const effect of entry.effects ?? []) {
        effect._stats = prune(effect._stats)
    }
    for (const item of entry.items ?? []) {
        item._stats = prune(item._stats);
        for (const effect of item.effects ?? []) {
            effect._stats = prune(effect._stats)
        }
    }
}

async function deepGetDirectories(distPath) {
    const dirr = await fs.readdir(distPath);
    const dirrsWithSub = [];
    for (let file of dirr) {
        const stat = await fs.stat(distPath + '/' + file);
        if (stat.isDirectory()) {
            if (file === 'packs') continue;

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
