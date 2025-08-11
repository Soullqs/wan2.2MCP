const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * 测试wan2.2 MCP服务器的模型选择功能
 */

// 配置信息
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');
const API_BASE_URL = 'https://dashscope.aliyuncs.com';

/**
 * 读取配置文件
 */
function loadConfig() {
    try {
        const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('❌ 无法读取配置文件:', error.message);
        return null;
    }
}

/**
 * 测试模型可用性
 */
async function testModelAvailability(apiKey, model) {
    console.log(`   测试 ${model} 模型可用性...`);
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/v1/services/aigc/text2image/image-synthesis`,
            {
                model: model,
                input: {
                    prompt: '测试图像生成'
                },
                parameters: {
                    size: '1024*1024',
                    quality: 'standard',
                    n: 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.output && response.data.output.task_id) {
            console.log(`   ✅ ${model}: 权限正常`);
            console.log(`      任务ID: ${response.data.output.task_id}`);
            return {
                success: true,
                taskId: response.data.output.task_id,
                model: model
            };
        } else {
            console.log(`   ❌ ${model}: 响应格式异常`);
            return { success: false, model: model, error: '响应格式异常' };
        }
    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.message || error.response.data?.error || '未知错误';
            if (error.response.status === 400 && errorMsg.includes('Model access denied')) {
                console.log(`   ❌ ${model}: 模型访问被拒绝`);
                return { success: false, model: model, error: '模型访问被拒绝' };
            } else {
                console.log(`   ❌ ${model}: ${errorMsg}`);
                return { success: false, model: model, error: errorMsg };
            }
        } else {
            console.log(`   ❌ ${model}: 网络错误 - ${error.message}`);
            return { success: false, model: model, error: error.message };
        }
    }
}

/**
 * 测试图像生成功能
 */
async function testImageGeneration(apiKey, model, prompt) {
    console.log(`   测试 ${model} 图像生成...`);
    
    try {
        // 创建生成任务
        const response = await axios.post(
            `${API_BASE_URL}/api/v1/services/aigc/text2image/image-synthesis`,
            {
                model: model,
                input: {
                    prompt: prompt
                },
                parameters: {
                    size: '1024*1024',
                    quality: 'standard',
                    n: 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable'
                },
                timeout: 30000
            }
        );

        if (!response.data || !response.data.output || !response.data.output.task_id) {
            console.log(`   ❌ ${model}: 任务创建失败`);
            return { success: false, model: model, error: '任务创建失败' };
        }

        const taskId = response.data.output.task_id;
        console.log(`   ✅ ${model}: 任务创建成功`);
        console.log(`      任务ID: ${taskId}`);

        // 等待任务完成
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒
            attempts++;
            
            try {
                const statusResponse = await axios.get(
                    `${API_BASE_URL}/api/v1/services/aigc/text2image/image-synthesis/${taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                const status = statusResponse.data.output.task_status;
                
                if (status === 'SUCCEEDED') {
                    const imageUrls = statusResponse.data.output.results?.map(r => r.url) || [];
                    console.log(`   ✅ ${model}: 图像生成成功`);
                    console.log(`      🖼️  图像URL: ${imageUrls[0] || 'N/A'}`);
                    return {
                        success: true,
                        model: model,
                        taskId: taskId,
                        imageUrls: imageUrls
                    };
                } else if (status === 'FAILED') {
                    console.log(`   ❌ ${model}: 图像生成失败`);
                    return { success: false, model: model, error: '图像生成失败' };
                } else {
                    console.log(`   ⏳ ${model}: 任务进行中... (${status})`);
                }
            } catch (statusError) {
                console.log(`   ⚠️  ${model}: 状态查询失败，继续等待...`);
            }
        }
        
        console.log(`   ⏰ ${model}: 任务超时`);
        return { success: false, model: model, error: '任务超时' };
        
    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.message || error.response.data?.error || '未知错误';
            console.log(`   ❌ ${model}: ${errorMsg}`);
            return { success: false, model: model, error: errorMsg };
        } else {
            console.log(`   ❌ ${model}: 网络错误 - ${error.message}`);
            return { success: false, model: model, error: error.message };
        }
    }
}

