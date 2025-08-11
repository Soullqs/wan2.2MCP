// 通义万相文生图MCP服务器类型定义
/**
 * 错误类型
 */
export class MCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MCPError';
    }
}
/**
 * 支持的图像尺寸
 */
export const SUPPORTED_SIZES = [
    '1024*1024',
    '720*1280',
    '1280*720',
    '768*1024',
    '1024*768',
    '1536*1024',
    '1024*1536'
];
/**
 * 支持的图像风格
 */
export const SUPPORTED_STYLES = [
    'photography',
    'anime',
    'oil_painting',
    'watercolor',
    'sketch',
    'chinese_painting',
    'flat_illustration'
];
/**
 * 支持的图像质量
 */
export const SUPPORTED_QUALITIES = ['standard', 'hd'];
//# sourceMappingURL=index.js.map