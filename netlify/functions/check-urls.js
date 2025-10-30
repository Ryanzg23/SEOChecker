const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { urls } = JSON.parse(event.body);
    if (!urls || !Array.isArray(urls)) {
      return { statusCode: 400, body: "Invalid request" };
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const results = [];

    for (let url of urls) {
      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const data = await page.evaluate(() => {
          return {
            title: document.querySelector('title')?.innerText || "",
            description: document.querySelector('meta[name="description"]')?.content || "",
            canonical: document.querySelector('link[rel="canonical"]')?.href || "",
            amphtml: document.querySelector('link[rel="amphtml"]')?.href || "",
            robots: document.querySelector('meta[name="robots"]')?.content || ""
          };
        });

        results.push({ url, ...data });
        await page.close();
      } catch (err) {
        results.push({ url, title: "Error", description: "", canonical: "", amphtml: "", robots: "" });
      }
    }

    await browser.close();
    return { statusCode: 200, body: JSON.stringify(results) };

  } catch (err) {
    return { statusCode: 500, body: "Server error: " + err.message };
  }
};
