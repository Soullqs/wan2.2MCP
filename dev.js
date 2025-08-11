#!/usr/bin/env node

/**
 * Wan2.2 MCP Server 开发启动脚本
 * 用于开发模式下启动服务器，支持热重载
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // 检查tsx是否安装
  try {
    await import.meta.resolve('tsx');
  } catch (error) {
    console.error('❌ tsx 未安装，请运行: npm install');
    process.exit(1);
  }

  // 检查源文件是否存在
  const srcPath = path.join(__dirname, 'src');
  const mainFile = path.join(srcPath, 'index.ts');

  if (!fs.existsSync(mainFile)) {
    console.error('❌ 源文件不存在:', mainFile);
    process.exit(1);
  }

  // 设置开发环境变量
  process.env.NODE_ENV = 'development';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'DEBUG';

  // 启动开发服务器
  console.log('🔧 启动 Wan2.2 MCP Server (开发模式)...');
  console.log(`📁 工作目录: ${__dirname}`);
  console.log(`🌍 运行环境: ${process.env.NODE_ENV}`);
  console.log(`📝 日志级别: ${process.env.LOG_LEVEL}`);
  console.log(`🔄 热重载: 启用`);
  console.log('---');

  const server = spawn('npx', ['tsx', 'watch', mainFile], {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
    shell: true
  });

  server.on('error', (error) => {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  });

  server.on('exit', (code, signal) => {
    if (signal) {
      console.log(`\n📡 开发服务器收到信号 ${signal} 并退出`);
    } else {
      console.log(`\n🔚 开发服务器退出，退出码: ${code}`);
    }
    process.exit(code || 0);
  });

  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('\n⏹️  收到中断信号，正在关闭开发服务器...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n⏹️  收到终止信号，正在关闭开发服务器...');
    server.kill('SIGTERM');
  });

  // 开发模式提示
  console.log('\n💡 开发模式提示:');
  console.log('   - 文件变化时会自动重启服务器');
  console.log('   - 使用 Ctrl+C 停止服务器');
  console.log('   - 日志级别已设置为 DEBUG');
  console.log('');
}

// 启动主函数
main().catch((error) => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});