const puppeteer = require('puppeteer');

async function testBrowser() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('SignalR')) {
            console.log(`[Browser Msg] ${msg.text()}`);
        }
    });
    
    // Capture failed network requests
    page.on('requestfailed', request => {
        console.error(`[Network Failed] ${request.url()} - ${request.failure().errorText}`);
    });

    console.log("Navigating to http://localhost:3000 ...");
    await page.goto("http://localhost:3000", { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 8000));
    await browser.close();
}

testBrowser().catch(console.error);
