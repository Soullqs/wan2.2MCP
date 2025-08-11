import { promises as fs } from 'fs';
import { join } from 'path';
import type { Config, SetConfigParams } from '../types/index.js';
import { MCPError } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * 配置管理服务
 * 负责读取、写入和验证配置信息
 */
export class ConfigService {
  private configPath: string;
  private config: Config | null = null;

  constructor(dataDir: string = './data') {
    this.configPath = join(dataDir, 'config.json');
  }

  /**
   * 初始化配置服务
   * 创建数据目录和默认配置文件
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing configuration service', 'ConfigService');
      
      // 确保数据目录存在
      const dataDir = this.configPath.replace('/config.json', '').replace('\\config.json', '');
      await fs.mkdir(dataDir, { recursive: true });

      // 检查配置文件是否存在
      try {
        await fs.access(this.configPath);
        await this.loadConfig();
      } catch {
        // 配置文件不存在，创建默认配置
        await this.createDefaultConfig();
      }
      
      logger.info('Configuration service initialized successfully', 'ConfigService');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize config service', 'ConfigService', { error: errorMessage });
      throw new MCPError('INTERNAL_ERROR', 'Failed to initialize config service');
    }
  }

  /**
   * 创建默认配置文件
   */
  private async createDefaultConfig(): Promise<void> {
    const defaultConfig: Config = {
      api_key: '',
      region: 'cn-beijing',
      default_size: '1024*1024',
      default_style: 'photography',
      default_quality: 'standard',
      updated_at: new Date().toISOString()
    };

    await this.saveConfig(defaultConfig);
    this.config = defaultConfig;
  }

  /**
   * 加载配置文件
   */
  async loadConfig(): Promise<Config> {
    try {
      logger.debug('Loading configuration from file', 'ConfigService', { path: this.configPath });
      
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData) as Config;
      
      logger.info('Configuration loaded successfully', 'ConfigService');
      return this.config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to load config', 'ConfigService', { error: errorMessage });
      throw new MCPError('INTERNAL_ERROR', 'Failed to load config');
    }
  }

  /**
   * 保存配置文件
   */
  private async saveConfig(config: Config): Promise<void> {
    try {
      logger.debug('Saving configuration to file', 'ConfigService', { path: this.configPath });
      
      const configData = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configPath, configData, 'utf-8');
      
      logger.info('Configuration saved successfully', 'ConfigService');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to save config', 'ConfigService', { error: errorMessage });
      throw new MCPError('INTERNAL_ERROR', 'Failed to save config');
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): Config {
    if (!this.config) {
      throw new MCPError(
        'Config not loaded. Call initialize() first.',
        'CONFIG_NOT_LOADED'
      );
    }
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  async updateConfig(params: SetConfigParams): Promise<Config> {
    try {
      logger.info('Updating configuration', 'ConfigService', { updates: Object.keys(params) });
      
      if (!this.config) {
        throw new MCPError(
          'Config not loaded. Call initialize() first.',
          'CONFIG_NOT_LOADED'
        );
      }

      // 验证API密钥
      if (!params.api_key || params.api_key.trim() === '') {
        throw new MCPError(
          'API key is required',
          'INVALID_API_KEY'
        );
      }

      // 更新配置
      const updatedConfig: Config = {
        ...this.config,
        api_key: params.api_key.trim(),
        region: params.region || this.config.region,
        default_size: params.default_size || this.config.default_size,
        default_style: params.default_style || this.config.default_style,
        updated_at: new Date().toISOString()
      };

      // 验证配置参数
      this.validateConfig(updatedConfig);

      // 保存配置
      await this.saveConfig(updatedConfig);
      this.config = updatedConfig;

      logger.info('Configuration updated successfully', 'ConfigService');
      return { ...this.config };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update config', 'ConfigService', { error: errorMessage });
      throw new MCPError('INTERNAL_ERROR', 'Failed to update config');
    }
  }

  /**
   * 验证配置参数
   */
  private validateConfig(config: Config): void {
    // 验证区域
    const validRegions = ['cn-beijing', 'cn-shanghai', 'cn-hangzhou', 'cn-shenzhen'];
    if (!validRegions.includes(config.region)) {
      throw new MCPError(
        `Invalid region: ${config.region}. Supported regions: ${validRegions.join(', ')}`,
        'INVALID_REGION'
      );
    }

    // 验证尺寸
    const validSizes = ['1024*1024', '720*1280', '1280*720', '768*1024', '1024*768', '1536*1024', '1024*1536'];
    if (!validSizes.includes(config.default_size)) {
      throw new MCPError(
        `Invalid size: ${config.default_size}. Supported sizes: ${validSizes.join(', ')}`,
        'INVALID_SIZE'
      );
    }

    // 验证风格
    const validStyles = ['photography', 'anime', 'oil_painting', 'watercolor', 'sketch', 'chinese_painting', 'flat_illustration'];
    if (!validStyles.includes(config.default_style)) {
      throw new MCPError(
        `Invalid style: ${config.default_style}. Supported styles: ${validStyles.join(', ')}`,
        'INVALID_STYLE'
      );
    }

    // 验证质量
    const validQualities = ['standard', 'hd'];
    if (!validQualities.includes(config.default_quality)) {
      throw new MCPError(
        `Invalid quality: ${config.default_quality}. Supported qualities: ${validQualities.join(', ')}`,
        'INVALID_QUALITY'
      );
    }
  }

  /**
   * 检查配置是否有效
   */
  isConfigValid(): boolean {
    try {
      const config = this.getConfig();
      return config.api_key !== '' && config.api_key.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取API密钥
   */
  getApiKey(): string {
    const config = this.getConfig();
    if (!config.api_key) {
      throw new MCPError(
        'API key not configured. Please set API key first.',
        'API_KEY_NOT_CONFIGURED'
      );
    }
    return config.api_key;
  }

  /**
   * 重置配置为默认值
   */
  async resetConfig(): Promise<Config> {
    try {
      logger.info('Resetting configuration to defaults', 'ConfigService');
      await this.createDefaultConfig();
      logger.info('Configuration reset to defaults', 'ConfigService');
      return this.getConfig();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to reset config', 'ConfigService', { error: errorMessage });
      throw new MCPError('INTERNAL_ERROR', 'Failed to reset config');
    }
  }
}