const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const esbuild = require('esbuild');
const { minify } = require('terser');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function featurePathPattern(featurePath) {
  return featurePath
    .split('.')
    .map(part => escapeRegExp(part))
    .join('\\s*\\??\\.\\s*');
}

/**
 * Collect literal replacements for the selected preset's features.
 * Parents are only emitted where the code reads the whole object
 * (logging and regions); boolean leaves are emitted individually so
 * Terser can fold `if (false)` and drop the unused branch.
 */
function collectFeatureReplacements(features) {
  const replacements = [];

  function walk(value, featurePath) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (featurePath === 'features.logging' || featurePath === 'features.regions') {
        replacements.push([featurePath, JSON.stringify(value)]);
      }
      for (const key of Object.keys(value)) {
        walk(value[key], featurePath + '.' + key);
      }
      return;
    }

    replacements.push([featurePath, JSON.stringify(value)]);
  }

  walk(features, 'features');

  // These switches only exist in the ai preset. Treat an absent switch as false
  // so the stable-egress branch is folded out of the other three builds.
  for (const optionalPath of ['features.rules.stableEgress', 'features.proxyGroups.stableEgress']) {
    const value = optionalPath
      .split('.')
      .slice(1)
      .reduce((current, key) => (current ? current[key] : undefined), features);

    if (value === undefined) {
      replacements.push([optionalPath, 'false']);
    }
  }

  replacements.sort((a, b) => b[0].length - a[0].length);

  return replacements.map(([featurePath, literal]) => [
    new RegExp(featurePathPattern(featurePath) + '(?![\\w$])', 'g'),
    literal,
  ]);
}

/**
 * Replace feature object reads with preset literals before bundling.
 * The source keeps using a features object so tests can toggle flags;
 * the release build gets scalar conditions that Terser can eliminate.
 */
function createFeaturePlugin(features, srcRoot) {
  const replacements = collectFeatureReplacements(features);

  return {
    name: 'preset-feature-constants',
    setup(build) {
      build.onLoad({ filter: /\.js$/ }, async args => {
        const relativePath = path.relative(srcRoot, args.path);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          return null;
        }

        let contents = await fs.promises.readFile(args.path, 'utf8');
        for (const [pattern, literal] of replacements) {
          contents = contents.replace(pattern, () => literal);
        }

        return { contents, loader: 'js' };
      });
    },
  };
}

async function build() {
  const srcDir = './src/presets';
  const distDir = './dist';
  const srcRoot = path.resolve('src');

  if (!fs.existsSync(srcDir)) {
    console.error(`错误: 源代码目录 ${srcDir} 不存在。`);
    return;
  }

  fs.mkdirSync(distDir, { recursive: true });

  const items = fs.readdirSync(srcDir, { withFileTypes: true });
  const jsFiles = items.filter(item => item.isFile() && item.name.endsWith('.js')).map(item => item.name);

  if (jsFiles.length === 0) {
    console.log(`在 ${srcDir} 目录中没有找到入口 .js 文件。`);
    return;
  }

  const options = {
    compress: {
      passes: 3,
      toplevel: true,
      top_retain: ['main'],
      drop_console: false,
      dead_code: true,
      evaluate: true,
      unsafe: false,
      pure_getters: true,
    },
    mangle: {
      toplevel: true,
      reserved: ['main'],
    },
    format: {
      comments: false,
      ascii_only: true
    }
  };

  for (const file of jsFiles) {
    const filePath = path.join(srcDir, file);
    const baseName = path.basename(file, '.js');
    const minifiedFileName = `${baseName}.min.js`;

    try {
      const featuresPath = path.join(srcDir, '..', 'features', `${baseName}.js`);
      const { features } = await import(pathToFileURL(path.resolve(featuresPath)).href);

      // 1. 使用 esbuild 将依赖打包（类似于 C 语言的 include 和链接）
      const bundleResult = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        format: 'esm', // 输出 ES Module 格式
        target: 'es2020',
        write: false,
        plugins: [createFeaturePlugin(features, srcRoot)],
      });

      // 提取打包后的原代码
      let code = bundleResult.outputFiles[0].text;
      
      // 注意：由于 Clash 不支持 ES 规范的 export 关键字，我们需要把 esbuild 输出的尾部 export 清理掉
      // 只要你在顶层保留了 function main，它依然能在全局作用域被 Clash 调用
      code = code.replace(/export\s*\{[^}]*\};?/g, '');

      // 2. 将打包后的巨大代码输入给 Terser 压缩
      const result = await minify(code, options);

      if (result.error) {
        console.error(`压缩文件 ${file} 失败:`, result.error);
        continue;
      }

      fs.writeFileSync(path.join(distDir, minifiedFileName), result.code);
      console.log(`编译打包成功：${file} -> ${path.join(distDir, minifiedFileName)}`);
    } catch (err) {
      console.error(`处理文件 ${file} 时发生异常:`, err);
    }
  }
}

build();
