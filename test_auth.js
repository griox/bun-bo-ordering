async function run() {
    const loginRes = await fetch('https://bun-bo-chung-cu.io.vn/api/proxy/api/identity/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    
    if (!loginRes.ok) {
        console.error('Login failed', loginRes.status, await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    console.log('Login success');
    
    const token = loginData.token;
    
    const promoRes = await fetch('https://bun-bo-chung-cu.io.vn/api/proxy/api/promotion/points', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Promotion status:', promoRes.status);
    console.log('Promotion response:', await promoRes.text());
    
    const orderRes = await fetch('https://bun-bo-chung-cu.io.vn/api/proxy/api/orders/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Order status:', orderRes.status);
}
run();
