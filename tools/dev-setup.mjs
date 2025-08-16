#!/usr/bin/env node
import fs from 'fs';

const args = process.argv.slice(2);
const foundryPath = args.find(arg => arg.startsWith('--foundry-path='))?.split('=')[1];
const dataPath = args.find(arg => arg.startsWith('--data-path='))?.split('=')[1];

if (!foundryPath || !dataPath) {
    console.log('Usage: npm run setup:dev -- --foundry-path="/path/to/foundry/main.js" --data-path="/path/to/data"');
    process.exit(1);
}

const envContent = `FOUNDRY_MAIN_PATH=${foundryPath}
FOUNDRY_DATA_PATH=${dataPath}
`;

fs.writeFileSync('.env', envContent);
console.log(`✅ Development environment configured: ${foundryPath}, ${dataPath}`);
