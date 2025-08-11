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
async function generateRagdollCat() {
    const config = loadConfig();
    
    console.log('🎨 开始生成布偶猫照片...\n');
    
    const prompt = '一只美丽的布偶猫，蓝色眼睛，长毛蓬松，白色和灰色相间的毛色，坐在柔软的垫子上，温暖的自然光线，高清摄影风格';
    
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
                        console.log('✅ 任务创建成功');
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

// 查询任务状态
async function checkTaskStatus(taskId) {
    const config = loadConfig();
    
    const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: `/api/v1/tasks/${taskId}`,
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
    
    let attempts = 0;
    const maxAttempts = 30; // 最多等待5分钟
    
    while (attempts < maxAttempts) {
        try {
            const status = await checkTaskStatus(taskId);
            
            if (status.output && status.output.task_status === 'SUCCEEDED') {
                console.log('✅ 布偶猫照片生成成功！');
                console.log(`🖼️  图像URL: ${status.output.results[0].url}\n`);
                return status.output.results[0].url;
            } else if (status.output && status.output.task_status === 'FAILED') {
                console.error('❌ 图像生成失败:', status.output.message);
                return null;
            } else {
                process.stdout.write(`   ⏳ 生成中... (${attempts + 1}/${maxAttempts})\r`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
            }
        } catch (error) {
            console.error('❌ 查询状态失败:', error.message);
        }
        
        attempts++;
    }
    
    console.error('❌ 任务超时');
    return null;
}

// 主函数
async function main() {
    try {
        console.log('🐱 wan2.2 MCP - 布偶猫照片生成器\n');
        
        const taskId = await generateRagdollCat();
        const imageUrl = await waitForCompletion(taskId);
        
        if (imageUrl) {
            console.log('🎉 布偶猫照片生成完成！');
            console.log(`📸 您可以通过以下链接查看照片：`);
            console.log(`   ${imageUrl}`);
        } else {
            console.log('😞 很抱歉，图像生成失败。请稍后重试。');
        }
        
    } catch (error) {
        console.error('❌ 生成过程中出现错误:', error.message);
    }
}

main();