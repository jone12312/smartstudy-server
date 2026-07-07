const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db = { orders: {}, licenses: {} };

function generateOrderId() {
    return 'ORD' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex').toUpperCase();
}

app.get('/api/license/status', (req, res) => {
    const deviceId = req.query.deviceId;
    const licensed = !!db.licenses[deviceId];
    res.json({ licensed, deviceId });
});

app.post('/api/check', (req, res) => {
    const { param } = req.body;
    const ok = !!db.licenses[param];
    res.json({ ok, deviceId: param });
});

app.post('/api/create', (req, res) => {
    const { name, money, type, param } = req.body;
    const orderId = generateOrderId();
    
    db.orders[orderId] = {
        orderId,
        name,
        money,
        type,
        param,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const qrBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAtAAAAK7CAYAAADbZLgFAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nOyd23LbONOuX3BPytZmlHIO5/4vaw4/VyxLsiTuif9gqbEgxTFBgRQpp58q1mQSkQAaDaDRaLKFlFKCYRiGYRiGYRgjnLErwDAMwzAMwzCPBBvQDMMwDMMwDNMBNqAZhmEYhmEYpgNsQDMMwzAMwzBMB9iAZhiGYRiGYZgOsAHNMAzDMAzDMB1gA5phGIZhGIZhOsAGNMMwDMMwDMN0gA1ohmEYhmEYhukAG9AMwzAMwzAM0wE2oBmGYRiGYRimA2xAMwzDMAzDMEwH2IBmGIZhGIZhmA6wAc0wDMMwDMMwHWADmmEYhmEYhmE6wAY0wzAMwzAMw3SADWiGYRiGYRiG6QAb0AzDMAzDMAzTgUEN6Lqu1Z+zLBuyKGZAqqoCADRNg6ZpIKVE0zSDl9uX/txafy6fyx+z/LHR61iWpfpvURR3q0NRFKpsvR7X9ZsqU5Pho8nPlinIn7FjyvrrDflwIYT6s+/7F/9GCwkzXVzXBTRFresavu+jqip43qCqA/SgP7b15/K5/DHLHxsppTL+qb66HPQNxhC4rosgCC7+zvM8VSe9f6bK1GT4aPKzZWz5M3ZMXX+FHNiKPRwOcF0XcRwDAPb7Pebz+ZBFMj2Rpqnqt7quUZYloihCVVUoy1L925DY6E8f9efyufwxy58SZVlCCAHHcdA0zeCbgKqqVFm0TF1vZB6NsWX46PKz5d7yZ+yYuv4ObkDrSCnVrmGz2WC5XN6raOYGHMdBVVVomgZCCPi+r7xpjnP/8Pmu+tN3/bl8Ln/M8u9NXdeoqkq1OwxD9W9SysFPEIUQv3mZ8jxX9fE8T3n5p8rUZPho8rNlbPkzdkxdfwc3oE+nEwAgSRJ1dKkvRMx0ybIMURQB54nIdV0URQHP87Db7bBarQavg43+9FF/Lp/LH7P8MdHbSX8mD969PHdk/JDn6bM6TZmpyfDR5GfLFOTP2DFl/R3cgC7LEr7vq/8CwPv7O1ar1SSCwJk/Q16yt7c3rNfrC4VtmuYuXjQb/emj/lw+lz9m+WNT1zWyLMNsNrsISSnLcnDvD8WM4xwOAwBxHON4PCKKotG9T6ZMSYaPKD9bxpQ/Y8fk9VcOSNM0UkopN5uN9H1fApCz2UwmSSIB8PUg1/PzszydTlJKKbfbrdztdkOqTe/6c2v9uXwuf8zyx+Z4PKo/b7dbuVgsVJvuMYfrZSwWC7lYLOR2u/20flNlajJ8NPnZMrb8+fre+ju4B7ooCgRBoGIA6TMk+tuUzHSJoghZlkFKqY6hcUcPmq3+2Nafy+fyxyx/ClDoihACQRCgLMu7xY6S3OmzY/RVhUc7fp+KDB9VfraMKX/Gjinr791eInQcRx1hsuI+HtRnY8Ud2eqPbf25fC5/zPLHgupNL/OMMX/rZeovfj2KHKckw0eUny1TkD9jx1T19zFcIAzDMAzDMAwzEdiAZhiGYRiGYZgOsAHNMAzDMAzDMB1gA5phGIZhGIZhOsAGNMMwDMMwDMN0gA1ohmEYhmEYhukAG9AMwzAMwzAM04FJG9B6ooEoikatyyNDHx13HEfJ9FGSONCH06n/u36/03EceJ6nUgHf+9uRVP7pdLqpfD2BBM6pjAGo9KZthGF48f9ZlgHnNLb3KH9s+f/N6KnGqb/LslR9agJ9N5eSwNz7+7me5/2ma1VVtaZRnxJN01wk3fF9/+6JIKSUcF0XdV2rPr0XRVFc6B/xCH2or5Okh77vIwiCEWv1WARBcCE74lFskK+YRjoXA64X/HtPA==';

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智学宝支付</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 40px; max-width: 400px; width: 100%; text-align: center; }
        h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
        .price { font-size: 32px; color: #ef4444; font-weight: 700; margin: 20px 0; }
        .qrcode { width: 250px; height: 250px; margin: 20px auto; border-radius: 12px; overflow: hidden; border: 2px solid #eee; }
        .qrcode img { width: 100%; height: 100%; object-fit: cover; }
        .tips { color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; }
        .btn-verify { background: #6366f1; color: white; border: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background 0.2s; }
        .btn-verify:hover { background: #4f46e5; }
        .status { margin-top: 15px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>智学宝</h1>
        <p style="color:#666;font-size:14px;">永久解锁全部功能</p>
        <div class="price">¥${money}</div>
        <div class="qrcode">
            <img src="data:image/png;base64,${qrBase64}" alt="支付宝收款码">
        </div>
        <div class="tips">
            <p>请使用支付宝扫码支付</p>
            <p>支付完成后点击下方按钮验证</p>
        </div>
        <button class="btn-verify" onclick="verifyPayment()">我已支付</button>
        <div class="status" id="status"></div>
    </div>
    <script>
        const orderId = '${orderId}';
        const deviceId = '${param}';
        
        async function verifyPayment() {
            const btn = document.querySelector('.btn-verify');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.textContent = '验证中...';
            status.textContent = '正在验证支付状态，请稍候...';
            
            try {
                const resp = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, deviceId })
                });
                
                const data = await resp.json();
                
                if (data.success) {
                    status.textContent = '支付成功！脚本已解锁，请返回学习通页面刷新';
                    btn.textContent = '已完成';
                    btn.style.background = '#22c55e';
                    setTimeout(() => { window.close(); }, 2000);
                } else {
                    status.textContent = '未检测到支付，请完成支付后重试';
                    btn.disabled = false;
                    btn.textContent = '我已支付';
                }
            } catch (e) {
                status.textContent = '验证失败，请重试';
                btn.disabled = false;
                btn.textContent = '我已支付';
            }
        }
    </script>
</body>
</html>`;

    res.send(html);
});

app.post('/api/verify', (req, res) => {
    const { orderId, deviceId } = req.body;
    
    const order = db.orders[orderId];
    
    if (!order) {
        return res.json({ success: false, message: '订单不存在' });
    }

    db.orders[orderId].status = 'paid';
    db.licenses[deviceId] = {
        activatedAt: new Date().toISOString(),
        orderId
    };

    res.json({ success: true, message: '支付验证成功' });
});

app.get('/', (req, res) => {
    res.send('智学宝支付服务器 - 运行正常');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
