import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDnsConfig, buildStrictDnsConfig } from '../src/modules/dns.js';

describe('buildDnsConfig (lean)', () => {
  const dns = buildDnsConfig();

  it('enables fake-ip mode', () => {
    assert.equal(dns['enhanced-mode'], 'fake-ip');
  });

  it('uses arc cache algorithm', () => {
    assert.equal(dns['cache-algorithm'], 'arc');
  });

  it('enables ipv6', () => {
    assert.equal(dns.ipv6, true);
  });

  it('uses a fake-ip-range6 outside the TUN excluded fc00::/7 range', () => {
    assert.equal(dns['fake-ip-range6'], '2001:db8:9876::1/64');
  });

  it('uses domestic encrypted DoH nameservers only', () => {
    assert.deepEqual(dns.nameserver, [
      'https://dns.alidns.com/dns-query',
      'https://doh.pub/dns-query',
    ]);
  });

  it('removes fallback, fallback-filter, nameserver-policy, and direct-nameserver', () => {
    assert.equal(dns.fallback, undefined);
    assert.equal(dns['fallback-filter'], undefined);
    assert.equal(dns['nameserver-policy'], undefined);
    assert.equal(dns['direct-nameserver'], undefined);
  });

  it('keeps DNS connections off the proxy path', () => {
    assert.equal(dns['respect-rules'], false);
  });

  it('resolves proxy node domains with domestic DoH', () => {
    assert.ok(Array.isArray(dns['proxy-server-nameserver']));
    assert.ok(dns['proxy-server-nameserver'].length > 0);
    assert.equal(dns['proxy-server-nameserver'][0], 'https://dns.alidns.com/dns-query');
  });

  it('keeps LAN, NTP, and direct entries in fake-ip-filter', () => {
    assert.ok(dns['fake-ip-filter'].includes('*.lan'));
    assert.ok(dns['fake-ip-filter'].includes('time.*.com'));
    assert.ok(dns['fake-ip-filter'].includes('+.qq.com'));
    assert.ok(dns['fake-ip-filter'].includes('music.163.com'));
    assert.ok(dns['fake-ip-filter'].includes('Mijia Cloud'));
    assert.ok(dns['fake-ip-filter'].includes('local.adguard.org'));
  });

  it('drops proxied services from fake-ip-filter', () => {
    for (const domain of [
      '+.nflxvideo.net',
      '+.media.dssott.com',
      'xbox.*.microsoft.com',
      'stun.*.*',
      '+.srv.nintendo.net',
      '+.wargaming.net',
      'mesu.apple.com',
      'proxy.golang.org',
    ]) {
      assert.equal(dns['fake-ip-filter'].includes(domain), false, domain);
    }
  });
});

describe('buildStrictDnsConfig', () => {
  const dns = buildStrictDnsConfig();

  it('restores fallback and fallback-filter', () => {
    assert.ok(Array.isArray(dns.fallback));
    assert.ok(dns.fallback.length > 0);
    assert.ok(dns['fallback-filter']);
    assert.equal(dns['fallback-filter'].geoip, true);
    assert.ok(dns['fallback-filter'].ipcidr.length > 0);
    assert.ok(dns['fallback-filter'].domain.length > 0);
  });

  it('restores nameserver-policy and direct-nameserver', () => {
    assert.ok(dns['nameserver-policy']);
    assert.ok(dns['nameserver-policy']['geosite:cn,private']);
    assert.ok(dns['nameserver-policy']['geosite:geolocation-!cn']);
    assert.ok(Array.isArray(dns['direct-nameserver']));
    assert.ok(dns['direct-nameserver'].length > 0);
  });

  it('keeps DNS connections on the proxy path', () => {
    assert.equal(dns['respect-rules'], true);
  });

  it('keeps IP-based nameservers and proxy-server-nameserver', () => {
    assert.deepEqual(dns.nameserver, [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query',
    ]);
    assert.deepEqual(dns['proxy-server-nameserver'], dns.nameserver);
  });

  it('keeps every lean fake-ip-filter entry', () => {
    for (const domain of [
      '*.lan',
      'time.*.com',
      '+.qq.com',
      'music.163.com',
      '+.battlenet.com.cn',
      '*.mcdn.bilivideo.cn',
      '+.pub.3gppnetwork.org',
    ]) {
      assert.ok(dns['fake-ip-filter'].includes(domain), domain);
    }
  });

  it('keeps proxied services that need strict local resolution', () => {
    for (const domain of [
      '+.nflxvideo.net',
      'xbox.*.microsoft.com',
      'stun.*.*',
      'proxy.golang.org',
    ]) {
      assert.ok(dns['fake-ip-filter'].includes(domain), domain);
    }
  });
});
