const crypto = require('crypto');

const secretKey = 'Bunbopaymentsupersecret16032004@';
const orderId = '24f4ce65-3629-439a-8274-acd128993ed3';
const amount = 120000;
const transferAmount = 120000;
const providerTransactionId = '1234567890';
const status = 'Success';

// The exact string that C# creates: $"{request.OrderId}|{request.Amount}|{request.ProviderTransactionId}|{request.Status}"
// Since C# formatting of exactly 120000m is "120000" in string interpolation
const payloadString = `${orderId}|${amount}|${providerTransactionId}|${status}`;

const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(payloadString);
const signature = hmac.digest('hex').toLowerCase();

console.log("Mock Signature:", signature);

const webhookBody = {
    id: 1234567890,
    gateway: "MBBank",
    transactionDate: new Date().toISOString(),
    accountNumber: "1234",
    code: "00",
    content: `THANHTOAN ${orderId}`,
    transferType: "in",
    transferAmount: transferAmount,
    accumulated: 500000,
    subAccount: "",
    referenceCode: orderId,
    description: "test webhook sepay"
};

fetch('http://localhost:5006/api/payments/webhook/sepay', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature
    },
    body: JSON.stringify(webhookBody)
})
    .then(r => r.text().then(text => ({ status: r.status, text })))
    .then(result => console.log('Response:', result))
    .catch(err => console.error(err));
