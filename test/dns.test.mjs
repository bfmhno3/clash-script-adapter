import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDnsConfig } from '../src/modules/dns.js';

describe('buildDnsConfig', () => {
  it('enables fake-ip mode', () => {
    const dns = buildDnsConfig();
    assert.equal(dns['enhanced-mode'], 'fake-ip');
  });

  it('uses arc cache algorithm', () => {
    const dns = buildDnsConfig();
    assert.equal(dns['cache-algorithm'], 'arc');
  });

  it('enables ipv6', () => {
    const dns = buildDnsConfig();
    assert.equal(dns.ipv6, true);
  });

  it('uses a fake-ip-range6 outside the TUN excluded fc00::/7 range', () => {
    const dns = buildDnsConfig();
    assert.equal(dns['fake-ip-range6'], '2001:db8:9876::1/64');
  });

  it('contains nameserver-policy for DNS splitting', () => {
    const dns = buildDnsConfig();
    assert.ok(dns['nameserver-policy']);
    assert.ok(dns['nameserver-policy']['geosite:cn,private']);
    assert.ok(dns['nameserver-policy']['geosite:geolocation-!cn']);
  });

  it('fallback-filter includes geoip, ipcidr, and domain', () => {
    const dns = buildDnsConfig();
    const filter = dns['fallback-filter'];
    assert.ok(filter);
    assert.equal(filter.geoip, true);
    assert.ok(Array.isArray(filter.ipcidr));
    assert.ok(filter.ipcidr.length > 0);
    assert.ok(Array.isArray(filter.domain));
    assert.ok(filter.domain.length > 0);
  });

  it('fake-ip-filter is non-empty and includes *.lan', () => {
    const dns = buildDnsConfig();
    assert.ok(Array.isArray(dns['fake-ip-filter']));
    assert.ok(dns['fake-ip-filter'].length > 0);
    assert.ok(dns['fake-ip-filter'].includes('*.lan'));
  });

  it('has proxy-server-nameserver', () => {
    const dns = buildDnsConfig();
    assert.ok(Array.isArray(dns['proxy-server-nameserver']));
    assert.ok(dns['proxy-server-nameserver'].length > 0);
  });

  it('has direct-nameserver', () => {
    const dns = buildDnsConfig();
    assert.ok(Array.isArray(dns['direct-nameserver']));
    assert.ok(dns['direct-nameserver'].length > 0);
  });
});
