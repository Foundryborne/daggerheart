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
        transformEntry: entry => {
            delete entry._stats; // top level stats are deleted, all others are pruned
            transformDocument(entry);
        }
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

function transformDocument(entry) {
    // Remove certain characters like rsquo and fancy subtract. Keeps emdash
    function removeSpecialCharacters(description) {
        if (typeof description !== 'string') return description;
        return description.replaceAll('’', '\'').replaceAll('“', '"').replaceAll('”', '"').replaceAll('−', '-');
    }

    const stats = entry._stats;
    entry._stats = stats ? { compendiumSource: stats.compendiumSource } : stats;
    delete entry.ownership;
    entry.name = removeSpecialCharacters(entry.name);
    entry.description = removeSpecialCharacters(entry.description);
    if (entry.system) {
        entry.system.motivesAndTactics = removeSpecialCharacters(entry.system.motivesAndTactics);
        entry.system.description = removeSpecialCharacters(entry.system.description);
        entry.system.backgroundQuestions = entry.system.backgroundQuestions?.map(removeSpecialCharacters);
        entry.system.connections = entry.system.connections?.map(removeSpecialCharacters);
        if (entry.system.duration) {
            entry.system.duration.description = removeSpecialCharacters(entry.system.duration.description);
        }
        for (const action of Object.values(entry.system.actions ?? {})) {
            action.description = removeSpecialCharacters(action.description);
            if (action.description && action.description === entry.system.description) {
                action.description = '';
            }
            for (const area of action.areas ?? []) {
                area.name = removeSpecialCharacters(area.name)
            }
        }

        // Remove any origin flags that accidentally got in there. Effect origins are meant for in-world use
        if ('changes' in entry.system && 'origin' in entry) {
            delete entry.origin;
        }
    }
    if (entry.prototypeToken) {
        entry.prototypeToken.name = removeSpecialCharacters(entry.prototypeToken.name);
    }
    
    for (const effect of entry.effects ?? []) {
        transformDocument(effect);
    }
    for (const item of entry.items ?? []) {
        transformDocument(item);
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
