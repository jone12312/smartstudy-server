const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const AlipaySdk = require('alipay-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db = { orders: {}, licenses: {} };

const ALIPAY_APP_ID = process.env.ALIPAY_APP_ID || '2021006171606448';
const ALIPAY_PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfVEmdR8o+6yj1oBbYvZVBabQeDL1545yj13XzcdXH4oIa7PQy5tblg6btB2fJRrDUJE57RMwX5CTVKdoq4MTKmyskElq/HVXvCuH4kjMYybKWILYJRixzJEXwwLUS0io2ivBChNXqwHkkcP+olJ7UmcKPLEQ+Rs34+FV+WBHDzzWtUyPp6s9gL+V22ioNgA6xI1rqjTS9bv+Gcf0z4Bu7Ms8PEbTIBcCBfIFkZiENwhGfowZg7lOrao6yLmrX7SQK3C2WZ5L4wh5h6MFfm2sl155gMktic/9QCgFYCKpuXFjFNRtCujQ+zlngpBvH51zxoJiFd+/MChs5wDMKvKTLAgMBAAECggEAYSrmOiUuEnEX6bRYOpZkECCG2EyswUkunj0oke86kUxyTDl2NBTTueUwSB3cDcQu0zHRKxwp2+gnDlkX1E5/tZAsHzOSZDtfzQi2BwIiZ1uarjQE0GMbeJ0Gimz8AR5q4BibrfWVADWhq7e+MvFwa/fZz7cPZ2uG8e+BNCxBqUgZXaJ8YecAqm1xkpR2u8Ok56OWD8Qrf099fFjJ0jmw/qiAYsj/RjqhBCyO3bnTpXW+E7SE46e94i1NXUXYCW7bBbqEXh6phTSgbniHDs9nCso9zgnsiYKKngDmwoPOLByrIY4tDvoQXR24RUvzqIggwTbF9U62mDlnQ8Uhds3YAQKBgQD5+5ALr5YC/Hu58WaYM/56Dcl8APElIdVmN6XQcgiigNa6Yr5JbWKrrsx5ebuYmMPcs1OffwDaDkXZniSCl0SxGE1ZJGrpYLehq5QzrHwC368h0E7oeMfCJf3x/1KX+Iy0bgh+tTg4KBd1JwcZKYGw2zm+qlA614o5ZOXcXpzh4QKBgQCjKho+HjrAY9GBZqsOKKiE/RIl6TyT/gPKbF/qEsersrcXQ/Bol4zmGVAw1/VwRpxqkCmH7o3ztXZjb1RgrGzGpVp/16EzGZcOa/k05z6geKxtpi4HK16iNT8QwmerQukdE1/CSMyYiGEU30y1oETRiTxgpR3/UAQWUgGoeqE0KwKBgFgLG96hxuniVwlUVlgA5/3A4VfFVSlI00ofC01w/E2PpxEaOf7OgdQJyoZ2M3Y5R7JxjmA8cOZb5IoSwrUj5dOhxYxB4U20/Lf6IEZa14qDkcENBt2lvGVK0DftPv+7UIMzxdYqqVRN+oUOa9eW4NCTRbE7dupig5JXUQXeZM7BAoGAKwf7i85lKEArDLmK+1z1tL0ZgC4W7+DaFxSl5xG03y9u4g/k43C0lCqw33DVJhs5PVFv4o2jmlaNNoQx+J0AwxLw3y57MQLat876Fl22QpQQxYpCMVnax2TLkRv0Q1KOMEDfzFluu/ubvul1TaFLBQfwiHyDgMYVjd1q2ogc46kCgYAn9PfZXQjX0jePZz+7+O700Ro/vJTAT1/10jxNYA9mxPWQTSPEliNFrSJqMRI+7cISD4eFvmg+w7AMkfSbrq1EFgmin/OE42jkAGhoOAvJFCmNxsZXi2hM4NYmCcOHEsnBDDpqa0hLRvQoEKgOlk/m008JA9di3OuOuI17zT70lQ==\n-----END PRIVATE KEY-----';
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY || 'MIIBIjANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfVEmdR8o+6yj1oBbYvZVBabQeDL1545yj13XzcdXH4oIa7PQy5tblg6btB2fJRrDUJE57RMwX5CTVKdoq4MTKmyskElq/HVXvCuH4kjMYybKWILYJRixzJEXwwLUS0io2ivBChNXqwHkkcP+olJ7UmcKPLEQ+Rs34+FV+WBHDzzWtUyPp6s9gL+V22ioNgA6xI1rqjTS9bv+Gcf0z4Bu7Ms8PEbTIBcCBfIFkZiENwhGfowZg7lOrao6yLmrX7SQK3C2WZ5L4wh5h6MFfm2sl155gMktic/9QCgFYCKpuXFjFNRtCujQ+zlngpBvH51zxoJiFd+/MChs5wDMKvKTLAgMBAAECggEAYSrmOiUuEnEX6bRYOpZkECCG2EyswUkunj0oke86kUxyTDl2NBTTueUwSB3cDcQu0zHRKxwp2+gnDlkX1E5/tZAsHzOSZDtfzQi2BwIiZ1uarjQE0GMbeJ0Gimz8AR5q4BibrfWVADWhq7e+MvFwa/fZz7cPZ2uG8e+BNCxBqUgZXaJ8YecAqm1xkpR2u8Ok56OWD8Qrf099fFjJ0jmw/qiAYsj/RjqhBCyO3bnTpXW+E7SE46e94i1NXUXYCW7bBbqEXh6phTSgbniHDs9nCso9zgnsiYKKngDmwoPOLByrIY4tDvoQXR24RUvzqIggwTbF9U62mDlnQ8Uhds3YAQKBgQD5+5ALr5YC/Hu58WaYM/56Dcl8APElIdVmN6XQcgiigNa6Yr5JbWKrrsx5ebuYmMPcs1OffwDaDkXZniSCl0SxGE1ZJGrpYLehq5QzrHwC368h0E7oeMfCJf3x/1KX+Iy0bgh+tTg4KBd1JwcZKYGw2zm+qlA614o5ZOXcXpzh4QKBgQCjKho+HjrAY9GBZqsOKKiE/RIl6TyT/gPKbF/qEsersrcXQ/Bol4zmGVAw1/VwRpxqkCmH7o3ztXZjb1RgrGzGpVp/16EzGZcOa/k05z6geKxtpi4HK16iNT8QwmerQukdE1/CSMyYiGEU30y1oETRiTxgpR3/UAQWUgGoeqE0KwKBgFgLG96hxuniVwlUVlgA5/3A4VfFVSlI00ofC01w/E2PpxEaOf7OgdQJyoZ2M3Y5R7JxjmA8cOZb5IoSwrUj5dOhxYxB4U20/Lf6IEZa14qDkcENBt2lvGVK0DftPv+7UIMzxdYqqVRN+oUOa9eW4NCTRbE7dupig5JXUQXeZM7BAoGAKwf7i85lKEArDLmK+1z1tL0ZgC4W7+DaFxSl5xG03y9u4g/k43C0lCqw33DVJhs5PVFv4o2jmlaNNoQx+J0AwxLw3y57MQLat876Fl22QpQQxYpCMVnax2TLkRv0Q1KOMEDfzFluu/ubvul1TaFLBQfwiHyDgMYVjd1q2ogc46kCgYAn9PfZXQjX0jePZz+7+O700Ro/vJTAT1/10jxNYA9mxPWQTSPEliNFrSJqMRI+7cISD4eFvmg+w7AMkfSbrq1EFgmin/OE42jkAGhoOAvJFCmNxsZXi2hM4NYmCcOHEsnBDDpqa0hLRvQoEKgOlk/m008JA9di3OuOuI17zT70lQ==';
const SERVER_URL = process.env.SERVER_URL || 'https://smartstudy-server-dlw8.vercel.app';
const isSandbox = process.env.ALIPAY_SANDBOX === 'true' || true;

let alipaySdk = null;

function normalizePrivateKey(privateKey) {
    try {
        if (!privateKey.includes('-----BEGIN')) {
            let formatted = '';
            const cleanKey = privateKey.replace(/\s+/g, '');
            for (let i = 0; i < cleanKey.length; i += 64) {
                formatted += cleanKey.substring(i, i + 64) + '\n';
            }
            privateKey = '-----BEGIN PRIVATE KEY-----\n' + formatted + '-----END PRIVATE KEY-----';
        }
        return privateKey;
    } catch (e) {
        console.error('Failed to normalize private key:', e.message);
        return privateKey;
    }
}

function getAlipaySdk() {
    if (!alipaySdk) {
        try {
            let privateKey = normalizePrivateKey(ALIPAY_PRIVATE_KEY);
            alipaySdk = new AlipaySdk({
                appId: ALIPAY_APP_ID,
                privateKey: privateKey,
                alipayPublicKey: ALIPAY_PUBLIC_KEY,
                gateway: isSandbox ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do',
                signType: 'RSA2',
                charset: 'utf-8'
            });
        } catch (e) {
            console.error('Failed to initialize AlipaySdk:', e.message);
            alipaySdk = null;
        }
    }
    return alipaySdk;
}

async function createAlipayOrderDirect(orderId, money, name) {
    const https = require('https');
    
    const gateway = isSandbox ? 'openapi.alipaydev.com' : 'openapi.alipay.com';
    console.log('Alipay gateway:', gateway);
    
    const params = {
        app_id: ALIPAY_APP_ID,
        method: 'alipay.trade.precreate',
        format: 'JSON',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace(/T/g, ' ').substring(0, 19),
        version: '1.0',
        notify_url: `${SERVER_URL}/api/alipay/notify`,
        biz_content: JSON.stringify({
            out_trade_no: orderId,
            total_amount: money,
            subject: name || '智学宝会员',
            timeout_express: '30m'
        })
    };
    
    console.log('Alipay params:', JSON.stringify(params, null, 2));
    
    const sortedKeys = Object.keys(params).sort();
    let signContent = '';
    for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        if (params[key]) {
            if (i > 0) signContent += '&';
            signContent += `${key}=${params[key]}`;
        }
    }
    
    console.log('Sign content length:', signContent.length);
    
    const privateKey = normalizePrivateKey(ALIPAY_PRIVATE_KEY);
    
    const sign = crypto.sign('RSA-SHA256', Buffer.from(signContent, 'utf-8'), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }).toString('base64');
    
    params.sign = sign;
    
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    console.log('Query string length:', queryString.length);
    
    return new Promise((resolve, reject) => {
        console.log('Calling Alipay API via https module...');
        
        const options = {
            hostname: gateway,
            port: 443,
            path: `/gateway.do?${queryString}`,
            method: 'GET',
            timeout: 60000,
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log('Alipay API response status:', res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Alipay API response data length:', data.length);
                try {
                    const result = JSON.parse(data);
                    console.log('Alipay API response:', JSON.stringify(result, null, 2));
                    resolve(result.alipay_trade_precreate_response || result);
                } catch (e) {
                    console.error('Failed to parse response:', e.message);
                    console.error('Raw response:', data);
                    reject(new Error('Failed to parse response: ' + data.substring(0, 500)));
                }
            });
        });
        
        req.on('error', (e) => {
            console.error('HTTPS request error:', e.message);
            reject(new Error('HTTPS request error: ' + e.message));
        });
        
        req.on('timeout', () => {
            console.error('HTTPS request timeout');
            req.destroy();
            reject(new Error('HTTPS request timeout'));
        });
        
        req.end();
    });
}

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

