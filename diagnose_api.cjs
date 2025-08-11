// Copyright (c) 2025 菘蓝. All rights reserved.

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 读取配置文件
const configPath = path.join(__dirname, 'data', 'config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error('❌ 无法读取配置文件:', error.message);
    process.exit(1);
}

console.log('🔍 开始API诊断...\n');

// 基础配置检查
console.log('📋 配置检查:');
console.log(`   API Key: ${config.api_key ? '✅ 已配置' : '❌ 未配置'}`);
console.log(`   区域: ${config.region || 'cn-beijing'}`);
console.log(`   默认尺寸: ${config.default_size || '1024*1024'}`);
console.log(`   默认风格: ${config.default_style || 'photography'}`);
console.log(`   默认质量: ${config.default_quality || 'standard'}\n`);

// API连接测试
async function testApiConnection() {
    console.log('🌐 网络连接测试:');
    
    const baseURL = 'https://dashscope.aliyuncs.com';
    const headers = {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
    };

    try {
        // 测试基础连接
        console.log('   测试基础连接...');
        const response = await axios.get(`${baseURL}/api/v1/services/aigc/text2image/image-synthesis`, {
            headers: headers,
            timeout: 10000
        });
        console.log('   ✅ 基础连接成功');
    } catch (error) {
        if (error.response) {
            console.log(`   ⚠️  API响应: ${error.response.status} - ${error.response.statusText}`);
            console.log(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            console.log('   ❌ 网络连接失败 - 无响应');
        } else {
            console.log(`   ❌ 请求配置错误: ${error.message}`);
        }
    }
}

// 模型权限测试
async function testModelPermissions() {
    console.log('\n🔐 模型权限测试:');
    
    const models = [
        'wan2.2-t2i-flash',
        'wan2.2-t2i-plus', 
        'wanx2.1-t2i-turbo',
        'wanx2.1-t2i-plus',
        'wanx2.0-t2i-turbo',
        'wanx-v1'
    ];

    const baseURL = 'https://dashscope.aliyuncs.com';
    const headers = {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
    };

    for (const model of models) {
        try {
            console.log(`   测试模型: ${model}`);
            
            const requestBody = {
                model: model,
                input: {
                    prompt: "test image"
                },
                parameters: {
                    size: "1024*1024",
                    n: 1
                }
            };

            const response = await axios.post(
                `${baseURL}/api/v1/services/aigc/text2image/image-synthesis`,
                requestBody,
                { headers, timeout: 15000 }
            );

            if (response.data && response.data.output && response.data.output.task_id) {
                console.log(`   ✅ ${model}: 权限正常，任务ID: ${response.data.output.task_id}`);
            } else {
                console.log(`   ⚠️  ${model}: 响应异常`);
            }

        } catch (error) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (errorData.code === 'Model.AccessDenied') {
                    console.log(`   ❌ ${model}: 权限被拒绝 - ${errorData.message}`);
                } else if (errorData.code === 'InvalidApiKey') {
                    console.log(`   ❌ ${model}: API密钥无效`);
                } else {
                    console.log(`   ❌ ${model}: ${errorData.code} - ${errorData.message}`);
                }
            } else {
                console.log(`   ❌ ${model}: 连接错误 - ${error.message}`);
            }
        }
    }
}

// API密钥详细验证
async function validateApiKey() {
    console.log('\n🔑 API密钥验证:');
    
    if (!config.api_key) {
        console.log('   ❌ API密钥未配置');
        return;
    }

    console.log(`   密钥长度: ${config.api_key.length} 字符`);
    console.log(`   密钥格式: ${config.api_key.startsWith('sk-') ? '✅ 正确格式' : '⚠️  可能格式错误'}`);
    
    // 测试简单的API调用来验证密钥
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
            {
                model: 'wan2.2-t2i-flash',
                input: { prompt: 'test' },
                parameters: { size: '1024*1024', n: 1 }
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.api_key}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable'
                },
                timeout: 10000
            }
        );
        console.log('   ✅ API密钥验证成功');
    } catch (error) {
        if (error.response && error.response.data) {
            const errorData = error.response.data;
            if (errorData.code === 'InvalidApiKey') {
                console.log('   ❌ API密钥无效');
            } else if (errorData.code === 'Model.AccessDenied') {
                console.log('   ✅ API密钥有效，但模型权限不足');
            } else {
                console.log(`   ⚠️  其他错误: ${errorData.code} - ${errorData.message}`);
            }
        } else {
            console.log(`   ❌ 验证失败: ${error.message}`);
        }
    }
}

// 执行所有诊断
async function runDiagnostics() {
    await testApiConnection();
    await validateApiKey();
    await testModelPermissions();
    
    console.log('\n📊 诊断完成!');
    console.log('\n💡 建议:');
    console.log('   1. 如果API密钥有效但模型权限不足，请登录阿里云百炼控制台');
    console.log('   2. 检查"通义万相文生图"服务是否已开通');
    console.log('   3. 确认已申请相关模型的使用权限');
    console.log('   4. 如果问题持续，可尝试使用其他可用的图像生成工具');
}

runDiagnostics().catch(console.error);