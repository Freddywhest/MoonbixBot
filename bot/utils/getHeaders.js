/**
 * Inspired by the original work of [vanhbakaa](https://github.com/vanhbakaa) in Python.
 * This code has been adapted and converted into JavaScript to fit our specific use case.
 * For more information, refer to his/her GitHub repository: https://github.com/vanhbakaa
 */

const { faker } = require("@faker-js/faker");
const c = require("crypto");
const b64 = require("base-64");
const u = require("uuid");

class RDG {
  #genFvidT(l) {
    const chrs =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const dig = "0123456789";
    const chrs1 =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let rStr = [...Array(l - 3)]
      .map(() => chrs.charAt(Math.floor(Math.random() * chrs.length)))
      .join("");

    rStr += "=";
    rStr += dig.charAt(Math.floor(Math.random() * dig.length));
    rStr += chrs1.charAt(Math.floor(Math.random() * chrs1.length));

    return rStr;
  }

  #getRes() {
    const w = Math.floor(Math.random() * (1920 - 720 + 1)) + 720;
    const h = Math.floor(Math.random() * (1080 - 720 + 1)) + 720;
    return `${w},${h}`;
  }

  #getTz() {
    const tzs = [
      "GMT+07:00",
      "GMT+05:30",
      "GMT-08:00",
      "GMT+00:00",
      "GMT+03:00",
    ];
    return tzs[Math.floor(Math.random() * tzs.length)];
  }

  #getTzOff(tz) {
    const sign = tz.includes("+") ? 1 : -1;
    const hrs = parseInt(tz.split("GMT")[1].split(":")[0]);
    return sign * hrs * 60;
  }

  #getPlugs() {
    const plugs = [
      "PDF Viewer,Chrome PDF Viewer,Chromium PDF Viewer,Microsoft Edge PDF Viewer,WebKit built-in PDF",
      "Flash,Java,Silverlight,QuickTime",
      "Chrome PDF Viewer,Widevine Content Decryption Module",
    ];
    return plugs[Math.floor(Math.random() * plugs.length)];
  }

  #getCanvC() {
    return [...Array(8)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  }

  #getFp() {
    return [...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  }

  #genRnd(userAgent) {
    const tz = this.#getTz();
    const scrRes = this.#getRes();

    return {
      screen_resolution: scrRes,
      available_screen_resolution: scrRes,
      system_version: faker.helpers.arrayElement([
        "Windows 10",
        "Windows 11",
        "Ubuntu 20.04",
      ]),
      brand_model: faker.helpers.arrayElement([
        "unknown",
        "Dell XPS 13",
        "HP Spectre",
      ]),
      system_lang: "en-EN",
      timezone: tz,
      timezoneOffset: this.#getTzOff(tz),
      user_agent: userAgent,
      list_plugin: this.#getPlugs(),
      canvas_code: this.#getCanvC(),
      webgl_vendor: faker.company.name(),
      webgl_renderer: `ANGLE (${faker.company.name()}, ${faker.company.name()} Graphics)`,
      audio: (Math.random() * (130 - 100) + 100).toFixed(2),
      platform: faker.helpers.arrayElement(["Win32", "Win64"]),
      web_timezone: faker.location.timeZone(),
      device_name: `${faker.internet.userAgent()} (Windows)`,
      fingerprint: this.#getFp(),
      device_id: "",
      related_device_ids: "",
    };
  }

  genRnd(userAgent) {
    const hdr = {
      Accept: "*/*",
      "Accept-Language": "en-US",
      "Bnc-Location": "",
      "Bnc-Uuid": "",
      Clienttype: "web",
      "Content-Type": "application/json",
      Csrftoken: "d41d8cd98f00b204e9800998ecf8427e",
      "Device-Info": "",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Priority: "u=1, i",
      "Fvideo-Id": "330a0c10361aac50ad025725adfc172d3af2489a",
      "Fvideo-Token": "",
      Lang: "en",
      Origin: "https://www.binance.com",
      Referer: "https://www.binance.com/vi/game/tg/moon-bix",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent": userAgent,
      "X-Growth-Token": "",
    };
    const bncUuid = u.v4();
    const d = this.#genRnd(userAgent);
    const jsonD = JSON.stringify(d);
    const encD = b64.encode(jsonD);
    hdr["Device-Info"] = encD;
    // Generate Fvideo-Token and Fvideo-Id
    const fvidT = this.#genFvidT(196);
    hdr["Fvideo-Id"] = c.randomBytes(20).toString("hex");
    hdr["Fvideo-Token"] = fvidT;
    // Generate a random UUID for Bnc-Uuid
    hdr["Bnc-Uuid"] = bncUuid;
    // Set the Cookie header
    hdr["Cookie"] = `theme=dark; bnc-uuid=${bncUuid};`;
    return hdr;
  }
}

module.exports = RDG;