/**
 * 主测试函数
 */
async function runModelSelectionTests() {
    console.log('🚀 开始测试wan2.2 MCP服务器模型选择功能\n');
    
    // 1. 读取配置
    console.log('📋 检查配置文件:');
    const config = loadConfig();
    if (!config) {
        console.log('❌ 配置文件读取失败，测试终止');
        return;
    }
    
    if (!config.api_key || config.api_key === 'your-dashscope-api-key-here') {
        console.log('❌ API密钥未配置，请先配置有效的API密钥');
        return;
    }
    
    console.log('   ✅ 配置文件读取成功');
    console.log(`   📍 区域: ${config.region}`);
    console.log(`   🔧 默认设置: ${config.default_size}, ${config.default_style}, ${config.default_quality}\n`);
    
    // 2. 测试模型可用性
    console.log('🔍 测试模型可用性:');
    const modelsToTest = ['wan2.2-t2i-flash', 'wan2.2-t2i-plus'];
    const availabilityResults = [];
    
    for (const model of modelsToTest) {
        const result = await testModelAvailability(config.api_key, model);
        availabilityResults.push(result);
    }
    
    console.log('');
    
    // 3. 测试图像生成功能
    console.log('🎨 测试图像生成功能:');
    const generationResults = [];
    
    // 测试wan2.2-t2i-flash模型
    const flashResult = await testImageGeneration(
        config.api_key, 
        'wan2.2-t2i-flash', 
        '一只可爱的小猫咪在花园里玩耍'
    );
    generationResults.push(flashResult);
    
    // 测试wan2.2-t2i-plus模型
    const plusResult = await testImageGeneration(
        config.api_key, 
        'wan2.2-t2i-plus', 
        '美丽的日落风景，山峦起伏，色彩绚烂'
    );
    generationResults.push(plusResult);
    
    console.log('');
    
    // 4. 生成测试报告
    console.log('📊 测试结果总结:');
    console.log('\n模型可用性测试:');
    availabilityResults.forEach(result => {
        const status = result.success ? '✅ 可用' : '❌ 不可用';
        console.log(`   ${result.model}: ${status}`);
        if (!result.success) {
            console.log(`      错误: ${result.error}`);
        }
    });
    
    console.log('\n图像生成测试:');
    generationResults.forEach(result => {
        const status = result.success ? '✅ 成功' : '❌ 失败';
        console.log(`   ${result.model}: ${status}`);
        if (result.success && result.imageUrls) {
            console.log(`      生成图像: ${result.imageUrls.length} 张`);
        } else if (!result.success) {
            console.log(`      错误: ${result.error}`);
        }
    });
    
    // 5. 总体评估
    const allAvailable = availabilityResults.every(r => r.success);
    const allGenerated = generationResults.every(r => r.success);
    
    console.log('\n🎉 总体评估:');
    if (allAvailable && allGenerated) {
        console.log('   ✅ 所有测试通过！模型选择功能正常工作');
        console.log('   🚀 wan2.2 MCP服务器已准备就绪');
    } else {
        console.log('   ⚠️  部分测试失败，请检查配置和权限');
        if (!allAvailable) {
            console.log('   📋 建议: 检查API密钥权限和模型访问权限');
        }
        if (!allGenerated) {
            console.log('   📋 建议: 检查网络连接和API配额');
        }
    }
}

// 运行测试
if (require.main === module) {
    runModelSelectionTests().catch(error => {
        console.error('❌ 测试执行失败:', error.message);
        process.exit(1);
    });
}

module.exports = {
    runModelSelectionTests,
    testModelAvailability,
    testImageGeneration
};