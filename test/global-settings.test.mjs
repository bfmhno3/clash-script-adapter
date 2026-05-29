import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildGlobalSettings, buildRuleProviders } from '../src/modules/global-settings.js';

describe('buildGlobalSettings', () => {
  it('returns base config for all platforms', () => {
    for (const platform of ['windows', 'macos', 'linux', 'android', 'unknown']) {
      const config = buildGlobalSettings(platform);
      assert.equal(config.mode, 'rule', `${platform}: mode`);
      assert.ok(config.profile, `${platform}: profile`);
    }
  });

  it('linux includes routing-mark 6666', () => {
    const config = buildGlobalSettings('linux');
    assert.equal(config['routing-mark'], 6666);
  });

  it('unknown includes routing-mark 6666', () => {
    const config = buildGlobalSettings('unknown');
    assert.equal(config['routing-mark'], 6666);
  });

  it('windows does not include routing-mark', () => {
    const config = buildGlobalSettings('windows');
    assert.equal(config['routing-mark'], undefined);
  });

  it('macos does not include routing-mark', () => {
    const config = buildGlobalSettings('macos');
    assert.equal(config['routing-mark'], undefined);
  });

  it('android find-process-mode is off', () => {
    const config = buildGlobalSettings('android');
    assert.equal(config['find-process-mode'], 'off');
  });

  it('non-android find-process-mode is strict', () => {
    for (const platform of ['windows', 'macos', 'linux', 'unknown']) {
      const config = buildGlobalSettings(platform);
      assert.equal(config['find-process-mode'], 'strict', `${platform}: find-process-mode`);
    }
  });

  it('geo-url ASN uses gh-proxy', () => {
    const config = buildGlobalSettings('windows');
    assert.ok(
      config['geo-url'].asn.startsWith('https://gh-proxy.com/'),
      `ASN URL should use gh-proxy, got ${config['geo-url'].asn}`
    );
  });
});

describe('buildRuleProviders', () => {
  it('returns more than 30 providers', () => {
    const providers = buildRuleProviders();
    const keys = Object.keys(providers);
    assert.ok(keys.length > 30, `Expected >30 providers, got ${keys.length}`);
  });

  it('each provider has required fields', () => {
    const providers = buildRuleProviders();
    for (const [name, provider] of Object.entries(providers)) {
      assert.ok(provider.type, `${name}: type`);
      assert.ok(provider.behavior, `${name}: behavior`);
      assert.ok(provider.url, `${name}: url`);
      assert.ok(provider.path, `${name}: path`);
      assert.equal(provider.interval, 28800, `${name}: interval`);
    }
  });

  it('all GitHub URLs use gh-proxy', () => {
    const providers = buildRuleProviders();
    for (const [name, provider] of Object.entries(providers)) {
      assert.ok(
        provider.url.startsWith('https://gh-proxy.com/'),
        `${name}: URL should use gh-proxy, got ${provider.url}`
      );
    }
  });

  it('classical behavior providers must not use .mrs files', () => {
    const providers = buildRuleProviders();
    for (const [name, provider] of Object.entries(providers)) {
      if (provider.behavior === 'classical') {
        assert.ok(
          !provider.url.endsWith('.mrs'),
          `${name}: classical behavior cannot use .mrs binary file, got ${provider.url}`
        );
        assert.ok(
          !provider.path.endsWith('.mrs'),
          `${name}: classical behavior cannot use .mrs path, got ${provider.path}`
        );
      }
    }
  });
});
