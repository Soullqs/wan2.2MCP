# wan2.2 MCP 图像生成服务器
本项目全部由AIIDE编写
🎨 基于阿里云通义万相的 MCP (Model Context Protocol) 图像生成服务器，支持在 CherryStudio、VSCode、Cursor 等工具中直接使用文本生成图像功能。

## 🚀 快速开始（小白必看）

### 第一步：下载和安装

1. **下载项目**
   ```bash
   git clone <github项目地址>
   cd wan2.2MCP
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

### 第二步：获取 API 密钥

1. 访问 [阿里云DashScope控制台](https://bailian.console.aliyun.com)
2. 注册/登录阿里云账号
3. 开通「通义万相」服务
4. 创建 API 密钥（格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
5. 确保账户有足够余额（有赠送wan2.2-t2i-plus wan2.2-t2i-flash两种模型各100次）

### 第三步：配置 API 密钥

1. **复制配置模板**
   ```bash
   cp data/config.example.json data/config.json
   ```

2. **编辑配置文件**
   打开 `data/config.json`，填入你的 API 密钥：
   ```json
   {
     "api_key": "sk-你的真实API密钥",
     "region": "cn-beijing",
     "default_size": "1024*1024",
     "default_style": "photography",
     "default_quality": "standard"
   }
   ```

3. **或使用 `set-config` 工具**：
   通过MCP工具动态配置API密钥，无需手动编辑文件。直接和模型说我要将APIkey设置为sk-XXX，模型会自动将sk-XXX写入配置文件。



## 使用方法

### 启动服务器

```bash
npm start
```

看到以下输出表示启动成功：
```
[INFO] MCP Server started successfully
[INFO] Listening on stdio
```

## 🔌 接入各种工具

### CherryStudio 接入

1. 打开 CherryStudio
2. 进入设置 → MCP 服务器
3. 添加新的服务器配置：

```json
{
  "mcpServers": {
    "wan2.2-image-generator": {
      "command": "node",
      "args": [
        "C:\\Users\\用户名\\wan2.2MCP\\dist\\index.js"
      ],
      "cwd": "C:\\Users\\用户名\\wan2.2MCP"
    }
  }
}
```

**⚠️ 重要提醒**：请将路径替换为你的实际项目路径！

### VSCode 接入

1. 安装 MCP 扩展
2. 在 VSCode 设置中添加：

```json
{
  "mcp.servers": {
    "wan2.2-image-generator": {
      "command": "node",
      "args": [
        "C:\\Users\\用户名\\wan2.2MCP\\dist\\index.js"
      ],
      "cwd": "C:\\Users\\用户名\\wan2.2MCP"
    }
  }
}
```

### Cursor 接入

1. 打开 Cursor 设置
2. 找到 MCP 配置选项
3. 添加服务器：

```json
{
  "mcpServers": {
    "wan2.2-image-generator": {
      "command": "node",
      "args": [
        "C:\\Users\\用户名\\wan2.2MCP\\dist\\index.js"
      ],
      "cwd": "C:\\Users\\用户名\\wan2.2MCP"
    }
  }
}
```

### 通用配置模板

如果你使用其他支持 MCP 的工具，可以使用这个通用配置：

```json
{
  "mcpServers": {
    "wan2.2-image-generator": {
      "command": "node",
      "args": [
        "/path/to/wan2.2MCP/dist/index.js"
      ],
      "cwd": "/path/to/wan2.2MCP"
    }
  }
}
```

## 🎯 使用方法

配置完成后，你就可以在对话中使用以下功能：

### 生成图像

直接在对话中说：
- "帮我生成一张可爱小猫的图片"
- "画一个科幻风格的机器人"
- "生成一张1280x720的风景照片"
- "用水彩风格画一朵玫瑰花"

### 可用的图像风格

- 📸 **photography** - 摄影风格
- 🎭 **portrait** - 肖像风格  
- 🎮 **3d cartoon** - 3D卡通
- 🌸 **anime** - 动漫风格
- 🎨 **oil painting** - 油画
- 🌊 **watercolor** - 水彩
- ✏️ **sketch** - 素描
- 🖼️ **chinese painting** - 中国画
- 📱 **flat illustration** - 扁平插画

### 支持的图像尺寸

- **1024×1024** - 方形图片
- **720×1280** - 竖屏图片
- **1280×720** - 横屏图片

## 🛠️ 高级配置

### 修改默认设置

编辑 `data/config.json` 文件：

```json
{
  "api_key": "你的API密钥",
  "region": "cn-beijing",
  "default_size": "1024*1024",     // 默认图片尺寸
  "default_style": "photography",  // 默认图片风格
  "default_quality": "standard"    // 默认图片质量 (standard/hd)
}
```

### 查看生成历史

所有生成的图片记录都保存在 `data/history.json` 文件中，包含：
- 生成时间
- 提示词
- 图片参数
- 图片URL

## 🔧 故障排除

### 常见问题

**Q: 提示 "API key not configured"**

A: 检查 `data/config.json` 文件是否存在且包含正确的 API 密钥

**Q: 提示 "Request failed"**

A: 检查网络连接和 API 密钥是否有效，确认阿里云账户余额充足

**Q: 工具中找不到图像生成功能**

A: 确认 MCP 服务器已正确启动，检查配置路径是否正确

**Q: 生成的图片无法显示**

A: 图片URL有时效性，建议及时保存到本地

**Q: 路径配置错误**

A: 确保使用绝对路径，Windows 系统注意使用双反斜杠 `\\`

### 调试模式

如果遇到问题，可以开启调试模式查看详细日志：

```bash
LOG_LEVEL=DEBUG npm start
```

### 测试连接

运行测试脚本验证配置：

```bash
node test_mcp_functions.cjs
```

## 📋 功能特性

- 🎨 **文本生成图像**: 支持中英文提示词，生成高质量图像
- 🎭 **多种风格**: 支持摄影、插画、3D卡通、动漫、油画、水彩、素描等风格
- 📐 **多种尺寸**: 支持方形、横向、纵向等多种图像尺寸
- ⚙️ **配置管理**: 灵活的API配置和默认参数设置
- 📚 **历史记录**: 完整的生成历史记录和统计信息
- 📊 **任务跟踪**: 实时任务状态查询和自动等待完成
- 📝 **完善日志**: 详细的日志记录和错误处理
- 🛡️ **错误处理**: 健壮的错误处理和恢复机制

## 🔒 安全说明

- ⚠️ **请勿将 API 密钥提交到公共仓库**
- 🔐 **定期更换 API 密钥**
- 💰 **监控 API 使用量和费用**
- 🚫 **不要在公共场所展示包含密钥的配置文件**

## 📞 技术支持

如果遇到问题：

1. 📖 查看本文档的故障排除部分
2. 🔍 检查项目的 `SECURITY.md` 文件
3. 🧪 运行测试脚本验证配置
4. 📝 查看详细的错误日志

## 🎓 使用示例

### 基本使用

```
用户: 帮我生成一张可爱的小猫图片
AI: 我来为您生成一张可爱的小猫图片...
[生成的图片URL]
```

### 指定风格和尺寸

```
用户: 用动漫风格生成一张1280x720的机器人图片
AI: 我来为您生成一张动漫风格的机器人图片...
[生成的图片URL]
```

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

🎉 **恭喜！现在你可以在各种工具中愉快地使用 AI 图像生成功能了！**

如果你觉得这个项目有用，请给个 ⭐ Star 支持一下！