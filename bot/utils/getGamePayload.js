const _ = require("lodash");
const CryptoJS = require("crypto-js");
const logger = require("./logger");
const sleep = require("./sleep");

class Gm {
  #gr;
  #sn;
  #ct;
  #vs;
  #bn;
  constructor(gr, sn, bn) {
    this.#gr = gr;
    this.#sn = sn;
    this.#ct = Date.now();
    this.#vs = 0;
    this.#bn = bn;
  }

  #rndDtTp(tp, et, sz, pts, py) {
    let pt = this.#ct + this.#vs;
    if (pt >= et) {
      pt = et - 1000;
      return null;
    }

    let hx = (Math.random() * (230 - 75) + 75).toFixed(3);
    let hy = (Math.random() * (230 - 199) + 199).toFixed(3);
    let hhx = (Math.random() * (400 - 100) + 100).toFixed(3);
    let hhy = py.toFixed(3);

    let ml = Math.pow(hhx - hx, 2);
    let m2 = Math.pow(hhy - hy, 2);
    let ca = (hx - hhx) / Math.sqrt(ml + m2);
    let ha = ca.toFixed(3);

    let it, isz, pnt;
    if (tp === 1) {
      it = 1;
      isz = sz;
      pnt = Math.floor(Math.random() * 200) + 1;
    } else if (tp === 2) {
      it = 2;
      isz = sz;
      pnt = parseInt(sz) + parseInt(pts);
    } else if (tp === 0) {
      it = 0;
      isz = sz;
      pnt = Math.floor(Math.random() * 200) + 1;
    } else {
      it = Math.floor(Math.random() * 3);
      isz = Math.floor(Math.random() * 100) + 1;
      pnt = Math.floor(Math.random() * 200) + 1;
      hhx = 0;
      hhy = 0;
    }

    return `${pt}|${hx}|${hy}|${ha}|${hhx}|${hhy}|${it}|${isz}|${pnt}`;
  }

  #enc(p, k) {
    const iv = CryptoJS.lib.WordArray.random(12); // Random IV

    const ivB64 = iv.toString(CryptoJS.enc.Base64); // Base64-encoded IV
    const ivAES = CryptoJS.enc.Utf8.parse(ivB64.substring(0, 16)); // IV for AES

    const encText = CryptoJS.AES.encrypt(p, CryptoJS.enc.Utf8.parse(k), {
      iv: ivAES,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ctB64 = encText.toString();

    const payload = ivB64 + ctB64;

    return payload;
  }

  #rndSel(isl, rlen) {
    let sel = [];
    let trapAdded = false;
    let szCnt = {};
    let itCnt = {};

    let totRw = 0;

    while (totRw < 100) {
      sel = [];
      trapAdded = false;
      szCnt = {};
      itCnt = {};

      let shuff = _.shuffle(isl);

      while (sel.length < rlen) {
        let itm = _.sample(shuff);
        const { type, size, rewardValueList, quantity } = itm;

        let itmKey = `${type}_${size}`;

        if (itCnt[itmKey] >= quantity) {
          continue;
        }

        if (type === "TRAP" && trapAdded) {
          continue;
        }

        if (szCnt[size] && szCnt[size] >= 2) {
          continue;
        }

        let rwVal = _.sample(rewardValueList);

        sel.push({
          type,
          quantity,
          size,
          rwVal,
        });

        itCnt[itmKey] = (itCnt[itmKey] || 0) + 1;
        szCnt[size] = (szCnt[size] || 0) + 1;

        if (type === "TRAP") {
          trapAdded = true;
        }
      }

      totRw = sel.reduce((sum, itm) => sum + itm.rwVal, 0);
    }
    return sel;
  }

  #getGp(isl) {
    const et = Date.now() + 45000;
    const rlen = _.random(4, 6);
    const sel = this.#rndSel(isl, rlen);

    let grw = 0;
    let py = [];
    for (let i = 0; i < rlen; i++) {
      py.push(Math.random() * (550 - 250) + 250);
    }
    py.sort((a, b) => a - b);
    for (let i = 1; i < py.length; i++) {
      if (py[i] - py[i - 1] < 40) {
        py[i] += Math.random() * (55 - 40) + 40;
      }
    }

    let gp = [];
    let ts = 0;
    for (const { type, size, rwVal, quantity } of sel) {
      if (et < this.#ct) {
        break;
      }
      this.#vs = Math.floor(Math.random() * (4000 - 2500) + 2500);
      grw += rwVal;

      gp.push(
        this.#rndDtTp(
          type == "TRAP" ? 0 : type == "BONUS" ? 2 : 1,
          et,
          size,
          type == "BONUS" ? rwVal : 0,
          py[ts]
        )
      );
      ts++;
      this.#ct += this.#vs;
    }

    return {
      gp,
      grw,
    };
  }

  async play() {
    try {
      const kfg = this.#gr.gameTag;
      const { gp, grw } = this.#getGp(
        this.#gr.cryptoMinerConfig.itemSettingList
      );

      if (gp.length > 0) {
        const dp = gp.join(";");
        const gpEnc = this.#enc(dp, kfg);
        await sleep(45, 45.07);
        return {
          payload: gpEnc,
          log: grw,
          decrypted: dp,
        };
      } else {
        logger.error(
          `<ye>[${this.#bn}]</ye> | ${
            this.#sn
          } | ⚠️ Error while generating game payload | Game payload length: <la>${
            gp.length
          }</la>`
        );
        return false;
      }
    } catch (err) {
      logger.error(
        `<ye>[${this.#bn}]</ye> | ${
          this.#sn
        } | ⚠️ Error while generating game payload: ${err.message}`
      );
      return false;
    }
  }
}

module.exports = Gm;
