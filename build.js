const fs = require('fs');
const { minify } = require('terser');

async function build() {
  const code = fs.readFileSync('./src/clash_verge_rev.js', 'utf8');

  const options = {
    // 压缩选项
    compress: {
      passes: 3,              // 多次遍历，能更大程度进行深度优化和极致压缩
      toplevel: true,         // 开启顶级作用域压缩，允许内联内部辅助函数 (如 buildGlobalSettings 等)
      top_retain: ['main'],
      drop_console: true,     // 安全移除所有 console.* 语句
      dead_code: true,        // 移除不可达的死代码
      evaluate: true,         // 在编译期计算常量表达式，减少运行时的计算成本
      unsafe: false,          // 保持安全性：关闭不安全的语言级转换，防止正则或原型链意外破坏
      pure_getters: true,     // 脚本中都是标准对象获取，开启可优化属性访问
    },
    // 混淆选项
    mangle: {
      toplevel: true,         // 混淆顶级变量和函数名，极大减少体积
      reserved: ['main'],     // 【绝密安全底线】必须保留 main 函数名，否则 Clash 将无法调用处理配置！
    },
    // 输出格式
    format: {
      comments: false,        // 彻底移除大段落的 JSDoc 和块级说明注释
      ascii_only: true        // 确保输出纯 ASCII，防止正则表达式中的 Unicode 字符（如国旗emoji 🇭🇰）在部分旧引擎中产生乱码
    }
  };

  const result = await minify(code, options);

  if (result.error) {
    console.error('压缩失败:', result.error);
    return;
  }

  // 输出压缩后的文件
  fs.writeFileSync('./clash_verge_rev.min.js', result.code);
  console.log('压缩成功：clash_verge_rev.min.js');
}

build();
