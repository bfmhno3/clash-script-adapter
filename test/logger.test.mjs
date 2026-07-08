import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LEVELS,
  createLogger,
  formatLogLine,
  normalizeLogLevel,
} from '../src/modules/logger.js';

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

describe('normalizeLogLevel', () => {
  it('maps standard log level names to numeric thresholds', () => {
    assert.equal(normalizeLogLevel('trace'), LEVELS.trace);
    assert.equal(normalizeLogLevel('DEBUG'), LEVELS.debug);
    assert.equal(normalizeLogLevel('info'), LEVELS.info);
    assert.equal(normalizeLogLevel('warn'), LEVELS.warn);
    assert.equal(normalizeLogLevel('error'), LEVELS.error);
  });

  it('maps silent and off to Infinity', () => {
    assert.equal(normalizeLogLevel('silent'), Infinity);
    assert.equal(normalizeLogLevel('off'), Infinity);
  });

  it('falls back to the provided default level for unknown values', () => {
    assert.equal(normalizeLogLevel('verbose', 'warn'), LEVELS.warn);
    assert.equal(normalizeLogLevel(undefined, 'error'), LEVELS.error);
  });

  it('falls back to info when the provided default level is unknown', () => {
    assert.equal(normalizeLogLevel(undefined, 'verbose'), LEVELS.info);
  });
});

describe('formatLogLine', () => {
  it('formats ISO timestamp, level, namespace, event, and sorted context', () => {
    const line = formatLogLine(
      'warn',
      'preset.default',
      'empty-proxies-fallback',
      { proxyCount: 0, platform: 'windows' },
      new Date('2026-01-02T03:04:05.006Z')
    );

    assert.equal(
      line,
      '2026-01-02T03:04:05.006Z WARN clash-script-adapter.preset.default empty-proxies-fallback platform=windows proxyCount=0'
    );
  });

  it('serializes context values without undefined fields', () => {
    const line = formatLogLine(
      'info',
      'module',
      'serialized',
      {
        array: ['a', 'b'],
        object: { enabled: true },
        quote: 'needs "quotes"',
        space: 'needs quotes',
        skip: undefined,
      },
      new Date('2026-01-02T03:04:05.006Z')
    );

    assert.equal(
      line,
      '2026-01-02T03:04:05.006Z INFO clash-script-adapter.module serialized array=["a","b"] object={"enabled":true} quote="needs \\"quotes\\"" space="needs quotes"'
    );
  });
});

describe('createLogger', () => {
  it('filters messages below the configured threshold', () => {
    const calls = captureConsole(() => {
      const logger = createLogger('test', { level: 'warn' });
      logger.info('filtered');
      logger.warn('visible');
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'warn');
    assert.match(calls[0][1], / WARN clash-script-adapter\.test visible$/);
  });

  it('routes error, warn, and lower levels to the expected console methods', () => {
    const calls = captureConsole(() => {
      const logger = createLogger('test', { level: 'trace' });
      logger.error('error-event');
      logger.warn('warn-event');
      logger.debug('debug-event');
    });

    assert.deepEqual(calls.map(([method]) => method), ['error', 'warn', 'log']);
  });

  it('does not output when level is silent', () => {
    const calls = captureConsole(() => {
      const logger = createLogger('test', { level: 'silent' });
      logger.error('hidden');
    });

    assert.deepEqual(calls, []);
  });

  it('does not throw when console is unavailable', () => {
    const originalConsole = globalThis.console;
    globalThis.console = undefined;

    try {
      const logger = createLogger('test', { level: 'trace' });
      assert.doesNotThrow(() => logger.error('hidden'));
    } finally {
      globalThis.console = originalConsole;
    }
  });
});
