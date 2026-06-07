import fs from 'fs';
import path from 'path';

export function readEnvFile() {
    if (!fs.existsSync('.env')) {
        console.error('No configured .env file. Copy .env.example to .env and configure it.');
        process.exit();
    }

    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key] = value;
        }
    });

    // Determine foundry path, handling if its an electron install (nested structure)
    const foundryPath = path.normalize(process.env.FOUNDRY_MAIN_PATH).trimEnd();
    const dataPath = path.normalize(process.env.FOUNDRY_DATA_PATH).trimEnd();
    if (!foundryPath.endsWith('main.js')) {
        console.error('Configured FOUNDRY_MAIN_PATH is invalid, it must end with main.js');
        process.exit();
    }
    if (/Data(\/|\\)?$/.test(dataPath) || !fs.existsSync(path.join(dataPath, 'Data'))) {
        console.error('Configured FOUNDRY_DATA_PATH is incorrect. This must be a folder that contains "Data"');
    }

    return {
        foundryPath,
        foundryRoot: path.dirname(foundryPath),
        dataPath
    };
}

export function isContainedPath(parent, child) {
    const relative = path.relative(parent, child);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}