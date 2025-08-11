# Copyright (c) 2025 菘蓝. All rights reserved.

# 安全指南

## 🔒 敏感信息保护

### 不要提交的文件
- `data/config.json` - 包含真实API密钥
- `data/history.json` - 可能包含敏感的生成历史
- `.env` 文件 - 环境变量配置
- 任何包含API密钥、密码或认证信息的文件

### 安全配置步骤

1. **克隆仓库后**：
   ```bash
   git clone <repository-url>
   cd wan2.2MCP
   ```

2. **复制配置模板**：
   ```bash
   cp data/config.example.json data/config.json
   ```

3. **编辑配置文件**：
   ```bash
   # 编辑 data/config.json，填入真实的API密钥
   nano data/config.json
   ```

4. **验证 .gitignore**：
   确保 `data/config.json` 已被 `.gitignore` 忽略

## 🛡️ API密钥管理

### 获取API密钥
1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 创建API密钥
3. 确保开通"通义万相"服务
4. 记录密钥（仅显示一次）

### 密钥格式
- 格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 长度：35个字符
- 前缀：`sk-`

### 安全存储
- ✅ 存储在本地 `data/config.json`
- ✅ 使用环境变量 `DASHSCOPE_API_KEY`
- ✅ 使用 MCP `set-config` 工具
- ❌ 硬编码在源代码中
- ❌ 提交到版本控制系统
- ❌ 分享在聊天记录或文档中

## 🚨 泄露应急处理

如果API密钥意外泄露：

1. **立即撤销密钥**：
   - 登录阿里云控制台
   - 删除或禁用泄露的密钥

2. **生成新密钥**：
   - 创建新的API密钥
   - 更新本地配置

3. **检查使用记录**：
   - 查看API调用日志
   - 确认是否有异常使用

## 📋 部署检查清单

发布到公共仓库前，请确认：

- [ ] `data/config.json` 不包含真实API密钥
- [ ] `.gitignore` 文件已正确配置
- [ ] 所有敏感文件已被忽略
- [ ] README.md 包含安全配置说明
- [ ] 提供了 `config.example.json` 模板
- [ ] 代码中没有硬编码的密钥或密码

## 🔍 安全扫描

定期检查项目中的敏感信息：

```bash
# 搜索可能的API密钥
grep -r "sk-[a-zA-Z0-9]\{32\}" . --exclude-dir=node_modules

# 搜索其他敏感模式
grep -r -i "password\|secret\|token" . --exclude-dir=node_modules
```

## 📞 报告安全问题

如发现安全漏洞，请通过以下方式报告：
- 创建私有Issue
- 发送邮件至项目维护者
- 不要在公开渠道讨论安全问题

## 📚 相关资源

- [阿里云API密钥管理](https://help.aliyun.com/document_detail/116401.html)
- [Git安全最佳实践](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [环境变量安全指南](https://12factor.net/config)