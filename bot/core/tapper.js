const { default: axios } = require("axios");
const logger = require("../utils/logger");
const { Api } = require("telegram");
const { HttpsProxyAgent } = require("https-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const path = require("path");
const moment = require("moment");
const _isArray = require("../utils/_isArray");
const FdyTmp = require("fdy-tmp");
const Gm = require("../utils/getGamePayload");
const RDG = require("../utils/getHeaders");

class Tapper {
  constructor(tg_client) {
    this.bot_name = "moonbix";
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = {};
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.sleep_floodwait = 0;
    this.runOnce = false;
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      const tmp = new FdyTmp({
        fileName: `${this.bot_name}.fdy.tmp`,
        tmpPath: path.join(process.cwd(), "cache/queries"),
      });
      if (tmp.hasJsonElement(this.session_name)) {
        const queryStringFromCache = tmp.getJson(this.session_name);
        if (!_.isEmpty(queryStringFromCache)) {
          if (_.isEmpty(this.headers)) {
            this.headers = await this.api.get_headers(this.#get_user_agent());
          }
          const validate_hc = axios.create({
            headers: this.headers,
            withCredentials: true,
          });

          const jsonData = {
            queryString: queryStringFromCache,
            socialType: "telegram",
          };

          const validate = await this.api.validate_query_id(
            validate_hc,
            jsonData
          );

          if (!_.isEmpty(validate) && !_.isBoolean(validate)) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔄 Getting data from cache...`
            );
            if (this.tg_client.connected) {
              await this.tg_client.disconnect();
              await this.tg_client.destroy();
            }
            await sleep(_.random(5, 7));
            return {
              fromCache: true,
              data: validate,
            };
          } else {
            tmp.deleteJsonElement(this.session_name);
          }
        }
      }
      await this.tg_client.connect();
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());

      if (!this.bot) {
        this.bot = await this.tg_client.getInputEntity(app.bot);
      }

      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: this.bot,
            limit: 10,
          })
        );
        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: this.bot,
            })
          );
        }
      }

      await sleep(_.random(3, 7));

      const result = await this.tg_client.invoke(
        new Api.messages.RequestAppWebView({
          peer: this.bot,
          app: new Api.InputBotAppShortName({
            botId: this.bot,
            shortName: "start",
          }),
          writeAllowed: true,
          platform,
          from_bot_menu: true,
          url: app.webviewUrl,
          startParam: "ref_1167045062",
        })
      );

      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💾 Storing data in cache...`
      );

      await sleep(_.random(5, 10));

      tmp
        .addJson(
          this.session_name,
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        )
        .save();

      return {
        fromCache: false,
        data: {
          queryString: decodeURIComponent(this.#clean_tg_web_data(tgWebData)),
          socialType: "telegram",
        },
      };
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      return null;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.disconnect();
        await this.tg_client.destroy();
      }
      this.runOnce = true;
      if (this.sleep_floodwait > new Date().getTime() / 1000) {
        await sleep(this.sleep_floodwait - new Date().getTime() / 1000);
        return await this.#get_tg_web_data();
      }
      await sleep(3);
    }
  }

  async #check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;
    let resource_data;
    let user_data;
    let task_data;
    let once = false;

    if (_.isEmpty(this.headers)) {
      this.headers = new RDG().genRnd(this.#get_user_agent());
    }

    if (
      (settings.USE_PROXY_FROM_TXT_FILE || settings.USE_PROXY_FROM_JS_FILE) &&
      proxy
    ) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }

    while (true) {
      try {
        const currentTime = _.floor(_.now() / 1_000);
        if (_.lte(access_token_created_time, currentTime)) {
          const tg_web_data = await this.#get_tg_web_data();
          if (_.isEmpty(tg_web_data) || _.isEmpty(tg_web_data?.data)) {
            continue;
          }
          if (!once) {
            const check_eligibility = await this.api.check_eligibility(
              http_client
            );
            if (!_.isEmpty(check_eligibility)) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⌛ Checking first eligibility for Binance Moonbix game...`
              );
              await sleep(_.random(2, 6));
              if (check_eligibility?.passed == false) {
                logger.error(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Eligible: ❌`
                );
                process.exit(1);
              } else {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Eligible: ✅`
                );
              }
            }
          }
          let access_token;
          if (tg_web_data.fromCache == true && !_.isEmpty(tg_web_data?.data)) {
            access_token = tg_web_data.data;
          } else if (tg_web_data?.fromCache == false) {
            access_token = await this.api.get_access_token(
              http_client,
              tg_web_data?.data
            );
          }

          if (_.isEmpty(access_token)) {
            continue;
          }

          http_client.defaults.headers["X-Growth-Token"] =
            access_token?.accessToken;

          access_token_created_time = _.add(currentTime, 28_780);
          await sleep(_.random(5, 10));
        }

        resource_data = await this.api.get_resource_single_data(http_client);

        if (
          _.isEmpty(resource_data) ||
          _.isUndefined(resource_data?.id) ||
          _.isUndefined(resource_data?.status) ||
          _.isNull(resource_data?.id) ||
          _.isNull(resource_data?.status)
        ) {
          await sleep(_.random(10, 20));
          continue;
        }

        await sleep(_.random(5, 10));

        if (resource_data?.status?.toUpperCase() !== "PUBLISHED") {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game is not yet published`
          );
          continue;
        }

        const resourceId = resource_data?.id;
        if (!once) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⌛ Checking final eligibility for Binance Moonbix game...`
          );
        }

        user_data = await this.api.get_user_data(http_client, resourceId);

        if (_.isNull(user_data?.userId) && user_data?.participated == false) {
          await this.api.create_referral(http_client, resourceId);
          await this.api.participating(http_client, resourceId);
          continue;
        }

        if (_.isEmpty(user_data) || _.isEmpty(user_data?.metaInfo)) {
          await sleep(_.random(5, 20));
          continue;
        }

        //Claim tasks
        task_data = await this.api.get_tasks_data(http_client, resourceId);

        if (!once) {
          await sleep(_.random(3, 8));
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Qualified: ${
              user_data?.qualified == true ? "✅" : "❌"
            } | RiskPassed: ${user_data?.riskPassed == true ? "✅" : "❌"}`
          );
        }

        await sleep(_.random(1, 3));

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💰 Balance: <lb>${user_data?.metaInfo?.totalGrade}</lb> | Total Games Played: <pi>${user_data?.metaInfo?.consumedAttempts}</pi> | Total Games: <vo>${user_data?.metaInfo?.totalAttempts}</vo>`
        );

        await sleep(_.random(1, 2));

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | 💰 Earnings from referrals: <bl>${
            user_data?.metaInfo?.referralTotalGrade &&
            user_data?.metaInfo?.referralTotalGrade > 0
              ? user_data?.metaInfo?.referralTotalGrade
              : 0
          }</bl>`
        );

        await sleep(_.random(2, 4));
        if (!_.isEmpty(task_data?.data?.[0]?.taskList)) {
          const loginTask = task_data?.data[0]?.taskList?.data?.find(
            (task) => task.type === "LOGIN"
          );

          if (
            !_.isEmpty(loginTask) &&
            moment(loginTask?.startTime).isBefore(moment(), "day")
          ) {
            const claim_daily = await this.api.claim_tasks(
              http_client,
              loginTask?.resourceId
            );
            if (!_.isEmpty(claim_daily)) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed daily login reward`
              );
            }

            task_data = await this.api.get_tasks_data(http_client, resourceId);
          }
        }

        if (
          !_.isEmpty(task_data?.data?.[0]?.taskList) &&
          settings.AUTO_CLAIM_TASKS
        ) {
          const filteredTasks = task_data?.data[0]?.taskList?.data?.filter(
            (task) =>
              task.status === "IN_PROGRESS" &&
              task.type !== "THIRD_PARTY_BIND" &&
              task.type !== "LOGIN"
          );

          if (!_.isEmpty(filteredTasks) && _.size(filteredTasks) > 0) {
            for (const task of filteredTasks) {
              const sleep_tasks = _.random(
                settings.DELAY_BETWEEN_TASKS[0],
                settings.DELAY_BETWEEN_TASKS[1]
              );
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${sleep_tasks} seconds before claiming ${task?.type} tasks...`
              );
              const claim_task = await this.api.claim_tasks(
                http_client,
                task?.resourceId
              );
              if (!_.isEmpty(claim_task)) {
                await sleep(_.random(2, 4));
                logger.success(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed task: <la>${task?.type}</la> | Reward: <lb>${task?.rewardList?.[0]?.amount}</lb>`
                );
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to claim task: <la>${task?.type}</la>`
                );
              }
            }
            task_data = await this.api.get_tasks_data(http_client, resourceId);
          }
        }

        await sleep(_.random(3, 5));

        //Games
        if (settings.AUTO_PLAY_GAME) {
          while (
            _.isInteger(user_data?.metaInfo?.consumedAttempts) &&
            _.isInteger(user_data?.metaInfo?.totalAttempts) &&
            _.lt(
              user_data?.metaInfo?.consumedAttempts,
              user_data?.metaInfo?.totalAttempts
            )
          ) {
            const gameSleep = _.random(
              settings.DELAY_BETWEEN_PLAYING_GAME[0],
              settings.DELAY_BETWEEN_PLAYING_GAME[1]
            );
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⌛ Sleeping for ${gameSleep} seconds before starting game...`
            );
            await sleep(gameSleep);
            const start_game = await this.api.start_game(
              http_client,
              resourceId
            );

            if (
              !_.isEmpty(start_game) &&
              !_.isUndefined(start_game?.gameTag) &&
              !_.isEmpty(start_game?.cryptoMinerConfig?.itemSettingList)
            ) {
              const gameTag = start_game?.gameTag;
              logger.success(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎮 Started game | GameTag: <la>${gameTag}</la> | Duration: <pi>45 seconds</pi>`
              );
              await sleep(45);
              const gp = await new Gm(
                start_game,
                this.session_name,
                this.bot_name
              ).play();

              if (!_.isEmpty(gp)) {
                const complete_game = await this.api.complete_game(
                  http_client,
                  {
                    resourceId,
                    payload: gp.payload,
                    log: gp.log,
                  }
                );

                if (
                  !_.isEmpty(complete_game) &&
                  complete_game?.success == true
                ) {
                  logger.success(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎯 Game completed | Reward: <gr>${gp.log}</gr> | GameTag: <la>${gameTag}</la>`
                  );
                } else {
                  logger.warning(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to complete game | GameTag: <la>${gameTag}</la>`
                  );
                }
              } else {
                logger.warning(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to get payload | GameTag: <la>${gameTag}</la>`
                );
              }
            } else {
              logger.warning(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Failed to start game`
              );
            }

            user_data = await this.api.get_user_data(http_client, resourceId);

            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | 💰 Balance: <lb>${
                user_data?.metaInfo?.totalGrade
              }</lb> | Total Games Avalaible: <pi>${_.subtract(
                user_data?.metaInfo?.totalAttempts,
                user_data?.metaInfo?.consumedAttempts
              )}</pi>`
            );
          }
        }

        if (
          _.gte(
            user_data?.metaInfo?.consumedAttempts,
            user_data?.metaInfo?.totalAttempts
          )
        ) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${
              this.session_name
            } | All games completed | Total Games Played: <pi>${_.subtract(
              user_data?.metaInfo?.totalAttempts
            )}</pi>`
          );
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        let ran_sleep;
        once = true;
        if (_isArray(settings.SLEEP_BETWEEN_REQUESTS)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_REQUESTS[0],
              settings.SLEEP_BETWEEN_REQUESTS[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_REQUESTS)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_REQUESTS + ran_add;
        } else {
          ran_sleep = _.random(450, 800);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
        );
        await sleep(ran_sleep);
      }
    }
  }
}
module.exports = Tapper;
