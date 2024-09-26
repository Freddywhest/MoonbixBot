const puppeteer = require("puppeteer");

async function gh(ua) {
  const br = await puppeteer.launch({
    headless: "shell",
  });

  const pg = await br.newPage();
  await pg.setRequestInterception(true);

  let hdrs = {};

  await pg.setExtraHTTPHeaders({
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": pu(ua).os,
    "Sec-CH-UA": `"Chromium";v="${pu(ua).cv}", "Not;A=Brand";v="${
      Math.random() * 1000
    }", "${pu(ua).os} WebView";v="${pu(ua).cv}"`,
    "x-requested-with": "org.telegram.messenger",
  });

  await pg.setUserAgent(ua);

  pg.on("request", (rq) => {
    const url = rq.url();
    const hdrsM = rq.headers();

    if (url.includes("/web/commonConfig")) {
      hdrs = hdrsM;
      rq.continue();
    } else {
      rq.continue();
    }
  });

  await pg.goto("https://www.binance.com/en/game/tg/moon-bix", {
    waitUntil: "networkidle2",
  });

  await new Promise((r) => setTimeout(r, 2000));

  await br.close();

  return hdrs;
}

function pu(ua) {
  const crRe = /Chrome\/([0-9.]+)/;
  const crMt = ua.match(crRe);

  let os = gp(ua);

  const cv = crMt ? crMt[1] : "Unknown version";

  return {
    os,
    cv,
  };
}

function gp(ua) {
  const pp = [
    { pattern: /iPhone/i, platform: "IOS" },
    { pattern: /Android/i, platform: "Android" },
    { pattern: /iPad/i, platform: "IOS" },
  ];

  for (const { pattern, platform } of pp) {
    if (pattern.test(ua)) {
      return platform;
    }
  }

  return "Unknown";
}

module.exports = gh;
