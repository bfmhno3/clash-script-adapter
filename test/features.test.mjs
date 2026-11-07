import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { features as fullFeatures } from '../src/features/full.js';
import { features as defaultFeatures } from '../src/features/default.js';
import { features as liteFeatures } from '../src/features/lite.js';

describe('features/full.js', () => {
  it('enables info-level runtime logging', () => {
    assert.deepEqual(fullFeatures.logging, {
      enabled: true,
      level: 'info',
    });
  });

  it('enables tun, sniffer, ntp', () => {
    assert.equal(fullFeatures.tun, true);
    assert.equal(fullFeatures.sniffer, true);
    assert.equal(fullFeatures.ntp, true);
  });

  it('uses lean DNS by default', () => {
    assert.equal(fullFeatures.dns.strict, false);
  });

  it('has all 16 regions', () => {
    const all = [
      ...fullFeatures.regions.core,
      ...fullFeatures.regions.extended,
      ...fullFeatures.regions.special,
    ];
    assert.equal(all.length, 16);
  });

  it('enables all proxy group switches', () => {
    assert.equal(fullFeatures.proxyGroups.streaming, true);
    assert.equal(fullFeatures.proxyGroups.ai, true);
    assert.equal(fullFeatures.proxyGroups.social, true);
    assert.equal(fullFeatures.proxyGroups.gaming, true);
    assert.equal(fullFeatures.proxyGroups.special, true);
    assert.equal(fullFeatures.proxyGroups.pruneEmptyRegions, true);
  });

  it('enables all rule switches', () => {
    assert.equal(fullFeatures.rules.streaming, true);
    assert.equal(fullFeatures.rules.ai, true);
    assert.equal(fullFeatures.rules.social, true);
    assert.equal(fullFeatures.rules.gaming, true);
    assert.equal(fullFeatures.rules.special, true);
  });
});

describe('features/default.js', () => {
  it('enables info-level runtime logging', () => {
    assert.deepEqual(defaultFeatures.logging, {
      enabled: true,
      level: 'info',
    });
  });

  it('disables tun, enables sniffer and ntp', () => {
    assert.equal(defaultFeatures.tun, false);
    assert.equal(defaultFeatures.sniffer, true);
    assert.equal(defaultFeatures.ntp, true);
  });

  it('uses lean DNS by default', () => {
    assert.equal(defaultFeatures.dns.strict, false);
  });

  it('has 6 core regions only', () => {
    assert.equal(defaultFeatures.regions.core.length, 6);
    assert.equal(defaultFeatures.regions.extended.length, 0);
    assert.equal(defaultFeatures.regions.special.length, 0);
  });

  it('enables streaming/ai/social/gaming, disables special', () => {
    assert.equal(defaultFeatures.proxyGroups.streaming, true);
    assert.equal(defaultFeatures.proxyGroups.ai, true);
    assert.equal(defaultFeatures.proxyGroups.social, true);
    assert.equal(defaultFeatures.proxyGroups.gaming, true);
    assert.equal(defaultFeatures.proxyGroups.special, false);
    assert.equal(defaultFeatures.proxyGroups.pruneEmptyRegions, false);
  });

  it('disables special rules', () => {
    assert.equal(defaultFeatures.rules.special, false);
  });
});

describe('features/lite.js', () => {
  it('disables runtime logging', () => {
    assert.deepEqual(liteFeatures.logging, {
      enabled: false,
      level: 'silent',
    });
  });

  it('disables tun, sniffer, ntp', () => {
    assert.equal(liteFeatures.tun, false);
    assert.equal(liteFeatures.sniffer, false);
    assert.equal(liteFeatures.ntp, false);
  });

  it('uses lean DNS by default', () => {
    assert.equal(liteFeatures.dns.strict, false);
  });

  it('has 3 core regions only', () => {
    assert.equal(liteFeatures.regions.core.length, 3);
    assert.equal(liteFeatures.regions.extended.length, 0);
    assert.equal(liteFeatures.regions.special.length, 0);
  });

  it('enables streaming only, disables ai/social/gaming/special', () => {
    assert.equal(liteFeatures.proxyGroups.streaming, true);
    assert.equal(liteFeatures.proxyGroups.ai, false);
    assert.equal(liteFeatures.proxyGroups.social, false);
    assert.equal(liteFeatures.proxyGroups.gaming, false);
    assert.equal(liteFeatures.proxyGroups.special, false);
    assert.equal(liteFeatures.proxyGroups.pruneEmptyRegions, false);
  });

  it('enables only basic and streaming rules', () => {
    assert.equal(liteFeatures.rules.basic, true);
    assert.equal(liteFeatures.rules.streaming, true);
    assert.equal(liteFeatures.rules.ai, false);
    assert.equal(liteFeatures.rules.social, false);
    assert.equal(liteFeatures.rules.gaming, false);
    assert.equal(liteFeatures.rules.special, false);
  });
});

describe('features consistency', () => {
  it('all presets expose a boolean dns.strict switch', () => {
    for (const [name, f] of Object.entries({ full: fullFeatures, default: defaultFeatures, lite: liteFeatures })) {
      assert.equal(typeof f.dns.strict, 'boolean', `${name}: dns.strict must be boolean`);
    }
  });

  it('proxyGroups and rules switches are aligned across presets', () => {
    for (const [name, f] of Object.entries({ full: fullFeatures, default: defaultFeatures, lite: liteFeatures })) {
      assert.equal(f.proxyGroups.streaming, f.rules.streaming, `${name}: streaming mismatch`);
      assert.equal(f.proxyGroups.ai, f.rules.ai, `${name}: ai mismatch`);
      assert.equal(f.proxyGroups.social, f.rules.social, `${name}: social mismatch`);
      assert.equal(f.proxyGroups.gaming, f.rules.gaming, `${name}: gaming mismatch`);
      assert.equal(f.proxyGroups.special, f.rules.special, `${name}: special mismatch`);
    }
  });
});
