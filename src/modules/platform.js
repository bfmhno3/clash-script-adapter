/**
 * Runtime platform detection.
 * @param {string} [profilename] - Subscription profile name, may contain platform hints.
 * @returns {'windows'|'macos'|'linux'|'android'|'unknown'}
 */
export function detectPlatform(profilename) {
  if (typeof navigator !== 'undefined') {
    const p = navigator.platform || navigator.userAgent || '';
    if (/android/i.test(p)) return 'android';
    if (/win/i.test(p)) return 'windows';
    if (/mac/i.test(p)) return 'macos';
    if (/linux/i.test(p)) return 'linux';
  }

  // Fallback: infer from profilename
  if (profilename) {
    const lower = profilename.toLowerCase();
    if (/android/.test(lower)) return 'android';
    if (/win/.test(lower)) return 'windows';
    if (/mac|darwin/.test(lower)) return 'macos';
    if (/linux/.test(lower)) return 'linux';
  }

  return 'unknown';
}
