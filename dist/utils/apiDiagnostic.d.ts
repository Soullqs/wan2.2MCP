/**
 * API诊断工具
 * 用于详细检查API调用问题
 */
export declare class ApiDiagnostic {
    private apiKey;
    private baseURL;
    constructor(apiKey: string, region?: string);
    /**
     * 详细诊断API调用
     */
    diagnoseApiCall(model: string): Promise<{
        success: boolean;
        details: any;
        suggestions: string[];
    }>;
    /**
     * 检查API密钥格式
     */
    validateApiKey(): {
        valid: boolean;
        suggestions: string[];
    };
    /**
     * 运行完整诊断
     */
    runDiagnostic(options?: {
        checkNetwork?: boolean;
        checkAuth?: boolean;
        checkQuota?: boolean;
    }): Promise<{
        overall: {
            status: "error" | "warning" | "healthy";
            timestamp: string;
        };
        checks: Record<string, {
            status: "pass" | "warning" | "fail";
            name: string;
            message: string;
            details?: string;
            suggestion?: string;
        }>;
    }>;
}
//# sourceMappingURL=apiDiagnostic.d.ts.map