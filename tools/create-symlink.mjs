import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { isContainedPath, readEnvFile } from './util.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../')
const { foundryRoot, dataPath } = readEnvFile();

async function createFoundrySymlink() {
    // If foundry already exists, exit and inform the user. This operation can't complete correctly otherwise.
    // If the folder is empty, its fine. It may have failed due to perms
    const foundryDestPath = path.join(projectRoot, 'foundry');
    if (fs.existsSync(foundryDestPath) && fs.readdirSync(foundryDestPath).length) {
        console.log('"foundry" folder already exists in this project');
        return;
    }

    console.log('Creating "foundry" symlinks for types');
    try {
        await fs.promises.mkdir(foundryDestPath);
        console.log('Root foundry folder created');
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }

    // JavaScript files
    for (const p of ['client', 'common', 'tsconfig.json']) {
        try {
            await fs.promises.symlink(path.join(foundryRoot, p), path.join(foundryDestPath, p));
            console.log(`${p} folder created`);
        } catch (e) {
            if (e.code !== 'EEXIST') throw e;
        }
    }

    // Language files
    try {
        await fs.promises.symlink(path.join(foundryRoot, 'public', 'lang'), path.join(foundryDestPath, 'lang'));
        console.log(`lang folder created`);
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
        console.log(`lang folder already exists`);
    }
}

async function createDaggerheartSymlink() {
    if (isContainedPath(dataPath, projectRoot)) {
        console.log('The Daggerheart project repo is in foundry data, so a symlink won\'t be created');
        return;
    }

    const destination = path.join(dataPath, 'Data', 'systems', 'daggerheart');
    if (fs.existsSync(destination)) {
        console.log('A Daggerheart folder already exists in Foundry data');
        return;
    }

    console.log('Creating Daggerheart symlink in the foundry systems folder')
    try {
        await fs.promises.symlink(projectRoot, destination);
        console.log('Daggerheart system folder symlink created');
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
        console.log(`Daggerheart system folder already exists`);
    }
}

await createFoundrySymlink();
console.log(); // Add empty newline
await createDaggerheartSymlink();
