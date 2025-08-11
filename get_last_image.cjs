// Copyright (c) 2025 菘蓝. All rights reserved.

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置信息
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');

function loadConfig() {
    try {
        const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('❌ 无法读取配置文件:', error.message);
        process.exit(1);
    }
}

async function getTaskResult(taskId) {
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

async function main() {
    try {
        const taskId = '859ac29a-f58d-4214-9526-3fcd1b61eda5'; // 最后生成的任务ID
        
        console.log('🔍 获取最后生成的图像结果...\n');
        
        const result = await getTaskResult(taskId);
        
        if (result.output && result.output.results) {
            console.log('✅ 图像生成成功！');
            console.log('📸 生成的图像URL:');
            result.output.results.forEach((img, index) => {
                console.log(`   图像${index + 1}: ${img.url}`);
            });
            console.log('\n🎉 MCP问题已完全解决！');
        } else {
            console.log('❌ 未找到图像结果');
            console.log('响应:', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error('❌ 获取结果失败:', error.message);
    }
}

main();