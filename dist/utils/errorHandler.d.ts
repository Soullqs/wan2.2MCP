/**
 * 错误处理工具
 * 提供统一的错误处理和转换功能
 */
import { McpError } from '@modelcontextprotocol/sdk/types.js';
/**
 * 错误类型枚举
 */
export declare enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    API_ERROR = "API_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    CONFIG_ERROR = "CONFIG_ERROR",
    FILE_ERROR = "FILE_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
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
export declare class ErrorHandler {
    /**
     * 处理并转换错误为MCP错误
     */
    static handleError(error: unknown, context?: string): McpError;
    /**
     * 转换标准错误为MCP错误
     */
    private static convertErrorToMcpError;
    /**
     * 判断是否为验证错误
     */
    private static isValidationError;
    /**
     * 判断是否为网络错误
     */
    private static isNetworkError;
    /**
     * 判断是否为超时错误
     */
    private static isTimeoutError;
    /**
     * 判断是否为配置错误
     */
    private static isConfigError;
    /**
     * 判断是否为文件错误
     */
    private static isFileError;
    /**
     * 判断是否为API错误
     */
    private static isApiError;
    /**
     * 创建验证错误
     */
    static createValidationError(message: string, context?: string): McpError;
    /**
     * 创建配置错误
     */
    static createConfigError(message: string, context?: string): McpError;
    /**
     * 创建API错误
     */
    static createApiError(message: string, context?: string, statusCode?: number): McpError;
    /**
     * 创建网络错误
     */
    static createNetworkError(message: string, context?: string): McpError;
    /**
     * 创建超时错误
     */
    static createTimeoutError(message: string, context?: string): McpError;
}
/**
 * 异步错误处理装饰器
 */
export declare function handleAsyncErrors(context?: string): (target: any, propertyName: string, descriptor?: PropertyDescriptor) => PropertyDescriptor;
/**
 * 同步错误处理装饰器
 */
export declare function handleSyncErrors(context?: string): (target: any, propertyName: string, descriptor?: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=errorHandler.d.ts.map