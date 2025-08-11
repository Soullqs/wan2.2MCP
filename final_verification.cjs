// Copyright (c) 2025 菘蓝. All rights reserved.

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置信息
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');

// 读取配置
function loadConfig() {
    try {
        const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('❌ 无法读取配置文件:', error.message);
        process.exit(1);
    }
}

// 测试修复前的错误URL（应该失败）
async function testOldURL(taskId) {
    const config = loadConfig();
    
    console.log('🔍 测试修复前的错误URL路径...');
    
    const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: `/api/v1/services/aigc/text2image/image-synthesis/${taskId}`, // 错误的路径
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 状态码: ${res.statusCode}`);
                if (res.statusCode === 405) {
                    console.log('✅ 确认：错误URL返回405 Method Not Allowed');
                    resolve(true);
                } else {
                    console.log('❌ 意外的响应:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            resolve(false);
        });

        req.end();
    });
}

// 测试修复后的正确URL（应该成功）
async function testNewURL(taskId) {
    const config = loadConfig();
    
    console.log('🔍 测试修复后的正确URL路径...');
    
    const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: `/api/v1/tasks/${taskId}`, // 正确的路径
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 状态码: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log('✅ 确认：正确URL返回200 OK');
                    try {
                        const response = JSON.parse(data);
                        console.log(`📊 任务状态: ${response.output?.task_status || 'UNKNOWN'}`);
                        resolve(true);
                    } catch (error) {
                        console.log('❌ 响应解析失败');
                        resolve(false);
                    }
                } else {
                    console.log('❌ 意外的响应状态码');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            resolve(false);
        });

        req.end();
    });
}

// 生成测试任务
async function generateTestTask() {
    const config = loadConfig();
    
    console.log('🎨 生成测试任务...\n');
    
    const requestData = JSON.stringify({
        model: 'wan2.2-t2i-flash',
        input: {
            prompt: '一朵美丽的红玫瑰，高清摄影风格',
            negative_prompt: '',
            ref_img: null
        },
        parameters: {
            style: 'photography',
            size: '1024*1024',
            n: 1,
            seed: Math.floor(Math.random() * 1000000),
            ref_strength: 0.5,
            ref_mode: 'repaint'
        }
    });

    const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: '/api/v1/services/aigc/text2image/image-synthesis',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData),
            'X-DashScope-Async': 'enable'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.output && response.output.task_id) {
                        console.log('✅ 测试任务创建成功');
                        console.log(`   任务ID: ${response.output.task_id}\n`);
                        resolve(response.output.task_id);
                    } else {
                        console.error('❌ 任务创建失败:', response);
                        reject(new Error('任务创建失败'));
                    }
                } catch (error) {
                    console.error('❌ 响应解析失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.write(requestData);
        req.end();
    });
}

// 主函数
async function main() {
    try {
        console.log('🔧 wan2.2 MCP - 最终修复验证\n');
        console.log('📋 验证步骤:');
        console.log('   1. 生成测试任务');
        console.log('   2. 测试修复前的错误URL（应该返回405错误）');
        console.log('   3. 测试修复后的正确URL（应该返回200成功）\n');
        
        // 生成测试任务
        const taskId = await generateTestTask();
        
        // 测试错误URL
        console.log('🧪 步骤2: 测试错误URL路径');
        const oldURLResult = await testOldURL(taskId);
        
        console.log('\n🧪 步骤3: 测试正确URL路径');
        const newURLResult = await testNewURL(taskId);
        
        console.log('\n📊 验证结果:');
        console.log(`   错误URL测试: ${oldURLResult ? '✅ 按预期失败' : '❌ 意外结果'}`);
        console.log(`   正确URL测试: ${newURLResult ? '✅ 成功' : '❌ 失败'}`);
        
        if (oldURLResult && newURLResult) {
            console.log('\n🎉 修复验证完全成功！');
            console.log('📝 问题已解决:');
            console.log('   - 修复了任务状态查询的URL路径');
            console.log('   - 从错误的 /api/v1/services/aigc/text2image/image-synthesis/{taskId}');
            console.log('   - 改为正确的 /api/v1/tasks/{taskId}');
            console.log('   - MCP工具现在应该可以正常工作');
        } else {
            console.log('\n❌ 修复验证失败，需要进一步调查');
        }
        
    } catch (error) {
        console.error('❌ 验证过程中出现错误:', error.message);
    }
}

main();