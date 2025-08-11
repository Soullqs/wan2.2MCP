import axios from 'axios';
import { logger } from './logger.js';

/**
 * API诊断工具
 * 用于详细检查API调用问题
 */
export class ApiDiagnostic {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, region: string = 'cn-beijing') {
    this.apiKey = apiKey;
    this.baseURL = region === 'cn-beijing' ? 'https://dashscope.aliyuncs.com' : 'https://dashscope-intl.aliyuncs.com';
  }

  /**
   * 详细诊断API调用
   */
  async diagnoseApiCall(model: string): Promise<{
    success: boolean;
    details: any;
    suggestions: string[];
  }> {
    const suggestions: string[] = [];
    let details: any = {};

    try {
      logger.info(`开始诊断模型: ${model}`, 'ApiDiagnostic');

      // 构建请求
      const requestData = {
        model,
        input: {
          prompt: 'test diagnostic'
        },
        parameters: {
          size: '1024*1024',
          n: 1,
          quality: 'standard'
        }
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      };

      logger.info('发送诊断请求', 'ApiDiagnostic', {
        url: `${this.baseURL}/api/v1/services/aigc/text2image/image-synthesis`,
        headers: { ...headers, Authorization: 'Bearer ***' },
        data: requestData
      });

      const response = await axios.post(
        `${this.baseURL}/api/v1/services/aigc/text2image/image-synthesis`,
        requestData,
        { headers, timeout: 30000 }
      );

      details = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };

      logger.info('诊断请求成功', 'ApiDiagnostic', details);
      return { success: true, details, suggestions };

    } catch (error: any) {
      logger.error('诊断请求失败', 'ApiDiagnostic', { error });

      if (error.response) {
        details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        };

        // 根据错误状态码提供建议
        switch (error.response.status) {
          case 400:
            suggestions.push('请求参数格式错误，检查模型名称和参数格式');
            suggestions.push('确认模型名称拼写正确');
            break;
          case 401:
            suggestions.push('API密钥无效或格式错误');
            suggestions.push('检查API密钥是否正确配置');
            break;
          case 403:
            suggestions.push('API密钥权限不足');
            suggestions.push('检查是否开通了通义万相服务');
            suggestions.push('确认API密钥是否有访问该模型的权限');
            suggestions.push('检查账户余额是否充足');
            break;
          case 429:
            suggestions.push('请求频率过高，稍后重试');
            break;
          case 500:
            suggestions.push('服务器内部错误，稍后重试');
            break;
        }

        // 检查具体错误信息
        if (error.response.data) {
          const errorData = error.response.data;
          if (errorData.code) {
            suggestions.push(`错误代码: ${errorData.code}`);
          }
          if (errorData.message) {
            suggestions.push(`错误信息: ${errorData.message}`);
          }
        }
      } else {
        details = {
          message: error.message,
          code: error.code
        };
        suggestions.push('网络连接错误或超时');
      }

      return { success: false, details, suggestions };
    }
  }

  /**
   * 检查API密钥格式
   */
  validateApiKey(): { valid: boolean; suggestions: string[] } {
    const suggestions: string[] = [];
    
    if (!this.apiKey) {
      suggestions.push('API密钥为空');
      return { valid: false, suggestions };
    }

    if (!this.apiKey.startsWith('sk-')) {
      suggestions.push('API密钥格式错误，应以"sk-"开头');
      return { valid: false, suggestions };
    }

    if (this.apiKey.length < 20) {
      suggestions.push('API密钥长度过短，可能不完整');
      return { valid: false, suggestions };
    }

    return { valid: true, suggestions: ['API密钥格式正确'] };
  }

  /**
   * 运行完整诊断
   */
  async runDiagnostic(options: {
    checkNetwork?: boolean;
    checkAuth?: boolean;
    checkQuota?: boolean;
  } = {}) {
    const checks: Record<string, {
      status: 'pass' | 'warning' | 'fail';
      name: string;
      message: string;
      details?: string;
      suggestion?: string;
    }> = {};

    // 检查API密钥格式
     if (options.checkAuth !== false) {
       const keyValidation = this.validateApiKey();
       checks['apiKey'] = {
         status: keyValidation.valid ? 'pass' : 'fail',
         name: 'API密钥格式',
         message: keyValidation.valid ? 'API密钥格式正确' : 'API密钥格式错误',
         suggestion: keyValidation.suggestions.join('; ')
       };
     }

    // 检查网络连接
    if (options.checkNetwork !== false) {
      try {
        const response = await axios.get(`${this.baseURL}/api/v1/services/aigc/text2image/image-synthesis`, {
          timeout: 5000,
          validateStatus: () => true // 接受所有状态码
        });
        
        checks['network'] = {
           status: 'pass',
           name: '网络连接',
           message: '网络连接正常',
           details: `状态码: ${response.status}`
         };
      } catch (error: any) {
         checks['network'] = {
           status: 'fail',
           name: '网络连接',
           message: '网络连接失败',
           details: error.message,
           suggestion: '检查网络连接和防火墙设置'
         };
       }
    }

    // 检查API认证和权限
    if (options.checkAuth !== false) {
      const testResult = await this.diagnoseApiCall('wan2.2-t2i-flash');
      
      if (testResult.success) {
         checks['auth'] = {
           status: 'pass',
           name: 'API认证',
           message: 'API认证成功',
           details: '成功创建测试任务'
         };
       } else {
         const status = testResult.details.status;
         let authStatus: 'warning' | 'fail' = 'fail';
         let message = 'API认证失败';
         
         if (status === 403) {
           authStatus = 'warning';
           message = 'API密钥权限不足';
         } else if (status === 401) {
           message = 'API密钥无效';
         }
         
         const authCheck: any = {
           status: authStatus,
           name: 'API认证',
           message,
           suggestion: testResult.suggestions.join('; ')
         };
         
         if (testResult.details.data) {
           authCheck.details = JSON.stringify(testResult.details.data);
         }
         
         checks['auth'] = authCheck;
       }
    }

    // 确定整体状态
    const statuses = Object.values(checks).map(check => check.status);
    let overallStatus: 'healthy' | 'warning' | 'error';
    
    if (statuses.every(s => s === 'pass')) {
      overallStatus = 'healthy';
    } else if (statuses.some(s => s === 'fail')) {
      overallStatus = 'error';
    } else {
      overallStatus = 'warning';
    }

    return {
      overall: {
        status: overallStatus,
        timestamp: new Date().toISOString()
      },
      checks
    };
  }
}