app.post('/api/create', async (req, res) => {
    const { name, money, type, param } = req.body;
    const orderId = generateOrderId();

    db.orders[orderId] = {
        orderId,
        name,
        money,
        type,
        param,
        status: 'pending',
        createdAt: new Date().toISOString(),
        alipayTradeNo: null
    };

    const hasAlipayConfig = !!ALIPAY_APP_ID && !!ALIPAY_PRIVATE_KEY;

    if (!hasAlipayConfig) {
        let qrBase64 = '';
        try {
            qrBase64 = fs.readFileSync(path.join(__dirname, 'qrcode_base64.txt'), 'utf8').trim();
        } catch (e) {
            console.warn('QR code file not found, using manual payment mode');
        }
        
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
        .warning { color: #f59e0b; font-size: 12px; margin-top: 10px; padding: 10px; background: #fffbeb; border-radius: 8px; }
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
        <div class="warning">⚠️ 当前未配置支付宝开放平台，使用手动收款码模式</div>
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
        return res.send(html);
    }

    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('支付宝API请求超时')), 10000)
        );
        
        const result = await Promise.race([
            createAlipayOrderDirect(orderId, money, name || '智学宝会员'),
            timeoutPromise
        ]);

        if (result.code === '10000' && (result.qr_code || result.qrCode)) {
            db.orders[orderId].alipayTradeNo = result.out_trade_no || result.outTradeNo;
            db.orders[orderId].qrCode = result.qr_code || result.qrCode;
            
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
        .qrcode { width: 250px; height: 250px; margin: 20px auto; border-radius: 12px; overflow: hidden; border: 2px solid #eee; background: white; }
        .qrcode img { width: 100%; height: 100%; object-fit: cover; }
        .tips { color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; }
        .btn-verify { background: #6366f1; color: white; border: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background 0.2s; }
        .btn-verify:hover { background: #4f46e5; }
        .status { margin-top: 15px; font-size: 14px; }
        .pending { color: #f59e0b; }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        .badge { display: inline-block; background: #22c55e; color: white; font-size: 12px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>智学宝<span class="badge">支付宝官方支付</span></h1>
        <p style="color:#666;font-size:14px;">永久解锁全部功能</p>
        <div class="price">¥${money}</div>
        <div class="qrcode">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(result.qrCode)}" alt="支付宝支付二维码">
        </div>
        <div class="tips">
            <p>请使用支付宝扫码支付</p>
            <p>支付完成后系统自动解锁</p>
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
                const resp = await fetch('/api/check-pay', {
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
                    status.textContent = '等待支付确认，请保持页面打开...';
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
        
        startPolling();
    </script>
</body>
</html>`;
            res.send(html);
        } else {
            console.error('Alipay precreate failed:', result);
            res.status(500).send('创建支付订单失败，请稍后重试');
        }
    } catch (error) {
        console.error('Alipay API error:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        res.status(503).send(`支付接口调用失败，请重试：${error.message}`);
    }
});

app.post('/api/alipay/notify', async (req, res) => {
    try {
        const params = req.body;
        
        if (!params.out_trade_no) {
            return res.send('fail');
        }

        const sdk = getAlipaySdk();
        if (!sdk) {
            console.error('Alipay SDK not initialized for notify');
            return res.send('fail');
        }
        
        const verifyResult = sdk.checkNotifySign(params);
        
        if (!verifyResult) {
            console.error('Alipay notify sign verify failed');
            return res.send('fail');
        }

        if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
            const orderId = params.out_trade_no;
            const order = db.orders[orderId];
            
            if (order && order.status !== 'paid') {
                db.orders[orderId].status = 'paid';
                db.orders[orderId].alipayTradeNo = params.trade_no;
                db.orders[orderId].paidAt = new Date().toISOString();
                
                db.licenses[order.param] = {
                    activatedAt: new Date().toISOString(),
                    orderId,
                    alipayTradeNo: params.trade_no
                };
                
                console.log(`Payment successful: ${orderId} - ¥${order.money}`);
            }
        }
        
        res.send('success');
    } catch (error) {
        console.error('Alipay notify error:', error);
        res.send('fail');
    }
});

app.post('/api/verify', (req, res) => {
    const { orderId, deviceId } = req.body;
    
    const order = db.orders[orderId];
    
    if (!order) {
        return res.json({ success: false, message: '订单不存在' });
    }

    if (process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY) {
        return res.json({ success: false, message: '等待支付宝回调确认支付' });
    }

    db.orders[orderId].status = 'paid';
    db.licenses[deviceId] = {
        activatedAt: new Date().toISOString(),
        orderId
    };
    
    res.json({ success: true, message: '支付确认成功' });
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
    
    res.json({ success: false, message: '待支付确认' });
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
        .config-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #0369a1; font-size: 14px; }
        .config-warning { background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #92400e; font-size: 14px; }
    </style>
</head>
<body>
    <h1>智学宝 - 支付订单管理</h1>
    ${process.env.ALIPAY_APP_ID ? 
        '<div class="config-info">✅ 支付宝开放平台已配置</div>' : 
        '<div class="config-warning">⚠️ 未配置支付宝开放平台，使用手动收款码模式</div>'}
    <table>
        <thead>
            <tr>
                <th>订单号</th>
                <th>金额</th>
                <th>设备ID</th>
                <th>支付宝交易号</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>`;
    
    if (orders.length === 0) {
        html += `<tr><td colspan="7" class="empty">暂无订单</td></tr>`;
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
                <td>${order.alipayTradeNo || '-'}</td>
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
    let alipayStatus = '❌ 未配置';
    try {
        if (ALIPAY_APP_ID && ALIPAY_PRIVATE_KEY) {
            const testSdk = getAlipaySdk();
            alipayStatus = testSdk ? '✅ 已配置' : '❌ 配置无效';
        }
    } catch (e) {
        alipayStatus = '❌ 配置错误: ' + e.message;
    }
    res.send(`智学宝支付服务器 - 运行正常<br>支付宝开放平台: ${alipayStatus}`);
});

app.listen(PORT, () => {
    const hasAlipayConfig = !!(ALIPAY_APP_ID && ALIPAY_PRIVATE_KEY);
    console.log(`Server running on port ${PORT}`);
    console.log(`Alipay Open Platform: ${hasAlipayConfig ? '✅ Configured' : '❌ Not configured - using manual QR code mode'}`);
});