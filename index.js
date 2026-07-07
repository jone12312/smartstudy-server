const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db = { orders: {}, licenses: {} };
const fs = require('fs');
const path = require('path');
const qrBase64 = fs.readFileSync(path.join(__dirname, 'qrcode_base64.txt'), 'utf8').trim();

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
        .pending { color: #f59e0b; }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
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
        let pollingInterval = null;
        
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
                    if (pollingInterval) clearInterval(pollingInterval);
                    setTimeout(() => { window.close(); }, 2000);
                } else {
                    status.textContent = '待管理员确认，请保持页面打开...';
                    status.className = 'status pending';
                    startPolling();
                }
            } catch (e) {
                status.textContent = '验证失败，请重试';
                btn.disabled = false;
                btn.textContent = '我已支付';
            }
        }
        
        async function startPolling() {
            pollingInterval = setInterval(async () => {
                try {
                    const resp = await fetch('/api/check-pay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, deviceId })
                    });
                    const data = await resp.json();
                    
                    if (data.success) {
                        const status = document.getElementById('status');
                        const btn = document.querySelector('.btn-verify');
                        status.textContent = '支付成功！脚本已解锁，请返回学习通页面刷新';
                        status.className = 'status success';
                        btn.textContent = '已完成';
                        btn.style.background = '#22c55e';
                        clearInterval(pollingInterval);
                        setTimeout(() => { window.close(); }, 2000);
                    }
                } catch (e) {
                    console.log('Polling error:', e);
                }
            }, 3000);
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

    db.orders[orderId].status = 'confirmed';
    
    res.json({ success: false, message: '待管理员确认支付' });
});

app.post('/api/check-pay', (req, res) => {
    const { orderId, deviceId } = req.body;
    
    const order = db.orders[orderId];
    
    if (!order) {
        return res.json({ success: false, message: '订单不存在' });
    }

    if (order.status === 'paid') {
        return res.json({ success: true, message: '支付已确认' });
    }
    
    res.json({ success: false, message: '待管理员确认' });
});

app.get('/admin', (req, res) => {
    const orders = Object.values(db.orders).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>智学宝 - 管理员后台</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #1a1a1a; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .status-pending { color: #f59e0b; }
        .status-confirmed { color: #3b82f6; }
        .status-paid { color: #22c55e; }
        .btn-confirm { background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .btn-confirm:hover { background: #16a34a; }
        .empty { color: #999; text-align: center; padding: 40px; }
    </style>
</head>
<body>
    <h1>智学宝 - 支付订单管理</h1>
    <table>
        <thead>
            <tr>
                <th>订单号</th>
                <th>金额</th>
                <th>设备ID</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>`;
    
    if (orders.length === 0) {
        html += `<tr><td colspan="6" class="empty">暂无订单</td></tr>`;
    } else {
        orders.forEach(order => {
            let statusClass = 'status-pending';
            let statusText = '待支付';
            if (order.status === 'confirmed') {
                statusClass = 'status-confirmed';
                statusText = '待确认';
            } else if (order.status === 'paid') {
                statusClass = 'status-paid';
                statusText = '已完成';
            }
            
            let action = '';
            if (order.status !== 'paid') {
                action = `<button class="btn-confirm" onclick="confirmPayment('${order.orderId}', '${order.param}')">确认支付</button>`;
            }
            
            html += `<tr>
                <td>${order.orderId}</td>
                <td>¥${order.money}</td>
                <td>${order.param}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>${new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                <td>${action}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>
    <script>
        async function confirmPayment(orderId, deviceId) {
            if (!confirm('确认该订单已收到支付？')) return;
            
            const resp = await fetch('/api/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, deviceId })
            });
            
            const data = await resp.json();
            
            if (data.success) {
                alert('支付确认成功！');
                location.reload();
            } else {
                alert('确认失败：' + data.message);
            }
        }
    </script>
</body>
</html>`;
    
    res.send(html);
});

app.post('/api/confirm', (req, res) => {
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

    res.json({ success: true, message: '支付确认成功' });
});

app.get('/', (req, res) => {
    res.send('智学宝支付服务器 - 运行正常');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
