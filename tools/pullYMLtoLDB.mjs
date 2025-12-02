import { compilePack } from '@foundryvtt/foundryvtt-cli';
import readline from 'node:readline/promises';
import { promises as fs } from 'fs';
import systemJSON from "../system.json" with { type: "json" };

const MODULE_ID = process.cwd();

const answer = await (async () => {
    if (process.argv.includes("--build")) return "overwrite";

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return rl.question(
        'You are about to overwrite your current database with the saved packs/json. Write "Overwrite" if you are sure. ',
        function (answer) {
            rl.close();
            return answer;
        }
    );
})();

if (answer.toLowerCase() === 'overwrite') {
    await pullToLDB();
} else {
    console.log('Canceled');
}

process.exit();

async function pullToLDB() {
    const packs = await deepGetDirectories('./packs');
    console.log(packs);
    for (const pack of packs) {
        if (pack === '.gitattributes') continue;
        console.log('Packing ' + pack);
        await compilePack(`${MODULE_ID}/src/${pack}`, `${MODULE_ID}/${pack}`, { yaml: false, transformEntry });
    }

    function transformEntry(entry) {
        const stats = {
            coreVersion: systemJSON.compatibility.minimum,
            systemId: "daggerheart",
            systemVersion: systemJSON.version,
        };

        entry._stats = { ...stats };
        for (const effect of entry.effects ?? []) {
            effect._stats = {
                compendiumSource: effect._stats?.compendiumSource ?? null,
                ...stats
            };
        }
        for (const item of entry.items ?? []) {
            item._stats = {
                compendiumSource: item._stats?.compendiumSource ?? null,
                ...stats
            };
            for (const effect of item.effects ?? []) {
                effect._stats = {
                    compendiumSource: effect._stats?.compendiumSource ?? null,
                    ...stats
                };
            }
        }
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
}
