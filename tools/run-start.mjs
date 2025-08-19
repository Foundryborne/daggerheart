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

// Run the original command with proper environment
const args = ['rollup -c --watch', `node "${foundryPath}" --dataPath="${dataPath}" --noupnp`, 'gulp'];

spawn('npx', ['concurrently', ...args.map(arg => `"${arg}"`)], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
});
