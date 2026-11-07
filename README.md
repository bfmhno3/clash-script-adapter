# Clash Script Adapter

<img src="https://img.shields.io/badge/mihomo-Meta%20CubeX-0A0A0A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVIN0wxMiAyeiIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==" alt="mihomo"><img src="https://img.shields.io/badge/Clash%20Verge%20Rev-Supported-6366f1?style=for-the-badge&logo=ghost&logoColor=white" alt="Clash Verge Rev"><img src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"><img src="https://img.shields.io/badge/Build-esbuild%20%2B%20Terser-FFCF00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIgMTJoMjBNMTIgMnYyME0yIDEyaDIwTDEyIDJsMTAgMTAtMTAgMTB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkNGMDAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" alt="Build">

<div align="center">
**一套模块化、可编译的 Clash/Mihomo 脚本配置生成器**

*通过条件编译 Dead Code Elimination，在构建时裁剪不需要的功能*

*输出四种方案：轻量 / 默认 / 完整 / 固定出口 (AI)，适配从路由器到桌面全场景*

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
| 产物 | ~28 KB / ~9 KB (min / gzip) |

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
| 产物 | ~30 KB / ~9.5 KB (min / gzip) |

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
| 产物 | ~31 KB / ~10 KB (min / gzip) |

适用于：透明代理、全功能需求

### AI

**固定出口方案**

| 地区 | 无（不生成地区组） |
|---|---|
| TUN | yes |
| Sniffer | yes |
| NTP | yes |
| 代理组 | 3 (Fixed Exit, Microsoft, Apple) |
| 规则集 | 基础 + AI 优先 + 国内直连 |
| 产物 | ~31 KB / ~10 KB (min / gzip) |

适用于：AI 订阅服务、需要固定单一出口 IP 的场景

产物大小为 v1.3.0 实测；其余方案同。

---

## 架构设计

```
clash-script-adapter/
|
+-- src/
|   +-- presets/                     +--------------------------+
|   |   +-- default.js              |  入口：组合模块 + features |
|   |   +-- full.js                 |  ~30 行，纯编排逻辑       |
|   |   +-- lite.js                 |  含固定出口 AI 方案       |
|   |   +-- ai.js
|   |                               +--------------------------+
|   |
|   +-- features/                    +--------------------------+
|   |   +-- default.js              |  编译开关：功能/地区/规则  |
|   |   +-- full.js                 |  构建时 DCE 的判定依据     |
|   |   +-- lite.js                 |  固定出口：stableEgress   |
|   |   +-- ai.js
|   |                               +--------------------------+
|   |
|   +-- modules/                     +--------------------------+
|       +-- platform.js             |  运行时平台检测            |
|       +-- proxy-cleaner.js        |  节点清洗 + 结构校验       |
|       +-- regions.js              |  16 地区正则识别           |
|       +-- proxy-groups.js         |  代理组构建（40+ 组）      |
|       +-- rules.js                |  分流规则（GEOSITE/GEOIP） |
|       +-- dns.js                  |  DNS 防泄露配置            |
|       +-- global-settings.js      |  全局设置 + 规则提供者     |
|       +-- network.js              |  TUN + Sniffer 配置       |
|                                   +--------------------------+
|
+-- dist/                            构建产物 (gitignored)
|   +-- ai.min.js
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

### 固定出口模式 (ai)

`ai` preset 用 `features.proxyGroups.stableEgress` 取代地区组与 AI 组，只生成三个 `select` 组：

| 组 | 内容 | 用途 |
|---|---|---|
| `🔒 Fixed Exit` | 全部原始节点，按 US -> SG -> JP -> HK -> 其余顺序排列 | `MATCH` 与全部 AI 规则；用户在此选定唯一出口节点 |
| `Ⓜ️ Microsoft Services` | `DIRECT` + 全部原始节点 | 默认直连，可手动切到节点 |
| `🍎 Apple Services` | `DIRECT` + 全部原始节点 | 默认直连，可手动切到节点 |

- 不生成 `♻️ Auto Select`、`🚀 Manual Select`、地区 `url-test` 组和 `🐟 Final`，因此不存在自动测速导致的出口 IP 跳变。
- 不生成 `🎯 Direct` 组：直连规则直接指向内置 `DIRECT` 出站，规则无法被切到节点。
- 没有真实节点时，`🔒 Fixed Exit` 退化为 `['DIRECT']`，配置仍然可用。
- `ipv6` 与 TUN 透明代理是固定出口的前提，`ai` preset 默认同时开启。

### 地区覆盖

| 核心 (Core) | 扩展 (Extended) | 特殊 (Special) |
|:-----------:|:---------------:|:--------------:|
| HK US JP | CA GB FR DE | Other |
| SG TW KR | NL TR RU | Home Low |

---

## 节点清洗

所有 preset 在地区分类之前无条件执行节点清洗，不需要额外选项：

- 名称命中信息节点关键字：`剩余流量`、`到期`、`官网`、`订阅`、`客服`、`群组`、`公告`、`邀请`、`推广`、`Telegram 群/客服`、`traffic`、`expire` 等。
- 缺少或非法 `name`、`type`、`server`、`port`：空值、`0.0.0.0`、`127.0.0.1`、`localhost`、保留示例域名、非 1-65535 端口等。
- 节点名重复：保留第一个，删除后续条目。

清洗会直接改写 `config.proxies`，随后重新生成所有代理组，因此信息节点不会再出现在客户端节点列表、地区组或服务组中。整个过程不发起网络请求。

`proxy-providers` 的节点由远端提供，脚本运行时无法读取其内容，因此清洗只对 `config.proxies` 生效。`default`、`full` 和 `ai` 会输出 `proxies-cleaned` 数量统计日志，不包含节点名。

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

- `Final` 组默认代理优先：未命中规则的域名会进入 `MATCH -> Final`，默认先走 `Auto Select` / `Manual Select` / 节点，`Direct` 仅保留为手动选项。`ai` preset 没有 `Final` 组，`MATCH` 直接指向 `🔒 Fixed Exit`，直连规则指向内置 `DIRECT`。
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
| 固定出口 (ai) | `GEOSITE(openai/google-gemini/category-ai-!cn/apple-intelligence)` 与 `DOMAIN-SUFFIX(openai.azure.com/cognitiveservices.azure.com)` | `Fixed Exit` |
| 兜底 | `GEOSITE(cn) / GEOIP(cn) / MATCH` | `Direct` / `Final`（ai: 内置 `DIRECT` / `Fixed Exit`） |

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
+-- ai.min.js           # 固定出口方案 (~31 KB / ~10 KB gzip)
+-- default.min.js      # 默认方案 (~30 KB / ~9.5 KB gzip)
+-- full.min.js         # 完整方案 (~31 KB / ~10 KB gzip)
+-- lite.min.js         # 轻量方案 (~28 KB / ~9 KB gzip)
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
| `ai` | yes | `info` |

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
  preset (default/full/lite/ai)
    |
    +-- features --- 编译开关（ai 额外含 stableEgress）
    |
    +-- platform --- 平台检测
    |
    +-- proxy-cleaner - config.proxies 清洗
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

