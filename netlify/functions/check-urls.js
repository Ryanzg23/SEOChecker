const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { urls } = JSON.parse(event.body);
    if (!urls || !Array.isArray(urls)) {
      return { statusCode: 400, body: "Invalid request" };
    }

    const results = await Promise.all(urls.map(async (url) => {
      try {
        const res = await fetch(url);
        const html = await res.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        return {
          url,
          title: doc.querySelector("title")?.textContent || "",
          description: doc.querySelector('meta[name="description"]')?.content || "",
          canonical: doc.querySelector('link[rel="canonical"]')?.href || "",
          amphtml: doc.querySelector('link[rel="amphtml"]')?.href || "",
          robots: doc.querySelector('meta[name="robots"]')?.content || ""
        };

      } catch (err) {
        return { url, title: "Error", description: "", canonical: "", amphtml: "", robots: "" };
      }
    }));

    return { statusCode: 200, body: JSON.stringify(results) };

  } catch (err) {
    return { statusCode: 500, body: "Server error" };
  }
};
