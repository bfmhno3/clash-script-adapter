import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { main as fullMain } from '../src/presets/full.js';
import { main as defaultMain } from '../src/presets/default.js';
import { main as liteMain } from '../src/presets/lite.js';

function mockConfig(proxies = []) {
  return { proxies: proxies.map(name => ({ name })) };
}

describe('preset/full', () => {
  it('returns config with all required fields', () => {
    const config = fullMain(mockConfig(['🇭🇰 HK01', '🇺🇸 US01']), 'windows');
    assert.ok(config.dns);
    assert.ok(config['rule-providers']);
    assert.ok(config['proxy-groups']);
    assert.ok(config.rules);
    assert.ok(config.tun);
    assert.ok(config.sniffer);
  });

  it('includes tun config', () => {
    const config = fullMain(mockConfig(['🇭🇰 HK01']), 'windows');
    assert.ok(config.tun);
    assert.equal(config.tun.enable, true);
  });

  it('includes sniffer config', () => {
    const config = fullMain(mockConfig(['🇭🇰 HK01']), 'windows');
    assert.ok(config.sniffer);
    assert.equal(config.sniffer.enable, true);
  });

  it('classifies HK proxy into HK group', () => {
    const config = fullMain(mockConfig(['🇭🇰 HK01', '🇺🇸 US01']), 'windows');
    const hkGroup = config['proxy-groups'].find(g => g.name.includes('香港'));
    assert.ok(hkGroup, 'HK group should exist');
    assert.ok(hkGroup.proxies.includes('🇭🇰 HK01'));
  });
});

describe('preset/default', () => {
  it('returns config with required fields (no tun)', () => {
    const config = defaultMain(mockConfig(['🇭🇰 HK01']), 'windows');
    assert.ok(config.dns);
    assert.ok(config['rule-providers']);
    assert.ok(config['proxy-groups']);
    assert.ok(config.rules);
    assert.ok(config.sniffer);
    assert.equal(config.tun, undefined);
  });

  it('includes sniffer but no tun', () => {
    const config = defaultMain(mockConfig(['🇭🇰 HK01']), 'windows');
    assert.ok(config.sniffer);
    assert.equal(config.tun, undefined);
  });
});

describe('preset/lite', () => {
  it('returns config with required fields (no tun, no sniffer)', () => {
    const config = liteMain(mockConfig(['🇭🇰 HK01']), 'windows');
    assert.ok(config.dns);
    assert.ok(config['rule-providers']);
    assert.ok(config['proxy-groups']);
    assert.ok(config.rules);
    assert.equal(config.tun, undefined);
    assert.equal(config.sniffer, undefined);
  });
});

describe('all presets', () => {
  it('handle empty proxies without error', () => {
    const emptyConfig = mockConfig([]);
    assert.doesNotThrow(() => fullMain(emptyConfig, 'unknown'));
    assert.doesNotThrow(() => defaultMain({ proxies: [] }, 'unknown'));
    assert.doesNotThrow(() => liteMain({ proxies: [] }, 'unknown'));
  });

  it('empty proxies results in DIRECT fallback in all groups', () => {
    const config = defaultMain(mockConfig([]), 'unknown');
    const allGroupNames = config['proxy-groups'].map(g => g.name);
    assert.ok(allGroupNames.length > 0);
  });
});
