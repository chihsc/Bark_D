const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// 首頁路由
app.get('/', (req, res) => {
    res.send('Bark Discord Relay Service is running!');
});

// Bark 通知處理路由
app.post('/bark/:key', async (req, res) => {
    try {
        const { title, body, url, group } = req.body;
        
        // 記錄接收到的通知
        console.log('Received notification:', { title, body, group });

        // 檢查是否設置了 Discord Webhook URL
        if (!process.env.DISCORD_WEBHOOK_URL) {
            throw new Error('Discord Webhook URL not configured');
        }

        // 準備 Discord 訊息
        const discordMessage = {
            embeds: [{
                title: `${group ? `[${group}] ` : ''}${title || 'New Notification'}`,
                description: body || '',
                color: 0x00ff00,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Via Bark Relay'
                }
            }]
        };

        // 如果有URL，添加到訊息中
        if (url) {
            discordMessage.embeds[0].url = url;
        }

        // 發送到 Discord
        const response = await axios.post(process.env.DISCORD_WEBHOOK_URL, discordMessage);
        
        if (response.status === 204) {
            console.log('Successfully forwarded to Discord');
            res.json({ success: true });
        } else {
            throw new Error('Discord API responded with non-204 status');
        }
    } catch (error) {
        console.error('Error forwarding notification:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to forward notification',
            message: error.message 
        });
    }
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
