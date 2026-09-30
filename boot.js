#!/usr/bin/env node
// Boot shim: start the CFSM probe in the background, then run the app unchanged.
// Kept deliberately defensive: any failure here must never stop index.js from starting.

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BIN = '/usr/local/bin/cf-probe';
const URL = 'https://github.com/huilang-me/cfsm-agent/releases/latest/download/cf-probe-linux-amd64';
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

function startProbe() {
  try {
    const needDownload = !fs.existsSync(BIN);
    const dl = needDownload
      ? 'echo CFPROBE-DOWNLOADING; curl -fsSL --max-time 300 -o ' + BIN + '.tmp ' + URL +
        ' && chmod +x ' + BIN + '.tmp && mv ' + BIN + '.tmp ' + BIN + ' || echo CFPROBE-DOWNLOAD-FAILED; '
      : 'echo CFPROBE-ALREADY-PRESENT; ';
    const script = dl + 'echo CFPROBE-INSTALL-START; ' + BIN + ' ' + PROBE_ARGS + '; echo CFPROBE-EXIT=$?';
    const child = spawn('/bin/sh', ['-c', script], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] });
    child.unref();
  } catch (err) {
    console.log('CFPROBE-SPAWN-FAILED ' + (err && err.message));
  }
}

setTimeout(startProbe, 30000);

require(path.join(__dirname, 'index.js'));
