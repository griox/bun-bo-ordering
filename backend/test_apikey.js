const orderId = '24f4ce65-3629-439a-8274-acd128993ed3';
const apiKey = 'Bunbopaymentsupersecret16032004@';

const webhookBody = {
    id: 1234567891,
    gateway: "MBBank",
    transactionDate: new Date().toISOString(),
    accountNumber: "1234",
    code: "00",
    content: `SEVQR 2Bun Bo Hue 1Coca-Cola Ban 1 ${orderId}`,
    transferType: "in",
    transferAmount: 120000,
    accumulated: 620000,
    subAccount: "",
    referenceCode: orderId,
    description: "test webhook apikey"
};

console.log("Testing with Authorization: Apikey header...");

fetch('http://localhost:8000/api/payments/webhook/sepay', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${apiKey}`
    },
    body: JSON.stringify(webhookBody)
})
    .then(r => r.text().then(text => ({ status: r.status, text })))
    .then(result => console.log('Response:', result))
    .catch(err => console.error(err));
