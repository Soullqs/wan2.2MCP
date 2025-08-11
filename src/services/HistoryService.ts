import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { HistoryRecord, ListHistoryParams, ListHistoryResponse } from '../types/index.js';
import { MCPError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * 历史记录管理服务
 * 负责存储、查询和管理图像生成历史记录
 */
export class HistoryService {
  private historyPath: string;
  private records: HistoryRecord[] = [];

  constructor(dataDir: string = './data') {
    this.historyPath = join(dataDir, 'history.json');
  }

  /**
   * 初始化历史记录服务
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing history service', 'HistoryService');
      
      // 确保数据目录存在
      const dataDir = this.historyPath.replace('/history.json', '').replace('\\history.json', '');
      await fs.mkdir(dataDir, { recursive: true });

      // 加载历史记录
      try {
        await this.loadHistory();
      } catch {
        // 历史记录文件不存在，创建空的历史记录
        await this.saveHistory();
      }
      
      logger.info('History service initialized successfully', 'HistoryService');
    } catch (error) {
      throw ErrorHandler.handleError(error, 'HistoryService.initialize');
    }
  }

  /**
   * 加载历史记录
   */
  private async loadHistory(): Promise<void> {
    try {
      logger.debug('Loading history from file', 'HistoryService', { path: this.historyPath });
      const historyData = await fs.readFile(this.historyPath, 'utf-8');
      const data = JSON.parse(historyData);
      this.records = data.records || [];
      logger.info(`Loaded ${this.records.length} history records`, 'HistoryService');
    } catch (error) {
      throw ErrorHandler.handleError(error, 'HistoryService.loadHistory');
    }
  }

  /**
   * 保存历史记录
   */
  private async saveHistory(): Promise<void> {
    try {
      logger.debug('Saving history to file', 'HistoryService', { 
        path: this.historyPath, 
        recordCount: this.records.length 
      });
      const historyData = {
        records: this.records,
        total: this.records.length,
        updated_at: new Date().toISOString()
      };
      const data = JSON.stringify(historyData, null, 2);
      await fs.writeFile(this.historyPath, data, 'utf-8');
      logger.debug('History saved successfully', 'HistoryService');
    } catch (error) {
      throw ErrorHandler.handleError(error, 'HistoryService.saveHistory');
    }
  }

  /**
   * 创建新的历史记录
   */
  async createRecord(
    prompt: string,
    size: string,
    style: string,
    quality: string,
    count: number,
    taskId: string
  ): Promise<HistoryRecord> {
    try {
      const record: HistoryRecord = {
        id: uuidv4(),
        prompt,
        size,
        style,
        quality,
        count,
        image_urls: [],
        task_id: taskId,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      this.records.unshift(record); // 添加到开头，最新的在前面
      await this.saveHistory();

      logger.info('Created new history record', 'HistoryService', { 
        recordId: record.id, 
        taskId, 
        prompt: prompt.substring(0, 50) + '...' 
      });

      return record;
    } catch (error) {
      throw ErrorHandler.handleError(error, 'HistoryService.createRecord');
    }
  }

  /**
   * 更新历史记录状态
   */
  async updateRecord(
    id: string,
    updates: Partial<Pick<HistoryRecord, 'status' | 'image_urls' | 'error_message'>>
  ): Promise<HistoryRecord> {
    try {
      const recordIndex = this.records.findIndex(r => r.id === id);
      if (recordIndex === -1) {
        throw new MCPError(
          `History record not found: ${id}`,
          'RECORD_NOT_FOUND'
        );
      }

      const currentRecord = this.records[recordIndex];
       this.records[recordIndex] = {
          ...currentRecord,
          ...updates,
          updated_at: new Date().toISOString()
        } as HistoryRecord;

       await this.saveHistory();
       
       logger.info('Updated history record', 'HistoryService', { 
          recordId: id, 
          status: updates.status 
        });
        
        return this.records[recordIndex] as HistoryRecord;
    } catch (error) {
      throw ErrorHandler.handleError(error, 'HistoryService.updateRecord');
    }
  }

  /**
   * 根据任务ID查找记录
   */
  findByTaskId(taskId: string): HistoryRecord | undefined {
    return this.records.find(r => r.task_id === taskId);
  }

  /**
   * 根据ID查找记录
   */
  findById(id: string): HistoryRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  /**
   * 获取历史记录列表
   */
  async getHistory(params: ListHistoryParams = {}): Promise<ListHistoryResponse> {
    const {
      limit = 10,
      offset = 0,
      date_from,
      date_to
    } = params;

    let filteredRecords = [...this.records];

    // 日期过滤
    if (date_from) {
      const fromDate = new Date(date_from);
      filteredRecords = filteredRecords.filter(r => 
        new Date(r.created_at) >= fromDate
      );
    }

    if (date_to) {
      const toDate = new Date(date_to);
      filteredRecords = filteredRecords.filter(r => 
        new Date(r.created_at) <= toDate
      );
    }

    // 分页
    const total = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);

    return {
      records: paginatedRecords.map(r => ({ ...r })), // 返回副本
      total
    };
  }

  /**
   * 删除历史记录
   */
  async deleteRecord(id: string): Promise<boolean> {
    const recordIndex = this.records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return false;
    }

    this.records.splice(recordIndex, 1);
    await this.saveHistory();
    return true;
  }

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    this.records = [];
    await this.saveHistory();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
  } {
    const total = this.records.length;
    const completed = this.records.filter(r => r.status === 'completed').length;
    const failed = this.records.filter(r => r.status === 'failed').length;
    const pending = this.records.filter(r => r.status === 'pending').length;
    const processing = this.records.filter(r => r.status === 'processing').length;

    return {
      total,
      completed,
      failed,
      pending,
      processing
    };
  }

  /**
   * 搜索历史记录
   */
  searchRecords(query: string): HistoryRecord[] {
    const lowerQuery = query.toLowerCase();
    return this.records.filter(r => 
      r.prompt.toLowerCase().includes(lowerQuery) ||
      r.style.toLowerCase().includes(lowerQuery) ||
      r.id.toLowerCase().includes(lowerQuery)
    ).map(r => ({ ...r }));
  }

  /**
   * 获取最近的记录
   */
  getRecentRecords(count: number = 5): HistoryRecord[] {
    return this.records
      .slice(0, count)
      .map(r => ({ ...r }));
  }

  /**
   * 清理过期记录（超过指定天数的记录）
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = this.records.length;
    this.records = this.records.filter(r => 
      new Date(r.created_at) >= cutoffDate
    );

    const removedCount = initialCount - this.records.length;
    if (removedCount > 0) {
      await this.saveHistory();
    }

    return removedCount;
  }
}