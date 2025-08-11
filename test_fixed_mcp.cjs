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

// 测试修复后的任务状态查询
async function testTaskStatusQuery(taskId) {
    const config = loadConfig();
    
    console.log(`🔍 测试任务状态查询 (修复后的URL路径)...`);
    console.log(`   任务ID: ${taskId}\n`);
    
    const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: `/api/v1/tasks/${taskId}`, // 修复后的正确路径
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📡 HTTP状态码: ${res.statusCode}`);
            console.log(`📡 响应头: ${JSON.stringify(res.headers, null, 2)}\n`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ 任务状态查询成功');
                    console.log(`📊 响应数据:`, JSON.stringify(response, null, 2));
                    resolve(response);
                } catch (error) {
                    console.error('❌ 响应解析失败:', error.message);
                    console.log('原始响应:', data);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.end();
    });
}

// 生成新的测试图像
async function generateTestImage() {
    const config = loadConfig();
    
    console.log('🎨 生成测试图像...\n');
    
    const prompt = '一朵美丽的红玫瑰，高清摄影风格';
    
    const requestData = JSON.stringify({
        model: 'wan2.2-t2i-flash',
        input: {
            prompt: prompt,
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
                        console.log('✅ 图像生成任务创建成功');
                        console.log(`   任务ID: ${response.output.task_id}`);
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

// 等待任务完成并测试状态查询
async function waitAndTestStatus(taskId) {
    console.log('\n⏳ 等待任务完成并测试状态查询...\n');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        try {
            const status = await testTaskStatusQuery(taskId);
            
            if (status.output && status.output.task_status === 'SUCCEEDED') {
                console.log('\n🎉 任务完成！修复验证成功！');
                console.log(`🖼️  图像URL: ${status.output.results[0].url}\n`);
                return status.output.results[0].url;
            } else if (status.output && status.output.task_status === 'FAILED') {
                console.error('\n❌ 任务失败:', status.output.message);
                return null;
            } else {
                console.log(`   ⏳ 任务状态: ${status.output?.task_status || 'UNKNOWN'} (${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (error) {
            console.error(`❌ 状态查询失败 (尝试 ${attempts + 1}):`, error.message);
            if (error.message.includes('Request method \'GET\' is not supported')) {
                console.error('🚨 仍然存在HTTP方法错误！修复未生效。');
                return null;
            }
        }
        
        attempts++;
    }
    
    console.error('\n❌ 任务超时');
    return null;
}

// 主函数
async function main() {
    try {
        console.log('🔧 wan2.2 MCP - 修复验证测试\n');
        console.log('📋 测试内容:');
        console.log('   1. 生成测试图像');
        console.log('   2. 使用修复后的URL路径查询任务状态');
        console.log('   3. 验证是否解决了"Request method \'GET\' is not supported"错误\n');
        
        // 生成测试图像
        const taskId = await generateTestImage();
        
        // 测试修复后的状态查询
        const imageUrl = await waitAndTestStatus(taskId);
        
        if (imageUrl) {
            console.log('✅ 修复验证成功！');
            console.log('📸 MCP工具现在应该可以正常工作了。');
            console.log(`🖼️  生成的图像: ${imageUrl}`);
        } else {
            console.log('❌ 修复验证失败，需要进一步调查。');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    }
}

main();