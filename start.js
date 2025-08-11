#!/usr/bin/env node

/**
 * Wan2.2 MCP Server 启动脚本
 * 用于启动通义万相文生图MCP服务器
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查是否已构建
const distPath = path.join(__dirname, 'dist');
const mainFile = path.join(distPath, 'index.js');

if (!fs.existsSync(mainFile)) {
  console.error('❌ 项目尚未构建，请先运行: npm run build');
  process.exit(1);
}

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 启动服务器
console.log('🚀 启动 Wan2.2 MCP Server...');
console.log(`📁 工作目录: ${__dirname}`);
console.log(`🌍 运行环境: ${process.env.NODE_ENV}`);
console.log(`📝 日志级别: ${process.env.LOG_LEVEL || 'INFO'}`);
console.log('---');

const server = spawn('node', [mainFile], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n📡 服务器收到信号 ${signal} 并退出`);
  } else {
    console.log(`\n🔚 服务器退出，退出码: ${code}`);
  }
  process.exit(code || 0);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\n⏹️  收到中断信号，正在关闭服务器...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  收到终止信号，正在关闭服务器...');
  server.kill('SIGTERM');
});