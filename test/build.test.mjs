import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readDist(name) {
  return fs.readFileSync(path.join(root, 'dist', `${name}.min.js`), 'utf8');
}

test('preset builds remove disabled feature branches', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: root, stdio: 'pipe' });

  const lite = readDist('lite');
  const defaultBuild = readDist('default');
  const full = readDist('full');
  const ai = readDist('ai');

  assert.equal(lite.includes('GEOSITE,openai'), false, 'lite: AI rules');
  assert.equal(lite.includes('GEOSITE,steam'), false, 'lite: gaming rules');
  assert.equal(lite.includes('time.cloudflare.com'), false, 'lite: NTP');
  assert.equal(lite.includes('GEOSITE,netflix'), true, 'lite: streaming stays');

  assert.equal(defaultBuild.includes('GEOSITE,openai'), true, 'default: AI stays');
  assert.equal(defaultBuild.includes('GEOSITE,paypal'), false, 'default: special rules');
  assert.equal(defaultBuild.includes('time.cloudflare.com'), true, 'default: NTP stays');

  assert.equal(full.includes('GEOSITE,paypal'), true, 'full: special rules stay');
  assert.equal(full.includes('GEOSITE,apple-intelligence'), false, 'full: stable rules');

  assert.equal(ai.includes('GEOSITE,apple-intelligence'), true, 'ai: stable AI rule stays');
  assert.equal(ai.includes('GEOSITE,netflix'), false, 'ai: streaming rules');
  assert.equal(ai.includes('GEOSITE,steam'), false, 'ai: gaming rules');
});
