#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';

// Load .env file if it exists
if (fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key] = value;
        }
    });
}

// Set defaults if not in environment
const foundryPath = process.env.FOUNDRY_MAIN_PATH || '../../../../FoundryDev/main.js';
const dataPath = process.env.FOUNDRY_DATA_PATH || '../../../';
const foundryPort = process.env.FOUNDRY_PORT || '30000';

// Run the original command with proper environment
const args = [
    'rollup -c --watch',
    `node "${foundryPath}" --dataPath="${dataPath}" --noupnp --port=${foundryPort}`,
    'gulp',
    'node ./tools/dev-proxy.mjs'
];

spawn('npx', ['concurrently', ...args.map(arg => `"${arg}"`)], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
});

// Friendly hint
console.log('\n\x1b[32mDev proxy: http://localhost:30001\x1b[0m (overlay)');
console.log(`\x1b[36mFoundry:    http://localhost:${foundryPort}\x1b[0m (installed)`);
console.log('\nOpen http://localhost:30001 to see your dev version, or close it to return to the installed version.');
