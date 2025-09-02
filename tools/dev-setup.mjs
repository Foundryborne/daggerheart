#!/usr/bin/env node
import fs from 'fs';

const args = process.argv.slice(2);
const foundryPath = args.find(arg => arg.startsWith('--foundry-path='))?.split('=')[1];
const dataPath = args.find(arg => arg.startsWith('--data-path='))?.split('=')[1];
const portArg = args.find(arg => arg.startsWith('--port='))?.split('=')[1];

if (!foundryPath || !dataPath) {
    console.log('Usage: npm run setup:dev -- --foundry-path="/path/to/foundry/main.js" --data-path="/path/to/data" [--port=30000]');
    process.exit(1);
}

const port = portArg || '30000';
const envContent = `FOUNDRY_MAIN_PATH=${foundryPath}
FOUNDRY_DATA_PATH=${dataPath}
FOUNDRY_PORT=${port}
`;

fs.writeFileSync('.env', envContent);
console.log(`✅ Development environment configured:\n  Foundry main: ${foundryPath}\n  Data path:    ${dataPath}\n  Port:         ${port}`);
