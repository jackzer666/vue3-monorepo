import minimist from "minimist";
import {resolve, dirname} from "path";
import {fileURLToPath} from "url";
import {createRequire} from "module";
import esbuild from "esbuild";

/**
 * esm的部分兼容性处理
 */
// import.meta.url是个file:开头的路径，通过fileURLToPath转换为绝对路径
const __filename = fileURLToPath(import.meta.url);
// dirname是获取文件所在目录的函数
const __dirname = dirname(__filename);
// createRequire用于在ESM模块中加载CommonJS模块
const require = createRequire(import.meta.url);



// 使用 minimist 来解析命令行参数
const args = minimist(process.argv.slice(2))
// 获取打包的项目
const target = args._[0] || "default";
// 获取打包的模块化规范
const format = args.f || "esm";

// node中的esm模块化没有默认的__dirname，需要自行处理
// 根据打包命令行中的参数，构建入口文件路径
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
// 获取打包的package.json文件内容
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// 需要进行打包
esbuild.context({
  entryPoints: [entry], // 入口
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
  bundle: true, // 打包所有依赖到一起
  platform: "browser", // 打包后可以在浏览器中运行
  sourcemap: true, // 生成sourcemap文件，可以调试源码
  format, // 模块化规范，cjs esm iife；如果是iife，则会生成一个立即执行的函数，且需要指定全局变量名
  globalName: pkg.buildOptions?.name, // 如果是iife格式，需要指定全局变量名
}).then((ctx) => {
  console.log(`开始打包dev ${target}...`);
  return ctx.watch(); // 开始监听文件变化，自动重新打包
})