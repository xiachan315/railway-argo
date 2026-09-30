#!/usr/bin/env node
// Boot shim: start the CFSM probe in the background, then run the app unchanged.
// Defensive by design: any failure here must never stop index.js from starting.
// Downloads with Node's bundled CA roots; curl is only a fallback because this
// image has no /etc/ssl/certs/ca-certificates.crt (curl error 77).

const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const BIN = '/usr/local/bin/cf-probe';
const URLS = [
  'https://github.com/huilang-me/cfsm-agent/releases/latest/download/cf-probe-linux-amd64',
  'https://ghproxy.net/https://github.com/huilang-me/cfsm-agent/releases/latest/download/cf-probe-linux-amd64',
];
const PROBE_ARGS = [
  'install',
  '-id=077c76aa-6da2-41a3-9f0a-9d735096c142',
  '-secret=19941017',
  '-url=https://l-l.eu.cc/update',
  '-collect_interval=0',
  '-interval=60',
  '-connection_mode=auto',
  '-ping_mode=tcp',
  '-reset_day=1',
  '-auto_update=0',
  '-ct=gd-ct-dualstack.ip.zstaticcdn.com',
  '-cu=gd-cu-dualstack.ip.zstaticcdn.com',
  '-cm=gd-cm-dualstack.ip.zstaticcdn.com',
].join(' ');

function fetchNode(url, dest, hops, cb) {
  if (hops > 6) return cb(new Error('too many redirects'));
  const req = https.get(url, { headers: { 'user-agent': 'curl/8' } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      return fetchNode(new URL(res.headers.location, url).toString(), dest, hops + 1, cb);
    }
    if (res.statusCode !== 200) { res.resume(); return cb(new Error('HTTP ' + res.statusCode)); }
    const out = fs.createWriteStream(dest);
    res.pipe(out);
    out.on('finish', () => out.close(() => cb(null)));
    out.on('error', cb);
  });
  req.setTimeout(300000, () => req.destroy(new Error('timeout')));
  req.on('error', cb);
}

function downloadBinary() {
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= URLS.length) return resolve(false);
      const url = URLS[i++];
      console.log('CFPROBE-DOWNLOADING ' + url);
      fetchNode(url, BIN + '.tmp', 0, (err) => {
        if (err) { console.log('CFPROBE-DL-ERR ' + (err && err.message)); return next(); }
        try {
          fs.chmodSync(BIN + '.tmp', 0o755);
          fs.renameSync(BIN + '.tmp', BIN);
        } catch (e) { console.log('CFPROBE-RENAME-ERR ' + e.message); return next(); }
        let size = -1;
        try { size = fs.statSync(BIN).size; } catch (e) {}
        console.log('CFPROBE-DOWNLOADED bytes=' + size);
        resolve(size > 1000000);
      });
    };
    next();
  });
}

function startProbe() {
  (async () => {
    try {
      if (!fs.existsSync(BIN)) {
        const got = await downloadBinary();
        if (!got) console.log('CFPROBE-DOWNLOAD-FAILED');
      } else {
        console.log('CFPROBE-ALREADY-PRESENT');
      }
      if (!fs.existsSync(BIN)) { console.log('CFPROBE-NOT-PRESENT-SKIP'); return; }
      console.log('CFPROBE-INSTALL-START');
      const child = spawn('/bin/sh', ['-c', BIN + ' ' + PROBE_ARGS + '; echo CFPROBE-EXIT=$?'], {
        detached: true, stdio: ['ignore', 'inherit', 'inherit'],
      });
      child.unref();
    } catch (err) {
      console.log('CFPROBE-SPAWN-FAILED ' + (err && err.message));
    }
  })();
}

require(path.join(__dirname, 'index.js'));

setTimeout(startProbe, 30000);
