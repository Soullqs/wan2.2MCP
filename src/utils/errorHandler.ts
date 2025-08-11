/**
 * 错误处理工具
 * 提供统一的错误处理和转换功能
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MCPError } from '../types/index.js';
import { logger } from './logger.js';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  type: ErrorType;
  code?: string;
  context?: string;
  originalError?: Error;
  timestamp: string;
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理并转换错误为MCP错误
   */
  static handleError(error: unknown, context?: string): McpError {
    const timestamp = new Date().toISOString();
    
    // 记录错误日志
    logger.error(
      `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context,
      { error, timestamp }
    );

    // 如果已经是MCP错误，直接返回
    if (error instanceof McpError) {
      return error;
    }

    // 如果是自定义MCP错误，转换为标准MCP错误
    if (error instanceof MCPError) {
      return new McpError(
        ErrorCode.InternalError,
        error.message,
        error.details
      );
    }

    // 如果是标准错误，根据类型转换
    if (error instanceof Error) {
      return this.convertErrorToMcpError(error, context);
    }

    // 未知错误类型
    return new McpError(
      ErrorCode.InternalError,
      'An unknown error occurred',
      { type: ErrorType.UNKNOWN_ERROR, timestamp, context }
    );
  }

  /**
   * 转换标准错误为MCP错误
   */
  private static convertErrorToMcpError(error: Error, context?: string): McpError {
    const timestamp = new Date().toISOString();
    const message = error.message;

    // 根据错误消息判断错误类型
    if (this.isValidationError(error)) {
      return new McpError(
        ErrorCode.InvalidRequest,
        `Validation error: ${message}`,
        { type: ErrorType.VALIDATION_ERROR, timestamp, context }
      );
    }

    if (this.isNetworkError(error)) {
      return new McpError(
        ErrorCode.InternalError,
        `Network error: ${message}`,
        { type: ErrorType.NETWORK_ERROR, timestamp, context }
      );
    }

    if (this.isTimeoutError(error)) {
      return new McpError(
        ErrorCode.InternalError,
        `Timeout error: ${message}`,
        { type: ErrorType.TIMEOUT_ERROR, timestamp, context }
      );
    }

    if (this.isConfigError(error)) {
      return new McpError(
        ErrorCode.InvalidRequest,
        `Configuration error: ${message}`,
        { type: ErrorType.CONFIG_ERROR, timestamp, context }
      );
    }

    if (this.isFileError(error)) {
      return new McpError(
        ErrorCode.InternalError,
        `File operation error: ${message}`,
        { type: ErrorType.FILE_ERROR, timestamp, context }
      );
    }

    if (this.isApiError(error)) {
      return new McpError(
        ErrorCode.InternalError,
        `API error: ${message}`,
        { type: ErrorType.API_ERROR, timestamp, context }
      );
    }

    // 默认为内部错误
    return new McpError(
      ErrorCode.InternalError,
      message,
      { type: ErrorType.UNKNOWN_ERROR, timestamp, context }
    );
  }

  /**
   * 判断是否为验证错误
   */
  private static isValidationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('missing') ||
      message.includes('format')
    );
  }

  /**
   * 判断是否为网络错误
   */
  private static isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('etimedout') ||
      error.name === 'NetworkError'
    );
  }

  /**
   * 判断是否为超时错误
   */
  private static isTimeoutError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      error.name === 'TimeoutError'
    );
  }

  /**
   * 判断是否为配置错误
   */
  private static isConfigError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('config') ||
      message.includes('api key') ||
      message.includes('credential') ||
      message.includes('authentication')
    );
  }

  /**
   * 判断是否为文件错误
   */
  private static isFileError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('file') ||
      message.includes('directory') ||
      message.includes('enoent') ||
      message.includes('eacces') ||
      error.name === 'FileSystemError'
    );
  }

  /**
   * 判断是否为API错误
   */
  private static isApiError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('api') ||
      message.includes('http') ||
      message.includes('status') ||
      message.includes('response') ||
      message.includes('request failed')
    );
  }

  /**
   * 创建验证错误
   */
  static createValidationError(message: string, context?: string): McpError {
    logger.warn(`Validation error: ${message}`, context);
    return new McpError(
      ErrorCode.InvalidRequest,
      message,
      {
        type: ErrorType.VALIDATION_ERROR,
        timestamp: new Date().toISOString(),
        context,
      }
    );
  }

  /**
   * 创建配置错误
   */
  static createConfigError(message: string, context?: string): McpError {
    logger.error(`Configuration error: ${message}`, context);
    return new McpError(
      ErrorCode.InvalidRequest,
      message,
      {
        type: ErrorType.CONFIG_ERROR,
        timestamp: new Date().toISOString(),
        context,
      }
    );
  }

  /**
   * 创建API错误
   */
  static createApiError(message: string, context?: string, statusCode?: number): McpError {
    logger.error(`API error: ${message}`, context, { statusCode });
    return new McpError(
      ErrorCode.InternalError,
      message,
      {
        type: ErrorType.API_ERROR,
        timestamp: new Date().toISOString(),
        context,
        statusCode,
      }
    );
  }

  /**
   * 创建网络错误
   */
  static createNetworkError(message: string, context?: string): McpError {
    logger.error(`Network error: ${message}`, context);
    return new McpError(
      ErrorCode.InternalError,
      message,
      {
        type: ErrorType.NETWORK_ERROR,
        timestamp: new Date().toISOString(),
        context,
      }
    );
  }

  /**
   * 创建超时错误
   */
  static createTimeoutError(message: string, context?: string): McpError {
    logger.error(`Timeout error: ${message}`, context);
    return new McpError(
      ErrorCode.InternalError,
      message,
      {
        type: ErrorType.TIMEOUT_ERROR,
        timestamp: new Date().toISOString(),
        context,
      }
    );
  }
}

/**
 * 异步错误处理装饰器
 */
export function handleAsyncErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyName) || {
        value: target[propertyName],
        writable: true,
        enumerable: false,
        configurable: true
      };
    }
    
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        throw ErrorHandler.handleError(error, context || `${target.constructor.name}.${propertyName}`);
      }
    };

    return descriptor;
  };
}

/**
 * 同步错误处理装饰器
 */
export function handleSyncErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyName) || {
        value: target[propertyName],
        writable: true,
        enumerable: false,
        configurable: true
      };
    }
    
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        return method.apply(this, args);
      } catch (error) {
        throw ErrorHandler.handleError(error, context || `${target.constructor.name}.${propertyName}`);
      }
    };

    return descriptor;
  };
}