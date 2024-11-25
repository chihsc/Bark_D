const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Bark 推送監聽接口
app.post('/push/:deviceKey', async (req, res) => {
    try {
        console.log('收到推送請求:', {
            title: req.body.title,
            body: req.body.body,
            deviceKey: req.params.deviceKey
        });

        // 檢查 Discord Webhook 設置
        if (!process.env.DISCORD_WEBHOOK_URL) {
            throw new Error('Discord Webhook URL not configured');
        }

        // 轉發到官方 Bark 服務器
        const barkUrl = `https://api.day.app/${req.params.deviceKey}/`;
        try {
            await axios.post(barkUrl, req.body);
            console.log('成功轉發到 Bark 服務器');
        } catch (error) {
            console.error('Bark 服務器轉發失敗:', error.message);
            // 繼續執行，不中斷流程
        }

        // 發送到 Discord
        const discordMessage = {
            embeds: [{
                title: `🔔 ${req.body.title || 'New Notification'}`,
                description: req.body.body || '',
                color: 0x00ff00,
                timestamp: new Date().toISOString(),
                footer: {
                    text: '來自 Bark 通知'
                }
            }]
        };

        if (req.body.url) {
            discordMessage.embeds[0].url = req.body.url;
        }

        const discordResponse = await axios.post(process.env.DISCORD_WEBHOOK_URL, discordMessage);
        
        if (discordResponse.status === 204) {
            console.log('成功發送到 Discord');
        }

        res.status(200).json({
            success: true,
            message: '通知已成功轉發'
        });

    } catch (error) {
        console.error('處理失敗:', error);
        res.status(500).json({
            success: false,
            error: '轉發失敗',
            message: error.message
        });
    }
});

// 健康檢查端點
app.get('/', (req, res) => {
    res.send('Bark Discord 轉發服務正在運行!');
});

// 測試端點
app.get('/test/:deviceKey', async (req, res) => {
    try {
        const testMessage = {
            title: '測試通知',
            body: '如果您看到這條消息，說明服務運作正常！',
            timestamp: new Date().toISOString()
        };

        // 發送測試消息到 Bark
        await axios.post(`https://api.day.app/${req.params.deviceKey}/`, testMessage);

        // 發送測試消息到 Discord
        const discordMessage = {
            embeds: [{
                title: '🔔 測試通知',
                description: '服務器測試消息',
                color: 0x00ff00,
                timestamp: new Date().toISOString(),
                footer: {
                    text: '來自 Bark 轉發服務'
                }
            }]
        };

        await axios.post(process.env.DISCORD_WEBHOOK_URL, discordMessage);

        res.json({
            success: true,
            message: '測試消息已發送'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '測試失敗',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服務器啟動於端口 ${PORT}`);
    console.log('準備接收並轉發通知...');
});</antArtifact>