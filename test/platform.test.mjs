import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { detectPlatform } from '../src/modules/platform.js';

function withNavigator(obj, fn) {
  const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: obj, configurable: true, writable: true,
  });
  try {
    fn();
  } finally {
    if (origDesc) Object.defineProperty(globalThis, 'navigator', origDesc);
    else delete globalThis.navigator;
  }
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

describe('detectPlatform', () => {
  describe('profilename fallback (navigator disabled)', () => {
    it('returns android for profilename containing "android"', () => {
      withoutNavigator(() => assert.equal(detectPlatform('my_android_config'), 'android'));
    });

    it('returns windows for profilename containing "win"', () => {
      withoutNavigator(() => assert.equal(detectPlatform('win_laptop'), 'windows'));
    });

    it('returns macos for profilename containing "mac"', () => {
      withoutNavigator(() => assert.equal(detectPlatform('mac_book'), 'macos'));
    });

    it('darwin matches win first due to if-chain order', () => {
      // "darwin" contains "win" as substring, so /win/ matches before /mac|darwin/
      withoutNavigator(() => assert.equal(detectPlatform('darwin'), 'windows'));
    });

    it('returns linux for profilename containing "linux"', () => {
      withoutNavigator(() => assert.equal(detectPlatform('linux_router'), 'linux'));
    });

    it('is case insensitive', () => {
      withoutNavigator(() => {
        assert.equal(detectPlatform('ANDROID_phone'), 'android');
        assert.equal(detectPlatform('WINDOWS_desktop'), 'windows');
        assert.equal(detectPlatform('MAC_air'), 'macos');
        assert.equal(detectPlatform('LINUX_server'), 'linux');
      });
    });

    it('matches first keyword in if-chain order', () => {
      withoutNavigator(() => assert.equal(detectPlatform('android_win'), 'android'));
    });

    it('returns unknown for empty profilename', () => {
      withoutNavigator(() => assert.equal(detectPlatform(''), 'unknown'));
    });

    it('returns unknown for undefined profilename', () => {
      withoutNavigator(() => assert.equal(detectPlatform(undefined), 'unknown'));
    });

    it('returns unknown when profilename has no platform keywords', () => {
      withoutNavigator(() => assert.equal(detectPlatform('abcdef'), 'unknown'));
    });
  });

  describe('navigator detection', () => {
    it('detects android from userAgent', () => {
      withNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 13)' }, () => {
        assert.equal(detectPlatform(), 'android');
      });
    });

    it('detects windows from platform', () => {
      withNavigator({ platform: 'Win32' }, () => {
        assert.equal(detectPlatform(), 'windows');
      });
    });

    it('detects macos from platform', () => {
      withNavigator({ platform: 'MacIntel' }, () => {
        assert.equal(detectPlatform(), 'macos');
      });
    });

    it('detects linux from platform', () => {
      withNavigator({ platform: 'Linux x86_64' }, () => {
        assert.equal(detectPlatform(), 'linux');
      });
    });
  });
});
