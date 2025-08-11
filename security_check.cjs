// Copyright (c) 2025 菘蓝. All rights reserved.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 GitHub提交前安全检查\n');

// 检查项目
const checks = [
    {
        name: '检查 .gitignore 是否存在',
        check: () => fs.existsSync('.gitignore'),
        fix: '请创建 .gitignore 文件'
    },
    {
        name: '检查 data/config.json 是否被忽略',
        check: () => {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            return gitignore.includes('data/config.json');
        },
        fix: '请在 .gitignore 中添加 data/config.json'
    },
    {
        name: '检查是否存在配置示例文件',
        check: () => fs.existsSync('data/config.example.json'),
        fix: '请创建 data/config.example.json 示例文件'
    },
    {
        name: '检查 Git 状态（无敏感文件待提交）',
        check: () => {
            try {
                const status = execSync('git status --porcelain', { encoding: 'utf8' });
                const lines = status.split('\n').filter(line => line.trim());
                
                // 检查是否有敏感文件
                const sensitiveFiles = lines.filter(line => 
                    line.includes('config.json') && !line.includes('example') ||
                    line.includes('.env') ||
                    line.includes('history.json')
                );
                
                return sensitiveFiles.length === 0;
            } catch (error) {
                return false;
            }
        },
        fix: '请检查 Git 状态，确保没有敏感文件待提交'
    },
    {
        name: '扫描源代码中的硬编码密钥',
        check: () => {
            try {
                const result = execSync('findstr /R /S "sk-[a-zA-Z0-9]\\{32\\}" src\\*.ts', { encoding: 'utf8' });
                return result.trim() === '';
            } catch (error) {
                // findstr 没找到匹配项时会返回错误码，这是正常的
                return true;
            }
        },
        fix: '发现源代码中有硬编码密钥，请移除'
    }
];

let allPassed = true;

checks.forEach((check, index) => {
    try {
        const passed = check.check();
        const status = passed ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${check.name}`);
        
        if (!passed) {
            console.log(`   💡 建议: ${check.fix}`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`${index + 1}. ⚠️  ${check.name} - 检查失败: ${error.message}`);
        allPassed = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
    console.log('🎉 安全检查通过！您可以安全地提交到GitHub');
    console.log('\n📋 提交建议:');
    console.log('   git add .');
    console.log('   git commit -m "feat: 添加wan2.2 MCP服务器"');
    console.log('   git push origin main');
} else {
    console.log('⚠️  发现安全问题，请修复后再提交');
}

console.log('\n📚 更多安全信息请查看 SECURITY.md 文件');