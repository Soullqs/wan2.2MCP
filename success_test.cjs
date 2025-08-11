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

// 生成图像
async function generateImage() {
    const config = loadConfig();
    
    console.log('🎨 开始生成图像...\n');
    
    const requestData = JSON.stringify({
        model: 'wan2.2-t2i-flash',
        input: {
            prompt: '一朵美丽的红玫瑰，高清摄影风格，专业摄影，自然光线',
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

// 查询任务状态（使用修复后的URL）
async function queryTaskStatus(taskId) {
    const config = loadConfig();
    
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
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// 等待任务完成
async function waitForCompletion(taskId) {
    console.log('⏳ 等待图像生成完成...\n');
    
    const maxAttempts = 30;
    const interval = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await queryTaskStatus(taskId);
            const status = response.output?.task_status;
            
            console.log(`📊 第${attempt}次查询 - 状态: ${status}`);
            
            if (status === 'SUCCEEDED') {
                console.log('✅ 图像生成成功！');
                return response.output;
            } else if (status === 'FAILED') {
                console.log('❌ 图像生成失败');
                console.log('错误信息:', response.output?.message || '未知错误');
                return null;
            }
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        } catch (error) {
            console.error(`❌ 第${attempt}次查询失败:`, error.message);
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
    }
    
    console.log('⏰ 等待超时');
    return null;
}

// 主函数
async function main() {
    try {
        console.log('🎉 wan2.2 MCP - 修复成功验证\n');
        console.log('📝 本次测试将验证:');
        console.log('   ✓ 任务创建功能正常');
        console.log('   ✓ 修复后的URL路径工作正常');
        console.log('   ✓ 完整的图像生成流程\n');
        
        // 生成图像
        const taskId = await generateImage();
        
        // 等待完成
        const result = await waitForCompletion(taskId);
        
        if (result && result.results && result.results.length > 0) {
            console.log('\n🎊 MCP问题修复验证成功！');
            console.log('📸 生成的图像URL:');
            result.results.forEach((img, index) => {
                console.log(`   图像${index + 1}: ${img.url}`);
            });
            
            console.log('\n📋 修复总结:');
            console.log('   🔧 问题: 任务状态查询URL路径错误');
            console.log('   🔧 原因: 使用了错误的API端点');
            console.log('   🔧 修复: 更正为 /api/v1/tasks/{taskId}');
            console.log('   🔧 结果: MCP工具现在可以正常工作');
            
        } else {
            console.log('\n❌ 图像生成失败，需要进一步调查');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    }
}

main();