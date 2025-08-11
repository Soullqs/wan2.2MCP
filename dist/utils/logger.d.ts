/**
 * 日志记录工具
 * 提供统一的日志记录功能
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string | undefined;
    data?: any;
}
export declare class Logger {
    private static instance;
    private logLevel;
    private logs;
    private maxLogs;
    private constructor();
    static getInstance(): Logger;
    /**
     * 设置日志级别
     */
    setLogLevel(level: LogLevel): void;
    /**
     * 设置最大日志条数
     */
    setMaxLogs(max: number): void;
    /**
     * 记录调试信息
     */
    debug(message: string, context?: string, data?: any): void;
    /**
     * 记录信息
     */
    info(message: string, context?: string, data?: any): void;
    /**
     * 记录警告
     */
    warn(message: string, context?: string, data?: any): void;
    /**
     * 记录错误
     */
    error(message: string, context?: string, data?: any): void;
    /**
     * 记录日志
     */
    private log;
    /**
     * 输出到控制台
     */
    private outputToConsole;
    /**
     * 修剪日志数量
     */
    private trimLogs;
    /**
     * 获取所有日志
     */
    getLogs(): LogEntry[];
    /**
     * 获取指定级别的日志
     */
    getLogsByLevel(level: LogLevel): LogEntry[];
    /**
     * 获取指定上下文的日志
     */
    getLogsByContext(context: string): LogEntry[];
    /**
     * 清空日志
     */
    clearLogs(): void;
    /**
     * 导出日志为JSON字符串
     */
    exportLogs(): string;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map