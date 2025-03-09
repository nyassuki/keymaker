const puppeteer = require('puppeteer');
const fs = require('fs');


main();

async function main() {
	for (page=1; page <=100; page++) {
		console.log(`Page ${page}`)
		const url = `https://privatekeys.pw/richest/bitcoin?page=${page}`;
		await getFile(url);
	}
}

async  function getFile(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Block images and CSS to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
    // Increase timeout and wait for full network activity
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Extract the desired column (e.g., "Address")
    const addresses = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('table tbody tr td:nth-child(2)')) // Select the 2nd column (Adjust if needed)
            .map(td => td.innerText.trim()) // Extract text
            .filter(text => text.length > 0); // Remove empty entries
    });

    // Save as JSON
    fs.appendFileSync('addresses.json', JSON.stringify(addresses, null, 2), 'utf8');
    // Save as TXT
 
    console.log('Addresses saved to addresses.json and addresses.txt');
    await browser.close();
};
