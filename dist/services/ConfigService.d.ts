import type { Config, SetConfigParams } from '../types/index.js';
/**
 * 配置管理服务
 * 负责读取、写入和验证配置信息
 */
export declare class ConfigService {
    private configPath;
    private config;
    constructor(dataDir?: string);
    /**
     * 初始化配置服务
     * 创建数据目录和默认配置文件
     */
    initialize(): Promise<void>;
    /**
     * 创建默认配置文件
     */
    private createDefaultConfig;
    /**
     * 加载配置文件
     */
    loadConfig(): Promise<Config>;
    /**
     * 保存配置文件
     */
    private saveConfig;
    /**
     * 获取当前配置
     */
    getConfig(): Config;
    /**
     * 更新配置
     */
    updateConfig(params: SetConfigParams): Promise<Config>;
    /**
     * 验证配置参数
     */
    private validateConfig;
    /**
     * 检查配置是否有效
     */
    isConfigValid(): boolean;
    /**
     * 获取API密钥
     */
    getApiKey(): string;
    /**
     * 重置配置为默认值
     */
    resetConfig(): Promise<Config>;
}
//# sourceMappingURL=ConfigService.d.ts.map