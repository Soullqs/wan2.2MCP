import type { HistoryRecord, ListHistoryParams, ListHistoryResponse } from '../types/index.js';
/**
 * 历史记录管理服务
 * 负责存储、查询和管理图像生成历史记录
 */
export declare class HistoryService {
    private historyPath;
    private records;
    constructor(dataDir?: string);
    /**
     * 初始化历史记录服务
     */
    initialize(): Promise<void>;
    /**
     * 加载历史记录
     */
    private loadHistory;
    /**
     * 保存历史记录
     */
    private saveHistory;
    /**
     * 创建新的历史记录
     */
    createRecord(prompt: string, size: string, style: string, quality: string, count: number, taskId: string): Promise<HistoryRecord>;
    /**
     * 更新历史记录状态
     */
    updateRecord(id: string, updates: Partial<Pick<HistoryRecord, 'status' | 'image_urls' | 'error_message'>>): Promise<HistoryRecord>;
    /**
     * 根据任务ID查找记录
     */
    findByTaskId(taskId: string): HistoryRecord | undefined;
    /**
     * 根据ID查找记录
     */
    findById(id: string): HistoryRecord | undefined;
    /**
     * 获取历史记录列表
     */
    getHistory(params?: ListHistoryParams): Promise<ListHistoryResponse>;
    /**
     * 删除历史记录
     */
    deleteRecord(id: string): Promise<boolean>;
    /**
     * 清空历史记录
     */
    clearHistory(): Promise<void>;
    /**
     * 获取统计信息
     */
    getStats(): {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        processing: number;
    };
    /**
     * 搜索历史记录
     */
    searchRecords(query: string): HistoryRecord[];
    /**
     * 获取最近的记录
     */
    getRecentRecords(count?: number): HistoryRecord[];
    /**
     * 清理过期记录（超过指定天数的记录）
     */
    cleanupOldRecords(daysToKeep?: number): Promise<number>;
}
//# sourceMappingURL=HistoryService.d.ts.map