# Wan2.2 MCP Server

通义万相文生图MCP服务器 - 基于阿里云百炼API的Model Context Protocol (MCP) 服务器实现。

## 功能特性

- 🎨 **文本生成图像**: 支持中英文提示词，生成高质量图像
- 🎭 **多种风格**: 支持摄影、插画、3D卡通、动漫、油画、水彩、素描等风格
- � **多种尺寸**: 支持方形、横向、纵向等多种图像尺寸
- ⚙️ **配置管理**: 灵活的API配置和默认参数设置
- � **历史记录**: 完整的生成历史记录和统计信息
- � **任务跟踪**: 实时任务状态查询和自动等待完成
- � **完善日志**: 详细的日志记录和错误处理
- �️ **错误处理**: 健壮的错误处理和恢复机制

## 系统要求

- Node.js 18.0.0 或更高版本
- TypeScript 5.0 或更高版本
- 阿里云DashScope API密钥

## 安装

1. 克隆项目
```bash
git clone <repository-url>
cd wan2.2MCP
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

## 配置

### 环境变量

创建 `.env` 文件（可选）：

```env
# 日志级别 (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=INFO

# 运行环境
NODE_ENV=production
```

### API配置

首次运行时，需要使用 `set-config` 工具配置阿里云API密钥：

```json
{
  "api_key": "your-dashscope-api-key",
  "region": "cn-beijing",
  "default_size": "1024*1024",
  "default_style": "photography",
  "default_quality": "standard"
}
```

## 使用方法

### 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### MCP工具

#### 1. generate-image - 生成图像

```json
{
  "prompt": "一只可爱的小猫咪坐在花园里",
  "size": "1024*1024",
  "style": "photography",
  "quality": "standard",
  "n": 1
}
```

**参数说明：**
- `prompt` (必需): 图像描述文本，支持中英文
- `size` (可选): 图像尺寸，支持的值：
  - `1024*1024` (方形)
  - `720*1280` (纵向)
  - `1280*720` (横向)
- `style` (可选): 图像风格，支持的值：
  - `photography` (摄影)
  - `portrait` (肖像)
  - `3d cartoon` (3D卡通)
  - `anime` (动漫)
  - `oil painting` (油画)
  - `watercolor` (水彩)
  - `sketch` (素描)
  - `chinese painting` (中国画)
  - `flat illustration` (扁平插画)
- `quality` (可选): 图像质量
  - `standard` (标准)
  - `hd` (高清)
- `n` (可选): 生成图像数量 (1-4)

#### 2. set-config - 设置配置

```json
{
  "api_key": "your-api-key",
  "region": "cn-beijing",
  "default_size": "1024*1024",
  "default_style": "photography"
}
```

#### 3. get-config - 获取配置

```json
{}
```

#### 4. list-history - 获取历史记录

```json
{
  "limit": 10,
  "offset": 0,
  "date_from": "2024-01-01T00:00:00.000Z",
  "date_to": "2024-12-31T23:59:59.999Z"
}
```

## 项目结构

```
wan2.2MCP/
├── src/
│   ├── services/           # 服务层
│   │   ├── ConfigService.ts    # 配置管理
│   │   ├── HistoryService.ts   # 历史记录管理
│   │   └── DashScopeClient.ts  # 阿里云API客户端
│   ├── types/              # 类型定义
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── logger.ts           # 日志记录
│   │   └── errorHandler.ts     # 错误处理
│   └── index.ts            # 主程序入口
├── data/                   # 数据存储目录
│   ├── config.json         # 配置文件
│   └── history.json        # 历史记录文件
├── dist/                   # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

### 脚本命令

```bash
# 开发模式（监听文件变化）
npm run dev

# 构建项目
npm run build

# 启动生产版本
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 调试

设置环境变量启用调试日志：

```bash
LOG_LEVEL=DEBUG npm run dev
```

## API参考

### 阿里云DashScope API

本项目使用阿里云DashScope的通义万相API。需要：

1. 注册阿里云账号
2. 开通DashScope服务
3. 获取API密钥
4. 确保账户有足够的调用额度

### 支持的模型

- **wanx-v1**: 通义万相文生图模型

## 错误处理

服务器包含完善的错误处理机制：

- **验证错误**: 参数格式或值不正确
- **配置错误**: API密钥未设置或无效
- **网络错误**: 网络连接问题
- **API错误**: 阿里云API返回错误
- **超时错误**: 任务执行超时
- **文件错误**: 配置或历史文件读写错误

所有错误都会记录详细日志，便于调试和监控。

## 日志

### 日志级别

- `DEBUG`: 详细的调试信息
- `INFO`: 一般信息
- `WARN`: 警告信息
- `ERROR`: 错误信息

### 日志格式

```
2024-01-20T10:30:45.123Z INFO [ConfigService] Configuration loaded successfully
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 支持

如果遇到问题，请：

1. 检查日志输出
2. 确认API密钥配置正确
3. 验证网络连接
4. 查看阿里云DashScope服务状态

## 更新日志

### v1.0.0

- 初始版本发布
- 支持通义万相文生图API
- 完整的MCP协议实现
- 配置管理和历史记录功能
- 完善的错误处理和日志记录