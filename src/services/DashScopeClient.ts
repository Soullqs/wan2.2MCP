import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { DashScopeImageRequest, DashScopeImageResponse } from '../types/index.js';
import { MCPError } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * 阿里云DashScope API客户端
 * 负责与阿里云百炼通义万相API进行通信
 */
export class DashScopeClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, region: string = 'cn-beijing') {
    this.apiKey = apiKey;
    this.baseURL = this.getBaseURL(region);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60秒超时
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable' // 启用异步模式
      }
    });

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[DashScope] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[DashScope] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[DashScope] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('[DashScope] Response error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * 根据区域获取API基础URL
   */
  private getBaseURL(region: string): string {
    const regionMap: Record<string, string> = {
      'cn-beijing': 'https://dashscope.aliyuncs.com',
      'cn-shanghai': 'https://dashscope.aliyuncs.com',
      'cn-hangzhou': 'https://dashscope.aliyuncs.com',
      'cn-shenzhen': 'https://dashscope.aliyuncs.com',
      'ap-southeast-1': 'https://dashscope-intl.aliyuncs.com',
      'us-east-1': 'https://dashscope-intl.aliyuncs.com'
    };

    return regionMap[region] || regionMap['cn-beijing']!;
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any): MCPError {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || `HTTP ${status} error`;
      
      switch (status) {
        case 400:
          return new MCPError(
            `Bad request: ${message}`,
            'DASHSCOPE_BAD_REQUEST',
            data
          );
        case 401:
          return new MCPError(
            'Invalid API key or authentication failed',
            'DASHSCOPE_AUTH_ERROR',
            data
          );
        case 403:
          return new MCPError(
            'Access forbidden. Check your API key permissions.',
            'DASHSCOPE_FORBIDDEN',
            data
          );
        case 429:
          return new MCPError(
            'Rate limit exceeded. Please try again later.',
            'DASHSCOPE_RATE_LIMIT',
            data
          );
        case 500:
          return new MCPError(
            'DashScope server error. Please try again later.',
            'DASHSCOPE_SERVER_ERROR',
            data
          );
        default:
          return new MCPError(
            `DashScope API error: ${message}`,
            'DASHSCOPE_API_ERROR',
            data
          );
      }
    } else if (error.code === 'ECONNABORTED') {
      return new MCPError(
        'Request timeout. The image generation is taking too long.',
        'DASHSCOPE_TIMEOUT'
      );
    } else {
      return new MCPError(
        `Network error: ${error.message}`,
        'DASHSCOPE_NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * 生成图像
   */
  async generateImage(params: DashScopeImageRequest): Promise<DashScopeImageResponse> {
    logger.info('Starting image generation', 'DashScopeClient', { 
      prompt: params.input.prompt,
      size: params.parameters.size
    });

    try {
      // 发送请求
      const response: AxiosResponse<DashScopeImageResponse> = await this.client.post(
        '/api/v1/services/aigc/text2image/image-synthesis',
        params
      );

      const result = response.data;

      // 验证响应
      if (!result.output) {
        logger.error('Invalid response from DashScope API', 'DashScopeClient', { result });
        throw new MCPError(
          'Invalid response from DashScope API: missing output',
          'DASHSCOPE_INVALID_RESPONSE',
          result
        );
      }

      logger.info('Image generation request submitted successfully', 'DashScopeClient', {
        task_id: result.output.task_id,
        task_status: result.output.task_status,
        request_id: result.request_id,
        image_count: result.usage?.image_count || 0
      });

      return result;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('API request failed', 'DashScopeClient', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          message: axiosError.message
        });
      } else {
        logger.error('Unexpected error during image generation', 'DashScopeClient', { error });
      }
      
      throw new MCPError(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DASHSCOPE_GENERATION_ERROR',
        error
      );
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<DashScopeImageResponse> {
    logger.debug('Checking task status', 'DashScopeClient', { taskId });

    try {
      const response: AxiosResponse<DashScopeImageResponse> = await this.client.get(
        `/api/v1/tasks/${taskId}`
      );

      const result = response.data;

      logger.debug('Task status retrieved', 'DashScopeClient', {
        task_id: result.output.task_id,
        task_status: result.output.task_status,
        results_count: result.output.results?.length || 0
      });

      return result;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('Failed to get task status', 'DashScopeClient', {
          taskId,
          status: axiosError.response?.status,
          message: axiosError.message
        });
      } else {
        logger.error('Unexpected error getting task status', 'DashScopeClient', { taskId, error });
      }
      
      throw new MCPError(
        `Failed to get task status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DASHSCOPE_STATUS_ERROR',
        error
      );
    }
  }

  /**
   * 等待任务完成
   */
  async waitForCompletion(
    taskId: string,
    maxWaitTime: number = 300000, // 5分钟
    pollInterval: number = 3000 // 3秒
  ): Promise<DashScopeImageResponse> {
    const startTime = Date.now();
    logger.info('Waiting for task completion', 'DashScopeClient', {
      taskId,
      maxWaitTime,
      pollInterval
    });
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getTaskStatus(taskId);
        
        switch (result.output.task_status) {
          case 'SUCCEEDED':
            logger.info('Task completed successfully', 'DashScopeClient', {
              taskId,
              duration: Date.now() - startTime,
              resultCount: result.output.results?.length || 0
            });
            return result;
          
          case 'FAILED':
            const errorMsg = 'Task failed';
            logger.error('Task failed', 'DashScopeClient', {
              taskId,
              error: errorMsg,
              duration: Date.now() - startTime
            });
            throw new MCPError(
              `Image generation failed for task ${taskId}`,
              'DASHSCOPE_TASK_FAILED',
              result
            );
          
          case 'PENDING':
          case 'RUNNING':
            logger.debug('Task still processing', 'DashScopeClient', {
              taskId,
              status: result.output.task_status,
              elapsed: Date.now() - startTime
            });
            await this.sleep(pollInterval);
            break;
          
          default:
            logger.error('Unknown task status', 'DashScopeClient', {
              taskId,
              status: result.output.task_status
            });
            throw new MCPError(
              `Unknown task status: ${result.output.task_status}`,
              'DASHSCOPE_UNKNOWN_STATUS',
              result
            );
        }
      } catch (error) {
        if (error instanceof MCPError) {
          throw error;
        }
        // 网络错误等，继续重试
        logger.warn('Error checking task status, retrying', 'DashScopeClient', {
          taskId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        await this.sleep(pollInterval);
      }
    }

    logger.error('Task timeout', 'DashScopeClient', {
      taskId,
      maxWaitTime,
      actualTime: Date.now() - startTime
    });
    throw new MCPError(
      `Task ${taskId} did not complete within ${maxWaitTime / 1000} seconds`,
      'DASHSCOPE_TIMEOUT'
    );
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 使用一个简单的请求来测试连接
      await this.generateImage({
        model: 'wan2.2-t2i-flash',
        input: {
          prompt: 'test connection'
        },
        parameters: {
          size: '1024*1024',
          quality: 'standard',
          n: 1
        }
      });
      return true;
    } catch (error) {
      console.error('[DashScope] Connection test failed:', error);
      return false;
    }
  }

  /**
   * 测试特定模型的可用性
   */
  async testModel(model: 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus'): Promise<{ success: boolean; error?: string; taskId?: string }> {
    try {
      logger.info(`Testing model: ${model}`, 'DashScopeClient');
      
      const result = await this.generateImage({
        model,
        input: {
          prompt: 'test model availability'
        },
        parameters: {
          size: '1024*1024',
          quality: 'standard',
          n: 1
        }
      });
      
      logger.info(`Model ${model} test successful`, 'DashScopeClient', {
        taskId: result.output.task_id,
        status: result.output.task_status
      });
      
      return {
        success: true,
        taskId: result.output.task_id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Model ${model} test failed`, 'DashScopeClient', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 更新API密钥
   */
  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * 更新区域
   */
  updateRegion(region: string): void {
    this.baseURL = this.getBaseURL(region);
    this.client.defaults.baseURL = this.baseURL;
  }
}