/**
 * 运行时平台检测。
 * 优先通过 navigator 对象检测（Clash Verge Rev 基于 Tauri，有 navigator），
 * 降级从 profilename 中提取平台关键词（用户可在订阅名中加入 _linux、_android 等提示）。
 *
 * @param {string} [profilename] - 订阅配置文件名称，可包含平台关键词作为降级提示
 * @returns {'windows'|'macos'|'linux'|'android'|'unknown'}
 */
export function detectPlatform(profilename) {
  // Clash Verge Rev (Tauri) 环境有 navigator 对象
  if (typeof navigator !== 'undefined') {
    const p = navigator.platform || navigator.userAgent || '';
    if (/android/i.test(p)) return 'android';
    if (/win/i.test(p)) return 'windows';
    if (/mac/i.test(p)) return 'macos';
    if (/linux/i.test(p)) return 'linux';
  }

  // 降级：从 profilename 推断平台（mihomo 原生环境无 navigator）
  if (profilename) {
    const lower = profilename.toLowerCase();
    if (/android/.test(lower)) return 'android';
    if (/win/.test(lower)) return 'windows';
    if (/mac|darwin/.test(lower)) return 'macos';
    if (/linux/.test(lower)) return 'linux';
  }

  // mihomo 原生环境（路由器等），无 navigator，profname 也无平台关键词
  return 'unknown';
}
