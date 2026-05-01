# Clash Script Adapter

<img src="https://img.shields.io/badge/mihomo-Meta%20CubeX-0A0A0A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVIN0wxMiAyeiIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==" alt="mihomo"><img src="https://img.shields.io/badge/Clash%20Verge%20Rev-Supported-6366f1?style=for-the-badge&logo=ghost&logoColor=white" alt="Clash Verge Rev">img src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"><img src="https://img.shields.io/badge/Build-esbuild%20%2B%20Terser-FFCF00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIgMTJoMjBNMTIgMnYyME0yIDEyaDIwTDEyIDJsMTAgMTAtMTAgMTB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkNGMDAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" alt="Build">

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
| 规则集 | 全量 + 进程名 |
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
|                    代理组类型选择                              |
+-------------------+-----------------------------------------+
|   url-test        |  地区组、自动选择（自动测速选最低延迟）    |
|   fallback        |  AI 服务组（按顺序尝试，被封时自动切换）  |
|   load-balance    |  流媒体组（consistent-hashing 分散压力） |
|   select          |  手动选择、直连、特殊服务                 |
+-------------------+-----------------------------------------+
```

### 地区覆盖

| 核心 (Core) | 扩展 (Extended) | 特殊 (Special) |
|:-----------:|:---------------:|:--------------:|
| HK US JP | CA GB FR DE | Other |
| SG TW KR | NL TR RU | Home Low |

---

## DNS 防泄露

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
       |  国内域名     |         |  境外域名     |
       |  nameserver   |         |  fallback     |
       |  223.5.5.5    |         |  dns.google   |
       |  119.29.29.29 |         |  cloudflare   |
       +--------------+         +--------------+
```

- ARC 缓存算法（自适应替换，优于 LRU）
- `fallback-filter` 污染防护（geoip-code: CN）
- `respect-rules` 确保 DNS 连接遵守路由规则

---

## 规则集

| 类别 | 规则类型 | 策略组 |
|------|---------|--------|
| 基础 | `GEOSITE(private)` / `GEOIP(private)` / `RULE-SET(Custom_*)` | 直连 |
| 流媒体 | `GEOSITE(youtube/netflix/disney/hbo/spotify/...)` | `load-balance` |
| AI 服务 | `GEOSITE(openai/category-ai-!cn)` | `fallback` |
| 社交通讯 | `GEOSITE(category-communication/social-media/github/...)` | `select` |
| 游戏 | `GEOSITE(steam/category-games)` | `select` |
| 特殊服务 | `GEOSITE(talkatone/onedrive/bing/paypal/...)` | `select` |
| 进程名 | `PROCESS-NAME(chrome/firefox/safari/...)` | `select` |
| 兜底 | `GEOSITE(cn) / GEOIP(cn) / MATCH` | 直连 / 漏网之鱼 |

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

