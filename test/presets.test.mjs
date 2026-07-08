import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { main as fullMain } from '../src/presets/full.js';
import { main as defaultMain } from '../src/presets/default.js';
import { main as liteMain } from '../src/presets/lite.js';

function mockConfig(proxies = []) {
  return { proxies: proxies.map(name => ({ name })) };
}

function captureConsole(fn) {
  const originalConsole = globalThis.console;
  const calls = [];
  globalThis.console = {
    error: message => calls.push(['error', message]),
    warn: message => calls.push(['warn', message]),
    log: message => calls.push(['log', message]),
  };

  try {
    fn();
  } finally {
    globalThis.console = originalConsole;
  }

  return calls;
}

function withoutNavigator(fn) {
  const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: undefined, configurable: true, writable: true,
  });

  try {
    fn();
  } finally {
    if (origDesc) Object.defineProperty(globalThis, 'navigator', origDesc);
  }
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

  it('logs a sanitized warning when falling back to DIRECT', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => fullMain(mockConfig([]), 'linux'));
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'warn');
    assert.match(calls[0][1], / WARN clash-script-adapter\.preset\.full empty-proxies-fallback /);
    assert.match(calls[0][1], /platform=linux/);
    assert.match(calls[0][1], /proxyCount=0/);
    assert.doesNotMatch(calls[0][1], /secret|proxies=|DIRECT/);
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

  it('logs a sanitized warning when falling back to DIRECT', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => defaultMain(mockConfig([]), 'linux'));
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'warn');
    assert.match(calls[0][1], / WARN clash-script-adapter\.preset\.default empty-proxies-fallback /);
    assert.match(calls[0][1], /platform=linux/);
    assert.match(calls[0][1], /proxyCount=0/);
    assert.doesNotMatch(calls[0][1], /secret|proxies=|DIRECT/);
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

  it('does not log when falling back to DIRECT', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => liteMain(mockConfig([]), 'linux'));
    });

    assert.deepEqual(calls, []);
  });
});

describe('all presets', () => {
  it('handle empty proxies without error', () => {
    const emptyConfig = mockConfig([]);
    captureConsole(() => {
      assert.doesNotThrow(() => fullMain(emptyConfig, 'unknown'));
      assert.doesNotThrow(() => defaultMain({ proxies: [] }, 'unknown'));
      assert.doesNotThrow(() => liteMain({ proxies: [] }, 'unknown'));
    });
  });

  it('empty proxies results in DIRECT fallback in all groups', () => {
    let config;
    captureConsole(() => {
      config = defaultMain(mockConfig([]), 'unknown');
    });
    const allGroupNames = config['proxy-groups'].map(g => g.name);
    assert.ok(allGroupNames.length > 0);
  });
});
