#!/usr/bin/env node
import { spawn } from 'child_process';
import { readEnvFile } from './util.mjs';
import fs from 'fs';

// Load .env file params
const { foundryPath, dataPath } = readEnvFile();

// Run the original command with proper environment
const args = ['rollup -c --watch', `node "\"${foundryPath}\"" --dataPath="${dataPath}" --noupnp`, 'gulp'];

spawn('npx', ['concurrently', ...args.map(arg => `"${arg}"`)], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
});
