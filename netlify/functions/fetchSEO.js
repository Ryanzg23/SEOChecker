// /netlify/functions/fetchSEO.js
import fetch from "node-fetch"; // Netlify Functions support this
import { JSDOM } from "jsdom";

export const handler = async (event) => {
  const { url } = JSON.parse(event.body);

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No URL provided" }),
    };
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const title = document.querySelector("title")?.textContent || "No title";
    const description = document.querySelector('meta[name="description"]')?.content || "No description";
    const canonical = document.querySelector('link[rel="canonical"]')?.href || "No canonical";
    const amp = document.querySelector('link[rel="amphtml"]')?.href || "No AMP";
    const robots = document.querySelector('meta[name="robots"]')?.content || "No robots";

    return {
      statusCode: 200,
      body: JSON.stringify({ url, title, description, canonical, amp, robots }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ url, error: err.message }),
    };
  }
};
