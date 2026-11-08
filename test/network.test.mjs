import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyNetworkFeatures,
  buildNtpConfig,
  buildSnifferConfig,
  buildTunConfig,
} from '../src/modules/network.js';

describe('buildTunConfig', () => {
  it('all platforms have common fields', () => {
    for (const platform of ['windows', 'macos', 'linux', 'android', 'unknown']) {
      const tun = buildTunConfig(platform);
      assert.equal(tun.enable, true, `${platform}: enable`);
      assert.equal(tun.stack, 'mixed', `${platform}: stack`);
      assert.equal(tun['auto-route'], true, `${platform}: auto-route`);
    }
  });

  it('linux includes auto-redirect and gso', () => {
    const tun = buildTunConfig('linux');
    assert.equal(tun['auto-redirect'], true);
    assert.equal(tun.gso, true);
    assert.equal(tun['gso-max-size'], 65536);
  });

  it('android includes auto-redirect and include-android-user', () => {
    const tun = buildTunConfig('android');
    assert.equal(tun['auto-redirect'], true);
    assert.deepEqual(tun['include-android-user'], ['0', '10']);
    assert.equal(tun.gso, undefined);
  });

  it('windows does not include auto-redirect or gso', () => {
    const tun = buildTunConfig('windows');
    assert.equal(tun['auto-redirect'], undefined);
    assert.equal(tun.gso, undefined);
  });

  it('macos does not include auto-redirect or gso', () => {
    const tun = buildTunConfig('macos');
    assert.equal(tun['auto-redirect'], undefined);
    assert.equal(tun.gso, undefined);
  });

  it('unknown does not include auto-redirect or gso', () => {
    const tun = buildTunConfig('unknown');
    assert.equal(tun['auto-redirect'], undefined);
    assert.equal(tun.gso, undefined);
  });
});

describe('buildSnifferConfig', () => {
  it('enables sniffing', () => {
    const sniffer = buildSnifferConfig();
    assert.equal(sniffer.enable, true);
  });

  it('includes HTTP/TLS/QUIC sniff config', () => {
    const sniffer = buildSnifferConfig();
    assert.ok(sniffer.sniff.HTTP);
    assert.ok(sniffer.sniff.TLS);
    assert.ok(sniffer.sniff.QUIC);
  });

  it('force-domain is non-empty', () => {
    const sniffer = buildSnifferConfig();
    assert.ok(Array.isArray(sniffer['force-domain']));
    assert.ok(sniffer['force-domain'].length > 0);
  });

  it('skip-domain is non-empty', () => {
    const sniffer = buildSnifferConfig();
    assert.ok(Array.isArray(sniffer['skip-domain']));
    assert.ok(sniffer['skip-domain'].length > 0);
  });
});

describe('buildNtpConfig', () => {
  it('builds an enabled NTP client that does not write the system clock', () => {
    const ntp = buildNtpConfig();
    assert.equal(ntp.enable, true);
    assert.equal(ntp.server, 'time.cloudflare.com');
    assert.equal(ntp.port, 123);
    assert.equal(ntp.interval, 30);
    assert.equal(ntp['write-to-system'], false);
    assert.equal(ntp['dialer-proxy'], 'DIRECT');
  });
});

describe('applyNetworkFeatures', () => {
  it('adds enabled network blocks and replaces incoming values', () => {
    const config = {
      tun: { enable: false },
      sniffer: { enable: false },
      ntp: { enable: false },
    };

    applyNetworkFeatures(
      config,
      { tun: true, sniffer: true, ntp: true },
      'linux'
    );

    assert.equal(config.tun.enable, true);
    assert.equal(config.tun['auto-redirect'], true);
    assert.equal(config.sniffer.enable, true);
    assert.equal(config.ntp.enable, true);
  });

  it('removes disabled network blocks from the incoming config', () => {
    const config = {
      tun: { enable: true },
      sniffer: { enable: true },
      ntp: { enable: true },
    };

    applyNetworkFeatures(
      config,
      { tun: false, sniffer: false, ntp: false },
      'linux'
    );

    assert.equal(config.tun, undefined);
    assert.equal(config.sniffer, undefined);
    assert.equal(config.ntp, undefined);
  });
});
