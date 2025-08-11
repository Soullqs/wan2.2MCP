/**
 * 配置信息接口
 */
export interface Config {
    api_key: string;
    region: string;
    default_size: string;
    default_style: string;
    default_quality: string;
    updated_at: string;
}
/**
 * 历史记录接口
 */
export interface HistoryRecord {
    id: string;
    prompt: string;
    size: string;
    style: string;
    quality: string;
    count: number;
    image_urls: string[];
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    updated_at?: string;
    error_message?: string;
}
/**
 * 图像元数据接口
 */
export interface ImageMetadata {
    url: string;
    record_id: string;
    file_name: string;
    file_size: number;
    created_at: string;
}
/**
 * 阿里云DashScope API请求接口
 */
export interface DashScopeImageRequest {
    model: 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus';
    input: {
        prompt: string;
    };
    parameters: {
        size?: string;
        n?: number;
        quality?: string;
    };
}
/**
 * 阿里云DashScope API响应接口
 */
export interface DashScopeImageResponse {
    output: {
        task_id: string;
        task_status: string;
        results?: Array<{
            url: string;
        }>;
    };
    usage: {
        image_count: number;
    };
    request_id: string;
}
/**
 * MCP工具请求参数接口
 */
export interface GenerateImageParams {
    prompt: string;
    model?: 'wanx-v1' | 'wan2.2-t2i-flash' | 'wan2.2-t2i-plus' | 'wanx2.1-t2i-turbo' | 'wanx2.0-t2i-turbo' | 'wanx2.1-t2i-plus';
    size?: string;
    style?: string;
    quality?: string;
    n?: number;
}
export interface SetConfigParams {
    api_key: string;
    region?: string;
    default_size?: string;
    default_style?: string;
}
export interface ListHistoryParams {
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
}
/**
 * MCP工具响应接口
 */
export interface GenerateImageResponse {
    success: boolean;
    images: string[];
    task_id: string;
    error?: string;
}
export interface ListHistoryResponse {
    records: HistoryRecord[];
    total: number;
}
/**
 * 错误类型
 */
export declare class MCPError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
/**
 * 支持的图像尺寸
 */
export declare const SUPPORTED_SIZES: readonly ["1024*1024", "720*1280", "1280*720", "768*1024", "1024*768", "1536*1024", "1024*1536"];
/**
 * 支持的图像风格
 */
export declare const SUPPORTED_STYLES: readonly ["photography", "anime", "oil_painting", "watercolor", "sketch", "chinese_painting", "flat_illustration"];
/**
 * 支持的图像质量
 */
export declare const SUPPORTED_QUALITIES: readonly ["standard", "hd"];
export type ImageSize = typeof SUPPORTED_SIZES[number];
export type ImageStyle = typeof SUPPORTED_STYLES[number];
export type ImageQuality = typeof SUPPORTED_QUALITIES[number];
//# sourceMappingURL=index.d.ts.map