# Clash Script Adapter

<img src="https://img.shields.io/badge/mihomo-Meta%20CubeX-0A0A0A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVIN0wxMiAyeiIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==" alt="mihomo"><img src="https://img.shields.io/badge/Clash%20Verge%20Rev-Supported-6366f1?style=for-the-badge&logo=ghost&logoColor=white" alt="Clash Verge Rev"><img src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"><img src="https://img.shields.io/badge/Build-esbuild%20%2B%20Terser-FFCF00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIgMTJoMjBNMTIgMnYyME0yIDEyaDIwTDEyIDJsMTAgMTAtMTAgMTB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkNGMDAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" alt="Build">

<div align="center">
**一套模块化、可编译的 Clash/Mihomo 脚本配置生成器**

*通过条件编译 Dead Code Elimination，在构建时裁剪不需要的功能*

*输出三种精简方案，适配从路由器到桌面全场景*

[快速开始](#-快速开始) . [方案对比](#-方案对比) . [架构设计](#%EF%B8%8F-架构设计) . [跨平台](#-跨平台适配) . [构建](#-构建系统)
</div>

---

## Highlights

```
   +---------------------------------------------------------------------+
   |                                                                     |
   |    不是维护多份代码，而是一套模块 + 一组配置参数                         |
   |                                                                     |
   |    类比 C/C++ 条件编译：                                              |
   |      if (features.tun) { ... }                                      |
   |      ----------------                                               |
   |      esbuild bundle --> terser DCE --> if(false){} 被移除             |
   |                                                                     |
   |    最终产物：零冗余，纯运行时代码                                       |
   |                                                                     |
   +---------------------------------------------------------------------+
```

---

## 方案对比

### Lite

**轻量方案**

| 地区 | 3 (HK, US, JP) |
|---|---|
| TUN | -- |
| Sniffer | -- |
| NTP | -- |
| 代理组 | ~12 |
| 规则集 | 基础 + 流媒体 |
| 产物 | ~5-7 KB |

适用于：路由器、低性能设备

### Default

**默认方案**

| 地区 | 6 (HK,US,JP,SG,TW,KR) |
|---|---|
| TUN | -- |
| Sniffer | yes |
| NTP | yes |
| 代理组 | ~25 |
| 规则集 | 基础 + 流媒体 + AI + 社交 + 游戏 |
| 产物 | ~8-10 KB |

适用于：桌面客户端、通用场景

### Full

**完整方案**

| 地区 | 16 (全部) |
|---|---|
| TUN | yes |
| Sniffer | yes |
| NTP | yes |
| 代理组 | ~40 |
| 规则集 | 全量 |
| 产物 | ~14-18 KB |

适用于：透明代理、全功能需求

---

## 架构设计

```
clash-script-adapter/
|
+-- src/
|   +-- presets/                     +--------------------------+
|   |   +-- default.js              |  入口：组合模块 + features |
|   |   +-- full.js                 |  ~30 行，纯编排逻辑       |
|   |   +-- lite.js                 +--------------------------+
|   |
|   +-- features/                    +--------------------------+
|   |   +-- default.js              |  编译开关：功能/地区/规则  |
|   |   +-- full.js                 |  构建时 DCE 的判定依据     |
|   |   +-- lite.js                 +--------------------------+
|   |
|   +-- modules/                     +--------------------------+
|       +-- platform.js             |  运行时平台检测            |
|       +-- regions.js              |  16 地区正则识别           |
|       +-- proxy-groups.js         |  代理组构建（40+ 组）      |
|       +-- rules.js                |  分流规则（GEOSITE/GEOIP） |
|       +-- dns.js                  |  DNS 防泄露配置            |
|       +-- global-settings.js      |  全局设置 + 规则提供者     |
|       +-- network.js              |  TUN + Sniffer 配置       |
|                                   +--------------------------+
|
+-- dist/                            构建产物 (gitignored)
|   +-- default.min.js
|   +-- full.min.js
|   +-- lite.min.js
|
+-- build.js                         esbuild bundle + terser minify
```

### 条件编译链路

```
  features.tun = false     (default preset)
       |
       v
  if (features.tun) {      --+
    config.tun = build()   --+  esbuild 将常量内联
  }                        --+
       |
       v
  if (false) {             --+
    config.tun = build()   --+  terser 识别为 dead code
  }                        --+
       |
       v
  [removed]                -- 产物中不存在此代码块
```

---

## 跨平台适配

运行时自动检测平台，应用差异化配置：

| 配置项 | Windows | macOS | Linux | Android |
|--------|:-------:|:-----:|:-----:|:-------:|
| `strict-route` | yes | -- | -- | -- |
| `auto-redirect` | -- | -- | yes | yes |
| `gso` / `gso-max-size` | -- | -- | yes | -- |
| `include-android-user` | -- | -- | -- | yes |
| `routing-mark` | -- | -- | yes | -- |
| `find-process-mode` | strict | strict | strict | off |
| `disable-keep-alive` | yes | yes | yes | yes |

**降级策略**：mihomo 原生环境（路由器等）无 `navigator` 对象时，从 `profilename` 中提取平台关键词（`_linux`、`_android`）作为 fallback。

---

## 代理组策略

```
+-------------------------------------------------------------+
|                  Proxy Group Type Selection                 |
+-------------------+-----------------------------------------+
|   url-test        |  Regional groups and Auto Select        |
|   select          |  Manual Select, Direct, AI, streaming   |
|                   |  and special service groups             |
+-------------------+-----------------------------------------+
```

All user-visible proxy group names are generated in English. AI-related rules
share the `AI Services` selector, which defaults to `United States` first.
`YouTube` defaults to `Hong Kong`, then `Japan`, because the first selector
entry becomes the initial choice in Clash clients.

### 地区覆盖

| 核心 (Core) | 扩展 (Extended) | 特殊 (Special) |
|:-----------:|:---------------:|:--------------:|
| HK US JP | CA GB FR DE | Other |
| SG TW KR | NL TR RU | Home Low |

---

## DNS 防泄露

默认使用 lean 模式（`features.dns.strict = false`）：

```
                    +--------------+
                    |  DNS 请求    |
                    +------+-------+
                           |
                    +------v-------+
                    |  fake-ip     |  增强模式，防止真实 IP 暴露
                    |  模式        |
                    +------+-------+
                           |
              +------------+------------+
              |                         |
       +------v-------+         +-------v------+
       |  代理域名     |         |  直连域名     |
       |  立即返回     |         |  nameserver  |
       |  fake IP      |         |  阿里/腾讯 DoH |
       |  交给远端解析  |         |              |
       +--------------+         +--------------+
```

- `nameserver` 只保留阿里和腾讯 DoH；代理节点域名由同一组服务器解析。
- 不配置 `fallback`、`fallback-filter`、`nameserver-policy`、`direct-nameserver`。
- `respect-rules: false`：DNS 连接直连，不依赖代理可用性。
- 代理域名不会进入本地解析器，因此没有本地 DNS 泄露，也没有额外的境外 DoH 往返。
- `fake-ip-filter` 只保留 LAN、NTP、连通性检测和直连服务；Netflix、Xbox、STUN 等代理域名不再强制真实 IP。
- 上述结论的前提是 `fake-ip-filter` 不包含代理域名。自行添加条目时，必须同时确认该域名会直连，否则会重新引入本地解析。
- ARC 缓存算法（自适应替换，优于 LRU）
- IPv6：内核与 DNS 均开启 IPv6，fake-ip 同时下发 AAAA（`fake-ip-range6: 2001:db8:9876::1/64`，刻意避开 TUN 的 `fc00::/7` 排除段，否则 fake IPv6 无法回到 Mihomo）。

需要旧的完全隔离方案时，将对应 `src/features/<preset>.js` 顶部的 `DNS_STRICT` 改为 `true`：

```js
export const DNS_STRICT = true;
```

`features.dns.strict` 会同步反映该值。strict 模式恢复 `fallback`、`fallback-filter`、`nameserver-policy`、`direct-nameserver` 和 `respect-rules: true`，并把被代理服务重新放回 `fake-ip-filter`。

- `Final` 组默认代理优先：未命中规则的域名会进入 `MATCH -> Final`，默认先走 `Auto Select` / `Manual Select` / 节点，`Direct` 仅保留为手动选项。
- IPLeak 类页面看到本地运营商出口 IP，通常表示访问连接被直连，不一定单独证明 DNS 泄露；DNS 泄露要看页面列出的 DNS resolver 是否为本地运营商或系统 DNS。
- Clash Verge Rev 中需确认流量已被客户端接管：full preset 已生成 TUN `dns-hijack` 与 `strict-route`，default/lite 需在客户端侧启用 TUN 或系统代理，并确保 DNS 劫持/覆写 DNS 生效。
- 如果 DNS 测试仍显示本地运营商 DNS，先检查 `Final` 是否被手动切到 `Direct`，再检查 TUN、DNS 劫持、系统 DNS 与浏览器安全 DNS/DoH 设置是否绕过了 Mihomo。

---

## 规则集

| 类别 | 规则类型 | 策略组 |
|------|---------|--------|
| 基础 | `GEOSITE(private)` / `GEOIP(private)` / `RULE-SET(Custom_*)` | `Direct` |
| 流媒体 | `GEOSITE(youtube/netflix/disney/hbo/spotify/...)` | `select` |
| AI 服务 | `GEOSITE(openai/google-gemini/category-ai-!cn)` | `AI Services` |
| 社交通讯 | `GEOSITE(category-communication/social-media/github/...)` | `select` |
| 游戏 | `GEOSITE(steam/category-games)` | `select` |
| 特殊服务 | `GEOSITE(talkatone/onedrive/bing/paypal/...)` | `select` |
| 兜底 | `GEOSITE(cn) / GEOIP(cn) / MATCH` | `Direct` / `Final` |

---

## 快速开始

### 安装依赖

本项目使用 [mise](https://mise.jdx.dev/) 管理工具链：

```bash
mise install
```

或手动安装 Node.js + npm 全局包：

```bash
npm install -g esbuild terser
```

### 构建

```bash
# 使用 mise
mise run build

# 或直接运行
node build.js
```

产物输出到 `dist/`：

```
dist/
+-- default.min.js      # 默认方案 (~8-10 KB)
+-- full.min.js         # 完整方案 (~14-18 KB)
+-- lite.min.js         # 轻量方案 (~5-7 KB)
```

### 使用

将 `.min.js` 的内容复制粘贴到 Clash Verge Rev 等软件的 “全局扩展脚本” 中即可。

### 运行时日志

脚本内置 BOA-safe 单行日志系统，不依赖 Node.js、浏览器网络 API 或文件 API。默认策略：

| Preset | Enabled | Level |
|---|:---:|---|
| `lite` | no | `silent` |
| `default` | yes | `info` |
| `full` | yes | `info` |

日志等级从低到高为 `trace`、`debug`、`info`、`warn`、`error`，`silent` 和 `off` 会关闭输出。格式为：

```text
2026-01-02T03:04:05.006Z WARN clash-script-adapter.preset.default empty-proxies-fallback platform=linux proxyCount=0
```

如需调整日志行为，修改对应 `src/features/*.js` 顶部的静态开关：

```js
export const LOGGING_ENABLED = true;
export const LOGGING_LEVEL = 'info';
```

日志只记录平台、数量和功能摘要等排障信息，不输出节点名称、`secret` 或完整配置对象。

---

## 依赖关系

```
  preset (default/full/lite)
    |
    +-- features --- 编译开关
    |
    +-- platform --- 平台检测
    |
    +-- regions ---- 16 地区正则
    |
    +-- proxy-groups - GROUP const ---+
    |       ^                        |
    |       +-------- rules ---------+  (共享组名常量)
    |
    +-- dns
    |
    +-- global-settings
    |
    +-- network ---- TUN + Sniffer
```

---

## 参考项目

- [Aethersailor/Custom_OpenClash_Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules) -- 规则集来源
- [mihomo wiki](https://wiki.metacubex.one/) -- 官方配置文档
- [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) -- 客户端

---

**Made with care for the Clash community**

