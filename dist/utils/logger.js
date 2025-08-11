/**
 * 日志记录工具
 * 提供统一的日志记录功能
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static instance;
    logLevel = LogLevel.INFO;
    logs = [];
    maxLogs = 1000;
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    /**
     * 设置日志级别
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * 设置最大日志条数
     */
    setMaxLogs(max) {
        this.maxLogs = max;
        this.trimLogs();
    }
    /**
     * 记录调试信息
     */
    debug(message, context, data) {
        this.log(LogLevel.DEBUG, message, context, data);
    }
    /**
     * 记录信息
     */
    info(message, context, data) {
        this.log(LogLevel.INFO, message, context, data);
    }
    /**
     * 记录警告
     */
    warn(message, context, data) {
        this.log(LogLevel.WARN, message, context, data);
    }
    /**
     * 记录错误
     */
    error(message, context, data) {
        this.log(LogLevel.ERROR, message, context, data);
    }
    /**
     * 记录日志
     */
    log(level, message, context, data) {
        if (level < this.logLevel) {
            return;
        }
        const entry = {
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
    outputToConsole(entry) {
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
    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    /**
     * 获取所有日志
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * 获取指定级别的日志
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    /**
     * 获取指定上下文的日志
     */
    getLogsByContext(context) {
        return this.logs.filter(log => log.context === context);
    }
    /**
     * 清空日志
     */
    clearLogs() {
        this.logs = [];
    }
    /**
     * 导出日志为JSON字符串
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}
// 创建全局日志实例
export const logger = Logger.getInstance();
// 设置环境变量控制的日志级别
if (process.env['LOG_LEVEL']) {
    const envLevel = process.env['LOG_LEVEL'].toUpperCase();
    if (envLevel in LogLevel) {
        logger.setLogLevel(LogLevel[envLevel]);
    }
}
//# sourceMappingURL=logger.js.map