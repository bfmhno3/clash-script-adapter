import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { main as fullMain } from '../src/presets/full.js';
import { main as defaultMain } from '../src/presets/default.js';
import { main as liteMain } from '../src/presets/lite.js';
import { GROUP } from '../src/modules/proxy-groups.js';

function mockProxy(name) {
  return {
    name,
    type: 'ss',
    server: '198.51.100.10',
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'secret',
  };
}

function mockConfig(proxies = []) {
  return { proxies: proxies.map(mockProxy) };
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
    const hkGroup = config['proxy-groups'].find(g => g.name === GROUP.HK);
    assert.ok(hkGroup, 'HK group should exist');
    assert.ok(hkGroup.proxies.includes('🇭🇰 HK01'));
  });

  it('hides full preset regional groups without real proxies', () => {
    const config = fullMain(mockConfig(['🇭🇰 HK01', '🇺🇸 US01']), 'windows');
    const names = config['proxy-groups'].map(g => g.name);

    assert.ok(names.includes(GROUP.HK));
    assert.ok(names.includes(GROUP.US));
    assert.ok(!names.includes(GROUP.JP));
    assert.ok(!names.includes(GROUP.SG));
    assert.ok(!names.includes(GROUP.CA));
    assert.ok(!names.includes(GROUP.OTHER));
  });

  it('logs an info summary during normal generation', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => fullMain(mockConfig(['HK01']), 'linux'));
    });
    const infoCall = calls.find(([method, message]) => (
      method === 'log' &&
        / INFO clash-script-adapter\.preset\.full config-generated /.test(message)
    ));

    assert.ok(infoCall);
    assert.match(infoCall[1], /platform=linux/);
    assert.match(infoCall[1], /proxyCount=1/);
  });

  it('logs a sanitized warning when falling back to DIRECT', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => fullMain(mockConfig([]), 'linux'));
    });
    const warnCall = calls.find(([method, message]) => (
      method === 'warn' &&
        / WARN clash-script-adapter\.preset\.full empty-proxies-fallback /.test(message)
    ));

    assert.ok(warnCall);
    assert.match(warnCall[1], /platform=linux/);
    assert.match(warnCall[1], /proxyCount=0/);
    assert.doesNotMatch(warnCall[1], /secret|proxies=|DIRECT/);
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

  it('logs an info summary during normal generation', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => defaultMain(mockConfig(['HK01']), 'linux'));
    });
    const infoCall = calls.find(([method, message]) => (
      method === 'log' &&
        / INFO clash-script-adapter\.preset\.default config-generated /.test(message)
    ));

    assert.ok(infoCall);
    assert.match(infoCall[1], /platform=linux/);
    assert.match(infoCall[1], /proxyCount=1/);
  });

  it('logs a sanitized warning when falling back to DIRECT', () => {
    const calls = captureConsole(() => {
      withoutNavigator(() => defaultMain(mockConfig([]), 'linux'));
    });
    const warnCall = calls.find(([method, message]) => (
      method === 'warn' &&
        / WARN clash-script-adapter\.preset\.default empty-proxies-fallback /.test(message)
    ));

    assert.ok(warnCall);
    assert.match(warnCall[1], /platform=linux/);
    assert.match(warnCall[1], /proxyCount=0/);
    assert.doesNotMatch(warnCall[1], /secret|proxies=|DIRECT/);
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
  it('generates lean DNS by default', () => {
    const presets = { full: fullMain, default: defaultMain, lite: liteMain };
    for (const [name, main] of Object.entries(presets)) {
      const config = main(mockConfig(['HK01']), 'windows');
      assert.equal(config.dns.fallback, undefined, `${name}: fallback must be absent`);
      assert.equal(config.dns['respect-rules'], false, `${name}: DNS must stay direct`);
    }
  });

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

  it('removes informational, invalid, and duplicate proxies in every preset', () => {
    const presets = { full: fullMain, default: defaultMain, lite: liteMain };

    for (const [name, main] of Object.entries(presets)) {
      let config;
      captureConsole(() => {
        config = main({
          proxies: [
            mockProxy('🇭🇰 HK01'),
            mockProxy('剩余流量：1024 GB'),
            mockProxy('官网：https://example.com'),
            mockProxy('🇭🇰 HK01'),
            { name: 'Broken', type: 'ss', server: '', port: 443 },
          ],
        }, 'windows');
      });

      assert.deepEqual(
        config.proxies.map(item => item.name),
        ['🇭🇰 HK01'],
        `${name}: unexpected cleaned proxies`
      );

      const groupRefs = config['proxy-groups'].reduce(
        (refs, group) => [...refs, ...group.proxies],
        []
      );
      assert.ok(!groupRefs.includes('剩余流量：1024 GB'), name);
      assert.ok(!groupRefs.includes('官网：https://example.com'), name);
      assert.ok(!groupRefs.includes('Broken'), name);
    }
  });

  it('falls back to DIRECT when every proxy is informational', () => {
    let config;
    captureConsole(() => {
      config = defaultMain({ proxies: [mockProxy('剩余流量：1 TB')] }, 'windows');
    });

    assert.deepEqual(config.proxies, []);
    const auto = config['proxy-groups'].find(group => group.name === GROUP.AUTO);
    assert.deepEqual(auto.proxies, ['DIRECT']);
  });

  it('does not add a proxies field when the input has none', () => {
    let config;
    captureConsole(() => {
      config = liteMain({}, 'windows');
    });

    assert.equal(config.proxies, undefined);
  });
});
