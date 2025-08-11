import type { DashScopeImageRequest, DashScopeImageResponse } from '../types/index.js';
/**
 * 阿里云DashScope API客户端
 * 负责与阿里云百炼通义万相API进行通信
 */
export declare class DashScopeClient {
    private client;
    private apiKey;
    private baseURL;
    constructor(apiKey: string, region?: string);
    /**
     * 根据区域获取API基础URL
     */
    private getBaseURL;
    /**
     * 处理API错误
     */
    private handleApiError;
    /**
     * 生成图像
     */
    generateImage(params: DashScopeImageRequest): Promise<DashScopeImageResponse>;
    /**
     * 查询任务状态
     */
    getTaskStatus(taskId: string): Promise<DashScopeImageResponse>;
    /**
     * 等待任务完成
     */
    waitForCompletion(taskId: string, maxWaitTime?: number, // 5分钟
    pollInterval?: number): Promise<DashScopeImageResponse>;
    /**
     * 睡眠函数
     */
    private sleep;
    /**
     * 测试API连接
     */
    testConnection(): Promise<boolean>;
    /**
     * 测试特定模型的可用性
     */
    testModel(model: 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus'): Promise<{
        success: boolean;
        error?: string;
        taskId?: string;
    }>;
    /**
     * 更新API密钥
     */
    updateApiKey(apiKey: string): void;
    /**
     * 更新区域
     */
    updateRegion(region: string): void;
}
//# sourceMappingURL=DashScopeClient.d.ts.map