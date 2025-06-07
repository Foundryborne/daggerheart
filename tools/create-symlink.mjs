import fs from 'fs';
import path from 'path';
import readline from 'readline';

console.log('Reforging Symlinks');

const askQuestion = question => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve =>
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        })
    );
};

const installPath = await askQuestion('Enter your Foundry install path: ');

// Determine if it's an Electron install (nested structure)
const nested = fs.existsSync(path.join(installPath, 'resources', 'app'));
const fileRoot = nested ? path.join(installPath, 'resources', 'app') : installPath;

try {
    await fs.promises.mkdir('foundry');
} catch (e) {
    if (e.code !== 'EEXIST') throw e;
}

// JavaScript files
for (const p of ['client', 'common', 'tsconfig.json']) {
    try {
        await fs.promises.symlink(path.join(fileRoot, p), path.join('foundry', p));
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

// Language files
try {
    await fs.promises.symlink(path.join(fileRoot, 'public', 'lang'), path.join('foundry', 'lang'));
} catch (e) {
    if (e.code !== 'EEXIST') throw e;
}
