#!/usr/bin/env node
import http from 'http';
import httpProxy from 'http-proxy';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { lookup as mimeLookup } from 'mime-types';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key] = value;
  });
}

const systemId = 'daggerheart';
const pkgBase = `/systems/${systemId}`;
const devRoot = process.cwd();

// Foundry server target (reverse proxy)
const targetPort = Number(process.env.DH_DEV_TARGET_PORT || process.env.FOUNDRY_PORT || 30000);
const target = `http://localhost:${targetPort}`;

// Dev proxy port
const proxyPort = Number(process.env.DH_DEV_PROXY_PORT || 30001);

// Asset overlay: serve files from repo for /systems/daggerheart/*
function tryServeOverlay(req, res) {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname || '/';
  if (!pathname.startsWith(pkgBase + '/')) return false;

  // Map /systems/daggerheart/... to local repo path
  const rel = pathname.replace(pkgBase + '/', '');

  const serveCandidates = [
    // direct match in repo
    path.join(devRoot, rel),
    // common tree roots
    path.join(devRoot, 'assets', rel.replace(/^assets\//, '')),
    path.join(devRoot, 'build', rel.replace(/^build\//, '')),
    path.join(devRoot, 'lang', rel.replace(/^lang\//, '')),
    path.join(devRoot, 'module', rel.replace(/^module\//, '')),
    path.join(devRoot, 'styles', rel.replace(/^styles\//, '')),
    path.join(devRoot, 'templates', rel.replace(/^templates\//, '')),
    path.join(devRoot, 'system.json'),
    path.join(devRoot, 'daggerheart.mjs')
  ];

  for (const candidate of serveCandidates) {
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) {
        const stream = fs.createReadStream(candidate);
        stream.on('error', () => res.end());
        const contentType = mimeLookup(candidate) || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        stream.pipe(res);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

const proxy = httpProxy.createProxyServer({ target, ws: true, changeOrigin: true, selfHandleResponse: false });

const server = http.createServer((req, res) => {
  // If the request targets our system path, try to serve local overlay first
  if (tryServeOverlay(req, res)) return;
  proxy.web(req, res, { target });
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target });
});

server.listen(proxyPort, () => {
  console.log(`Daggerheart dev proxy listening on http://localhost:${proxyPort} (target ${target})`);
  console.log(`Overlaying ${pkgBase} from ${devRoot}`);
});


