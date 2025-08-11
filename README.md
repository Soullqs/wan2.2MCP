# 通义万相 MCP 服务器
声明：本人变成小白，除此行外均为AI生成，仅用于学习和研究，不用于商业用途。
## 项目介绍
一个基于阿里云百炼API的文本到图像生成MCP（Model Context Protocol）服务器，支持多种AI模型进行图像生成。

## 功能特性

- 🎨 **多模型支持**：支持wan2.2-t2i-flash、wan2.2-t2i-plus等多种通义万相模型
- ⚡ **快速生成**：基于阿里云百炼API，提供高效的图像生成服务
- 🔧 **灵活配置**：支持自定义图像尺寸、风格、质量等参数
- 📝 **历史记录**：自动保存生成历史，支持查询和管理
- 🛠️ **MCP标准**：完全兼容Model Context Protocol标准
- 🌐 **多区域支持**：支持阿里云不同区域的API端点

## 支持的模型

- `wan2.2-t2i-flash` - 快速生成模型（默认）
- `wan2.2-t2i-plus` - 高质量生成模型
- `wanx2.1-t2i-turbo` - 快速生成模型
- `wanx2.1-t2i-plus` - 高质量生成模型
- `wanx2.0-t2i-turbo` - 快速生成模型
- `wanx-v1` - 基础模型

## 安装要求

- Node.js >= 18.0.0
- npm 或 yarn
- 阿里云百炼API密钥

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd wan2.2MCP
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 配置API密钥

首次运行时，系统会自动创建配置文件。你需要设置阿里云百炼API密钥：

```bash
# 启动服务器
npm start
```

然后使用MCP客户端调用 `set-config` 工具设置API密钥：

```json
{
  "api_key": "your-dashscope-api-key",
  "region": "cn-beijing",
  "default_model": "wan2.2-t2i-flash"
}
```

### 5. 获取阿里云百炼API密钥

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 登录你的阿里云账号
3. 在API-KEY管理页面创建新的API密钥
4. 复制生成的API密钥用于配置

## MCP工具说明

### generate-image
生成图像的主要工具

**参数：**
- `prompt` (必需): 图像描述文本
- `model` (可选): 使用的模型，默认为配置中的默认模型
- `size` (可选): 图像尺寸，默认为配置中的默认尺寸
- `style` (可选): 图像风格，默认为配置中的默认风格
- `quality` (可选): 图像质量，默认为配置中的默认质量
- `n` (可选): 生成图像数量，默认为1

**示例：**
```json
{
  "prompt": "一只可爱的橘猫在阳光下睡觉",
  "model": "wan2.2-t2i-flash",
  "size": "1024*1024",
  "style": "photography",
  "quality": "standard",
  "n": 1
}
```

### set-config
设置服务器配置

**参数：**
- `api_key` (可选): 阿里云百炼API密钥
- `region` (可选): API区域
- `default_size` (可选): 默认图像尺寸
- `default_style` (可选): 默认图像风格
- `default_quality` (可选): 默认图像质量
- `default_model` (可选): 默认使用的模型

### get-config
获取当前配置信息

### list-history
查看图像生成历史记录

**参数：**
- `limit` (可选): 返回记录数量限制
- `offset` (可选): 记录偏移量
- `date_from` (可选): 开始日期过滤
- `date_to` (可选): 结束日期过滤

### test-model
测试模型连接状态

### diagnose-api
诊断API连接问题

## 配置选项

### 支持的图像尺寸
- `1024*1024` (默认)
- `720*1280`
- `1280*720`
- `1024*576`
- `576*1024`

### 支持的图像风格
- `photography` (摄影风格，默认)
- `portrait` (肖像风格)
- `3d cartoon` (3D卡通风格)
- `anime` (动漫风格)
- `oil painting` (油画风格)
- `watercolor` (水彩风格)
- `sketch` (素描风格)
- `chinese painting` (中国画风格)
- `flat illustration` (扁平插画风格)

### 支持的图像质量
- `standard` (标准质量，默认)
- `hd` (高清质量)

### 支持的区域
- `cn-beijing` (北京，默认)
- `cn-shanghai` (上海)
- `cn-shenzhen` (深圳)
- `cn-hangzhou` (杭州)
- `cn-wulanchabu` (乌兰察布)
- `ap-southeast-1` (新加坡)
- `us-east-1` (美国东部)

## 在MCP客户端中使用

### Claude Desktop配置

在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "wan2.2-mcp": {
      "command": "node",
      "args": ["/path/to/wan2.2MCP/dist/index.js"],
      "env": {}
    }
  }
}
```

### 其他MCP客户端

确保你的MCP客户端支持stdio传输方式，然后配置服务器路径为构建后的 `dist/index.js` 文件。

## 开发

### 开发模式运行

```bash
npm run dev
```

### 代码检查

```bash
npm run lint
```

### 清理构建文件

```bash
npm run clean
```

## 项目结构

```
wan2.2MCP/
├── src/                    # 源代码目录
│   ├── index.ts           # 主服务器文件
│   ├── services/          # 服务层
│   │   ├── ConfigService.ts
│   │   └── HistoryService.ts
│   └── types/             # 类型定义
│       └── index.ts
├── data/                  # 数据文件目录
│   ├── config.json        # 配置文件
│   └── history.json       # 历史记录文件
├── dist/                  # 构建输出目录
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目说明
```

## 故障排除

### 常见问题

1. **API密钥错误**
   - 确保API密钥正确且有效
   - 检查API密钥是否有足够的权限
   - 确认账户余额充足

2. **网络连接问题**
   - 检查网络连接
   - 确认防火墙设置
   - 尝试不同的区域设置

3. **模型不可用**
   - 确认所选模型在当前区域可用
   - 检查模型名称是否正确
   - 尝试使用默认模型

### 调试模式

使用 `diagnose-api` 工具可以帮助诊断API连接问题：

```json
{
  "tool": "diagnose-api"
}
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持多种通义万相模型
- 完整的MCP协议支持
- 配置管理和历史记录功能