const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const questionAnswerMap = {}; // 存储题目和答案的映射
const filePath = './ksdt.txt';

// 读取文件并初始化题目和答案映射
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`读取文件失败：${err.message}`);
    } else {
        try {
            const lines = data.split('\n');
            for (let line of lines) {
                if (line.trim() !== '') {
                    const { question, options, answer, roundId } = JSON.parse(line);
                    questionAnswerMap[question] = { options, answer, roundId };
                }
            }
            console.log('题目和答案映射初始化成功');
        } catch (error) {
            console.error(`解析文件内容失败：${error.message}`);
        }
    }
});

app.get('/', (req, res) => {
    res.status(200).send('题库稳定运行中ing.....');
});

// 上传题目和答案的接口
app.post('/upload', (req, res) => {
    const { question, options, answer, roundId } = req.body;

    if (!question || !options || !answer || !roundId) {
        res.status(400).send('题目、选项、答案和 roundId 不能为空');
        return;
    }

    if (questionAnswerMap.hasOwnProperty(question)) {
        // 题目已存在，更新答案
        questionAnswerMap[question].answer = answer;

        const content = JSON.stringify({
            question,
            options,
            answer,
            roundId
        });

        // 更新文件中的题目和答案
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`读取文件失败：${err.message}`);
                res.status(500).send('上传失败');
            } else {
                try {
                    const lines = data.split('\n');
                    let updatedContent = '';
                    for (let line of lines) {
                        if (line.trim() !== '') {
                            const existingQuestion = JSON.parse(line).question;
                            if (existingQuestion === question) {
                                updatedContent += content + '\n';
                                console.log(`已更新题目 "${question}" 的答案`);
                            } else {
                                updatedContent += line + '\n';
                            }
                        }
                    }

                    fs.writeFile(filePath, updatedContent.trim(), (err) => {
                        if (err) {
                            console.error(`更新失败：${err.message}`);
                            res.status(500).send('更新失败');
                        } else {
                            console.log('更新成功');
                            res.status(200).send('更新成功');
                        }
                    });
                } catch (error) {
                    console.error(`解析文件内容失败：${error.message}`);
                    res.status(500).send('更新失败');
                }
            }
        });
    } else {
        // 题目不存在，新增题目和答案
        questionAnswerMap[question] = { options, answer };

        const content = JSON.stringify({
            question,
            options,
            answer,
            roundId
        });

        if (fs.existsSync(filePath)) {
            fs.appendFile(filePath, '\n' + content, (err) => {
                if (err) {
                    console.error(`上传失败：${err.message}`);
                    res.status(500).send('上传失败');
                } else {
                    console.log('上传成功');
                    res.status(200).send('上传成功');
                }
            });
        } else {
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                    console.error(`上传失败：${err.message}`);
                    res.status(500).send('上传失败');
                } else {
                    console.log('上传成功');
                    res.status(200).send('上传成功');
                }
            });
        }
    }
});

// 查询题目的接口
app.get('/answer', async (req, res) => {
    const question = req.query.question;
    const questionAnswer = questionAnswerMap[question];

    if (!question) {
        res.status(400).json({
            code: 400,
            message: '题目不能为空'
        });
        return;
    }

    if (questionAnswer) {
        const responseData = {
            code: 200,
            data: questionAnswer
        };
        res.status(200).json(responseData);
    } else {
        res.status(404).json({
            code: 404,
            message: '未找到对应的题目和答案'
        });
    }
});

// 启动服务器
app.listen(9397, () => {
    console.log('服务器已启动，监听端口:9397');
});
