#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigService } from './services/ConfigService.js';
import { HistoryService } from './services/HistoryService.js';
import { DashScopeClient } from './services/DashScopeClient.js';
import { ApiDiagnostic } from './utils/apiDiagnostic.js';
import type {
  GenerateImageParams,
  SetConfigParams,
  ListHistoryParams
} from './types/index.js';
import {
  SUPPORTED_SIZES,
  SUPPORTED_STYLES,
  SUPPORTED_QUALITIES
} from './types/index.js';
import { logger, LogLevel } from './utils/logger.js';

/**
 * 通义万相文生图MCP服务器
 * 提供文本到图像生成服务的MCP协议实现
 */
class Wan2MCPServer {
  private server: Server;
  private configService: ConfigService;
  private historyService: HistoryService;
  private dashScopeClient: DashScopeClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'wan2-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.configService = new ConfigService();
    this.historyService = new HistoryService();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate-image',
            description: '使用通义万相API生成图像',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: '图像描述文本，支持中英文',
                },
                model: {
                  type: 'string',
                  description: '图像生成模型',
                  enum: ['wanx-v1', 'wan2.2-t2i-flash', 'wan2.2-t2i-plus', 'wanx2.1-t2i-turbo', 'wanx2.0-t2i-turbo', 'wanx2.1-t2i-plus'],
                  default: 'wan2.2-t2i-flash',
                },
                size: {
                  type: 'string',
                  description: '图像尺寸',
                  enum: [...SUPPORTED_SIZES],
                  default: '1024*1024',
                },
                style: {
                  type: 'string',
                  description: '图像风格',
                  enum: [...SUPPORTED_STYLES],
                  default: 'photography',
                },
                quality: {
                  type: 'string',
                  description: '图像质量',
                  enum: [...SUPPORTED_QUALITIES],
                  default: 'standard',
                },
                n: {
                  type: 'number',
                  description: '生成图像数量',
                  minimum: 1,
                  maximum: 4,
                  default: 1,
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'set-config',
            description: '设置API配置',
            inputSchema: {
              type: 'object',
              properties: {
                api_key: {
                  type: 'string',
                  description: '阿里云DashScope API密钥',
                },
                region: {
                  type: 'string',
                  description: '服务区域',
                  enum: ['cn-beijing', 'cn-shanghai', 'cn-hangzhou', 'cn-shenzhen'],
                  default: 'cn-beijing',
                },
                default_size: {
                  type: 'string',
                  description: '默认图像尺寸',
                  enum: [...SUPPORTED_SIZES],
                },
                default_style: {
                  type: 'string',
                  description: '默认图像风格',
                  enum: [...SUPPORTED_STYLES],
                },
              },
              required: ['api_key'],
            },
          },
          {
            name: 'get-config',
            description: '获取当前配置',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list-history',
            description: '获取生成历史记录',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: '返回记录数量',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
                offset: {
                  type: 'number',
                  description: '偏移量',
                  minimum: 0,
                  default: 0,
                },
                date_from: {
                  type: 'string',
                  description: '开始日期 (ISO 8601格式)',
                },
                date_to: {
                  type: 'string',
                  description: '结束日期 (ISO 8601格式)',
                },
              },
            },
          },
          {
            name: 'test-model',
            description: '测试特定模型的可用性',
            inputSchema: {
              type: 'object',
              properties: {
                model: {
                  type: 'string',
                  description: '要测试的模型名称',
                  enum: ['wanx-v1', 'wan2.2-t2i-flash', 'wan2.2-t2i-plus', 'wanx2.1-t2i-turbo', 'wanx2.0-t2i-turbo', 'wanx2.1-t2i-plus'],
                },
              },
              required: ['model'],
            },
          },
          {
            name: 'diagnose-api',
            description: '诊断API连接和配置问题',
            inputSchema: {
              type: 'object',
              properties: {
                check_network: {
                  type: 'boolean',
                  description: '是否检查网络连接',
                  default: true,
                },
                check_auth: {
                  type: 'boolean',
                  description: '是否检查API认证',
                  default: true,
                },
                check_quota: {
                  type: 'boolean',
                  description: '是否检查配额限制',
                  default: true,
                },
              },
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info('Executing tool', 'MCPServer', { toolName: name });
        
        switch (name) {
          case 'generate-image':
            return await this.handleGenerateImage(args as any);
          
          case 'set-config':
            return await this.handleSetConfig(args as any);
          
          case 'get-config':
            return await this.handleGetConfig();
          
          case 'list-history':
            return await this.handleListHistory(args as any);
          
          case 'test-model':
            return await this.handleTestModel(args as any);
          
          case 'diagnose-api':
            return await this.handleDiagnoseApi(args as any);
          
          default:
            logger.warn('Unknown tool requested', 'MCPServer', { toolName: name });
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error('Tool execution failed', 'MCPServer', { 
          toolName: name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  }

  /**
   * 处理图像生成请求
   */
  private async handleGenerateImage(params: GenerateImageParams) {
    // 检查配置
    if (!this.configService.isConfigValid()) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'API key not configured. Please use set-config tool first.'
      );
    }

    // 初始化DashScope客户端
    if (!this.dashScopeClient) {
      const config = this.configService.getConfig();
      this.dashScopeClient = new DashScopeClient(config.api_key, config.region);
    }

    // 使用默认值填充参数
    const config = this.configService.getConfig();
    const fullParams: GenerateImageParams = {
      prompt: params.prompt,
      model: params.model || 'wan2.2-t2i-flash',
      size: params.size || config.default_size,
      style: params.style || config.default_style,
      quality: params.quality || config.default_quality,
      n: params.n || 1,
    };

    let response: any = null;
    let historyRecord: any = null;
    
    try {
      // 调用DashScope API
      const dashScopeParams = {
        model: fullParams.model! as 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus',
        input: {
          prompt: fullParams.prompt
        },
        parameters: {
          size: fullParams.size!,
          quality: fullParams.quality!,
          n: fullParams.n!
        }
      };
      response = await this.dashScopeClient.generateImage(dashScopeParams);
      
      // 创建历史记录
      historyRecord = await this.historyService.createRecord(
        fullParams.prompt,
        fullParams.size!,
        fullParams.style!,
        fullParams.quality!,
        fullParams.n!,
        response.output.task_id
      );

      // 等待任务完成
      const completedResponse = await this.dashScopeClient.waitForCompletion(
        response.output.task_id
      );

      // 提取图像URL
      const imageUrls = completedResponse.output.results?.map(r => r.url) || [];
      
      // 更新历史记录
      await this.historyService.updateRecord(historyRecord.id, {
        status: 'completed',
        image_urls: imageUrls,
      });



      return {
        content: [
          {
            type: 'text',
            text: `Successfully generated ${imageUrls.length} image(s):\n\n` +
                  `Prompt: ${fullParams.prompt}\n` +
                  `Model: ${fullParams.model}\n` +
                  `Style: ${fullParams.style}\n` +
                  `Size: ${fullParams.size}\n` +
                  `Quality: ${fullParams.quality}\n` +
                  `Task ID: ${response.output.task_id}\n\n` +
                  `Image URLs:\n${imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      // 更新历史记录为失败状态
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (historyRecord) {
        await this.historyService.updateRecord(historyRecord.id, {
          status: 'failed',
          error_message: errorMessage,
        });
      }

      throw error;
    }
  }

  /**
   * 处理配置设置请求
   */
  private async handleSetConfig(params: SetConfigParams) {
    const updatedConfig = await this.configService.updateConfig(params);
    
    // 更新DashScope客户端
    if (this.dashScopeClient) {
      this.dashScopeClient.updateApiKey(updatedConfig.api_key);
      this.dashScopeClient.updateRegion(updatedConfig.region);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Configuration updated successfully:\n\n` +
                `Region: ${updatedConfig.region}\n` +
                `Default Size: ${updatedConfig.default_size}\n` +
                `Default Style: ${updatedConfig.default_style}\n` +
                `Default Quality: ${updatedConfig.default_quality}\n` +
                `Updated: ${updatedConfig.updated_at}`,
        },
      ],
    };
  }

  /**
   * 处理获取配置请求
   */
  private async handleGetConfig() {
    const config = this.configService.getConfig();
    
    return {
      content: [
        {
          type: 'text',
          text: `Current configuration:\n\n` +
                `API Key: ${config.api_key ? '***configured***' : 'not set'}\n` +
                `Region: ${config.region}\n` +
                `Default Size: ${config.default_size}\n` +
                `Default Style: ${config.default_style}\n` +
                `Default Quality: ${config.default_quality}\n` +
                `Last Updated: ${config.updated_at}`,
        },
      ],
    };
  }

  /**
   * 处理历史记录列表请求
   */
  private async handleListHistory(params: ListHistoryParams) {
    const history = await this.historyService.getHistory(params);
    const stats = this.historyService.getStats();

    const recordsText = history.records.map((record, index) => 
      `${index + 1}. [${record.status.toUpperCase()}] ${record.prompt.substring(0, 50)}${record.prompt.length > 50 ? '...' : ''}\n` +
      `   Style: ${record.style} | Size: ${record.size} | Quality: ${record.quality}\n` +
      `   Created: ${new Date(record.created_at).toLocaleString()}\n` +
      `   Images: ${record.image_urls.length} | Task ID: ${record.task_id}\n` +
      (record.error_message ? `   Error: ${record.error_message}\n` : '')
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Generation History (${history.records.length}/${history.total} records):\n\n` +
                `Statistics:\n` +
                `- Total: ${stats.total}\n` +
                `- Completed: ${stats.completed}\n` +
                `- Failed: ${stats.failed}\n` +
                `- Processing: ${stats.processing}\n` +
                `- Pending: ${stats.pending}\n\n` +
                (history.records.length > 0 ? `Records:\n${recordsText}` : 'No records found.'),
        },
      ],
    };
  }

  /**
   * 处理模型测试请求
   */
  private async handleTestModel(params: { model: string }) {
    // 检查配置
    if (!this.configService.isConfigValid()) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'API key not configured. Please use set-config tool first.'
      );
    }

    // 初始化DashScope客户端
    if (!this.dashScopeClient) {
      const config = this.configService.getConfig();
      this.dashScopeClient = new DashScopeClient(config.api_key, config.region);
    }

    const model = params.model as 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus';
    
    try {
      const result = await this.dashScopeClient.testModel(model);
      
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Model ${model} is available and working correctly!\n\n` +
                    `Test completed successfully.\n` +
                    `Task ID: ${result.taskId || 'N/A'}\n` +
                    `Status: Ready for use`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Model ${model} test failed:\n\n` +
                    `Error: ${result.error}\n` +
                    `Status: Not available`,
            },
          ],
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `❌ Model ${model} test failed:\n\n` +
                  `Error: ${errorMessage}\n` +
                  `Status: Not available`,
          },
        ],
      };
    }
  }

  /**
   * 处理API诊断请求
   */
  private async handleDiagnoseApi(params: { check_network?: boolean; check_auth?: boolean; check_quota?: boolean }) {
    const config = this.configService.getConfig();
    const diagnostic = new ApiDiagnostic(config.api_key, config.region);
    
    const options = {
      checkNetwork: params.check_network ?? true,
      checkAuth: params.check_auth ?? true,
      checkQuota: params.check_quota ?? true,
    };
    
    try {
      const result = await diagnostic.runDiagnostic(options);
      
      let statusText = '';
      if (result.overall.status === 'healthy') {
        statusText = '✅ API状态正常';
      } else if (result.overall.status === 'warning') {
        statusText = '⚠️ API状态有警告';
      } else {
        statusText = '❌ API状态异常';
      }
      
      const checksText = Object.entries(result.checks)
        .map(([, check]: [string, any]) => {
          const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
          let text = `${icon} ${check.name}: ${check.message}`;
          if (check.details) {
            text += `\n   详情: ${check.details}`;
          }
          if (check.suggestion) {
            text += `\n   建议: ${check.suggestion}`;
          }
          return text;
        })
        .join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `API诊断报告\n\n` +
                  `${statusText}\n\n` +
                  `检查结果:\n${checksText}\n\n` +
                  `诊断时间: ${new Date().toLocaleString()}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `❌ API诊断失败:\n\n` +
                  `错误: ${errorMessage}\n` +
                  `请检查网络连接和API配置`,
          },
        ],
      };
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP Server error occurred', 'MCPServer', { error });
    };

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully', 'MCPServer');
      try {
        await this.server.close();
        logger.info('Server closed successfully', 'MCPServer');
      } catch (error) {
        logger.error('Error during server shutdown', 'MCPServer', { error });
      }
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', 'MCPServer', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', 'MCPServer', { reason, promise });
    });
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 设置日志级别
      if (process.env['NODE_ENV'] === 'development') {
        logger.setLogLevel(LogLevel.DEBUG);
      }

      logger.info('Starting Wan2.2 MCP Server', 'MCPServer', {
        version: '1.0.0',
        nodeEnv: process.env['NODE_ENV'] || 'production'
      });

      // 初始化服务
      logger.info('Initializing services', 'MCPServer');
      await this.configService.initialize();
      await this.historyService.initialize();

      logger.info('Services initialized successfully', 'MCPServer');
      
      // 启动服务器
      logger.info('Starting MCP server transport', 'MCPServer');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('Server started and ready to accept connections', 'MCPServer');
    } catch (error) {
      logger.error('Failed to start server', 'MCPServer', { error });
      process.exit(1);
    }
  }
}

// 启动服务器
const server = new Wan2MCPServer();
server.start().catch((error) => {
  console.error('[MCP Server] Startup error:', error);
  process.exit(1);
});