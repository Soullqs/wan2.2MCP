/**
 * 日志记录工具
 * 提供统一的日志记录功能
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string | undefined;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * 设置最大日志条数
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max;
    this.trimLogs();
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * 记录信息
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * 记录错误
   */
  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    this.logs.push(entry);
    this.trimLogs();

    // 输出到控制台
    this.outputToConsole(entry);
  }

  /**
   * 输出到控制台
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const levelStr = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const message = `${timestamp} ${levelStr} ${context} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * 修剪日志数量
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 获取指定上下文的日志
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 导出日志为JSON字符串
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 创建全局日志实例
export const logger = Logger.getInstance();

// 设置环境变量控制的日志级别
if (process.env['LOG_LEVEL']) {
  const envLevel = process.env['LOG_LEVEL'].toUpperCase();
  if (envLevel in LogLevel) {
    logger.setLogLevel(LogLevel[envLevel as keyof typeof LogLevel]);
  }
}