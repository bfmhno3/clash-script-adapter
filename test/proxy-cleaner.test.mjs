import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanProxies,
  isJunkProxyName,
  isValidProxy,
} from '../src/modules/proxy-cleaner.js';

function proxy(name, overrides = {}) {
  return {
    name,
    type: 'ss',
    server: '198.51.100.10',
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'secret',
    ...overrides,
  };
}

function createLoggerSpy() {
  const calls = [];
  return {
    calls,
    logger: {
      info: (event, context) => calls.push({ event, context }),
    },
  };
}

describe('isJunkProxyName', () => {
  it('detects Chinese informational node names', () => {
    const names = [
      '剩余流量：100 GB',
      '距离下次重置剩余：12 天',
      '套餐到期：2026-01-01',
      '官网：https://example.com',
      '官方网站',
      '订阅链接',
      'TG群：https://t.me/example',
      'Telegram 群：https://t.me/example',
      '客服：@example',
      '公告：节点维护',
      '欢迎使用示例机场',
      '节点异常',
    ];

    for (const name of names) {
      assert.equal(isJunkProxyName(name), true, name);
    }
  });

  it('detects English informational node names', () => {
    const names = [
      'Traffic: 100GB',
      'Expire: 2026-01-01',
      'Official Website',
      'Telegram Support',
      'Telegram Group',
      'Telegram: @example',
      'Remaining Traffic',
      'Days Left: 12',
    ];

    for (const name of names) {
      assert.equal(isJunkProxyName(name), true, name);
    }
  });

  it('keeps normal regional and relay node names', () => {
    const names = [
      '🇭🇰 HK01',
      '🇺🇸 US01',
      '🇯🇵 日本 IEPL',
      '🇸🇬 Singapore Premium',
      '家宽 01',
      '低倍率 0.5x',
      '香港 01',
      '美国 洛杉矶',
      '东京 BGP',
      'IPLC 专线',
      'CN2 GIA',
      'HKT 家宽',
      'Node-01',
      'Relay-US-02',
      'Telegram',
      'Telegram Premium',
    ];

    for (const name of names) {
      assert.equal(isJunkProxyName(name), false, name);
    }
  });

  it('rejects empty and non-string names', () => {
    assert.equal(isJunkProxyName(''), false);
    assert.equal(isJunkProxyName('   '), false);
    assert.equal(isJunkProxyName(null), false);
    assert.equal(isJunkProxyName(123), false);
  });
});

describe('isValidProxy', () => {
  it('accepts a structurally complete proxy', () => {
    assert.equal(isValidProxy(proxy('HK01')), true);
    assert.equal(isValidProxy(proxy('HK01', { port: '443' })), true);
    assert.equal(isValidProxy(proxy('HK01', { server: '2001:db8::1' })), true);
  });

  it('rejects missing or empty required fields', () => {
    assert.equal(isValidProxy(null), false);
    assert.equal(isValidProxy({}), false);
    assert.equal(isValidProxy(proxy('')), false);
    assert.equal(isValidProxy(proxy('HK01', { name: undefined })), false);
    assert.equal(isValidProxy(proxy('HK01', { type: '' })), false);
    assert.equal(isValidProxy(proxy('HK01', { server: '' })), false);
    assert.equal(isValidProxy(proxy('HK01', { port: undefined })), false);
  });

  it('rejects placeholder and malformed servers', () => {
    const servers = [
      '0.0.0.0',
      '127.0.0.1',
      'localhost',
      'example.com',
      'https://example.com',
      'bad host',
    ];

    for (const server of servers) {
      assert.equal(isValidProxy(proxy('HK01', { server })), false, server);
    }
  });

  it('rejects out-of-range and non-numeric ports', () => {
    const ports = [0, -1, 65536, 443.5, 'abc', ''];

    for (const port of ports) {
      assert.equal(isValidProxy(proxy('HK01', { port })), false, String(port));
    }
  });
});

describe('cleanProxies', () => {
  it('removes informational, invalid, and duplicate entries', () => {
    const valid = proxy('🇭🇰 HK01');
    const duplicate = proxy('🇭🇰 HK01');
    const junk = proxy('剩余流量：100 GB');
    const invalid = proxy('Broken', { server: '' });
    const second = proxy('🇺🇸 US01');

    const cleaned = cleanProxies([valid, junk, invalid, duplicate, second]);

    assert.equal(cleaned.length, 2);
    assert.equal(cleaned[0], valid);
    assert.equal(cleaned[1], second);
  });

  it('logs reason counts without node names', () => {
    const { calls, logger } = createLoggerSpy();
    const cleaned = cleanProxies([
      proxy('🇭🇰 HK01'),
      proxy('剩余流量：100 GB'),
      proxy('Broken', { server: '' }),
      proxy('🇭🇰 HK01'),
      proxy('🇺🇸 US01'),
    ], logger);

    assert.equal(cleaned.length, 2);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].event, 'proxies-cleaned');
    assert.deepEqual(calls[0].context, {
      duplicateNameCount: 1,
      inputCount: 5,
      invalidConfigCount: 1,
      junkNameCount: 1,
      outputCount: 2,
      removedCount: 3,
    });
    assert.equal(JSON.stringify(calls[0].context).includes('HK01'), false);
    assert.equal(JSON.stringify(calls[0].context).includes('剩余流量'), false);
  });

  it('returns an empty list for missing or non-array input', () => {
    assert.deepEqual(cleanProxies(undefined), []);
    assert.deepEqual(cleanProxies(null), []);
    assert.deepEqual(cleanProxies({}), []);
  });
});
