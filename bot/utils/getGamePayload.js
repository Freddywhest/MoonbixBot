const _ = require("lodash");
const CryptoJS = require("crypto-js");
const logger = require("./logger");

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

  #rndDtTp(et, tp, sz, pts, py) {
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

  async play() {
    try {
      const et = Date.now() + 45000;
      const rt = Math.floor(Math.random() * 13) + 3;
      let to = 0;

      const gk = this.#gr.gameTag;
      const ot = {
        c: {}, // coin
        t: {}, // trap
        b: "", // bonus
      };

      for (const o of this.#gr.cryptoMinerConfig.itemSettingList) {
        to += o.quantity;
        if (o.type === "BONUS") {
          ot.b = `${o.rewardValueList[0]},${o.size}`;
        } else {
          for (const rv of o.rewardValueList) {
            if (parseInt(rv) > 0) {
              ot.c[rv] = `${o.size},${o.quantity}`;
            } else {
              ot.t[Math.abs(parseInt(rv))] = `${o.size},${o.quantity}`;
            }
          }
        }
      }

      const limit = Math.min(to, rt);
      let rpt = Math.floor(Math.random() * limit) + 1;
      if (rpt < 4) {
        rpt = 4;
      }

      let pb = false;
      let p = 0;
      let gdp = [];
      let sc = 0;

      let py = [];
      for (let i = 0; i < rpt + 5; i++) {
        py.push(Math.random() * 300 + 250);
      }

      py.sort((a, b) => a - b);
      for (let i = 1; i < py.length; i++) {
        if (py[i] - py[i - 1] < 40) {
          py[i] += Math.floor(Math.random() * 16) + 40;
        }
      }

      let tt = 0;

      while (et > Date.now() && p < rpt) {
        this.rs = Math.floor(Math.random() * 1501) + 2500;
        const rr = Math.floor(Math.random() * 100) + 1;

        if (rr <= 20 && Object.keys(ot.t).length > 0) {
          p++;
          const rd = Object.keys(ot.t)[
            Math.floor(Math.random() * Object.keys(ot.t).length)
          ];
          let [sz, qt] = ot.t[rd].split(",");
          qt = parseInt(qt);

          if (qt > 0) {
            const dt = this.#rndDtTp(et, 0, parseInt(sz), 0, py[tt]);

            if (dt !== null) {
              tt++;
              sc = Math.max(0, sc - parseInt(rd));
              gdp.push(dt);
              if (qt - 1 > 0) {
                ot.t[rd] = `${sz},${qt - 1}`;
              } else {
                delete ot.t[rd];
              }
            } else {
              break;
            }
          }
        } else if (rr > 20 && rr <= 70 && Object.keys(ot.c).length > 0) {
          p++;
          const rd = Object.keys(ot.c)[
            Math.floor(Math.random() * Object.keys(ot.c).length)
          ];
          let [sz, qt] = ot.c[rd].split(",");
          qt = parseInt(qt);

          if (qt > 0) {
            const dt = this.#rndDtTp(et, 1, parseInt(sz), 0, py[tt]);

            if (dt !== null) {
              tt++;
              sc += parseInt(rd);
              gdp.push(dt);
              if (qt - 1 > 0) {
                ot.c[rd] = `${sz},${qt - 1}`;
              } else {
                delete ot.c[rd];
              }
            } else {
              break;
            }
          }
        } else if (rr > 70 && rr <= 100 && !pb) {
          p++;
          const [pts, sz] = ot.b.split(",");
          const dt = this.#rndDtTp(et, 2, parseInt(sz), parseInt(pts), py[tt]);

          if (dt !== null) {
            tt++;
            pb = true;
            sc += parseInt(pts);
            gdp.push(dt);
          }
        }

        this.currTime += this.rs;
      }

      if (gdp.length > 0) {
        const dpl = gdp.join(";");
        const gp = this.#enc(dpl, gk);
        return {
          payload: gp,
          log: sc,
          debug: dpl,
        };
      } else {
        logger.error(
          `<ye>[${this.#bn}]</ye> | ${
            this.#sn
          } | Error while trying to get game data: Game data is empty`
        );
        return false;
      }
    } catch (error) {
      logger.error(
        `<ye>[${this.#bn}]</ye> | ${
          this.#sn
        } | Unknown error while trying to get game data: ${error.message}`
      );
      return false;
    }
  }
}

module.exports = Gm;
