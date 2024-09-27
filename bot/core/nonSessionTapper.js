const { default: axios } = require("axios");
const logger = require("../utils/logger");
const settings = require("../config/config");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const path = require("path");
const moment = require("moment");
const _isArray = require("../utils/_isArray");
const { HttpsProxyAgent } = require("https-proxy-agent");
const Gm = require("../utils/getGamePayload");
const RDG = require("../utils/getHeaders");

class NonSessionTapper {
  constructor(query_id, query_name) {
    this.bot_name = "moonbix";
    this.session_name = query_name;
    this.query_id = query_id;
    this.session_user_agents = this.#load_session_data();
    this.headers = {};
    this.api = new ApiRequest(this.session_name, this.bot_name);
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
      return {
        queryString: this.query_id,
        socialType: "telegram",
      };
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
      );
      throw error;
    } finally {
      await sleep(1);
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
    let sleep_headers;

    if (_.isEmpty(this.headers)) {
      this.headers = new RDG().genRnd(this.#get_user_agent());
      sleep_headers = _.floor(_.now() / 1_000) + 2000;
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
          if (_.gt(currentTime, sleep_headers)) {
            this.headers = new RDG().genRnd(this.#get_user_agent());
            http_client.defaults.headers = this.headers;
          }
          const tg_web_data = await this.#get_tg_web_data();
          if (_.isEmpty(tg_web_data)) {
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
          const access_token = await this.api.get_access_token(
            http_client,
            tg_web_data
          );

          http_client.defaults.headers["X-Growth-Token"] =
            access_token?.accessToken;

          access_token_created_time = _.add(currentTime, 28_780);
          sleep_headers = _.add(currentTime, 28_770);
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

        //Claim tasks
        task_data = await this.api.get_tasks_data(http_client, resourceId);

        if (_.isEmpty(user_data) || _.isEmpty(user_data?.metaInfo)) {
          await sleep(_.random(5, 20));
          continue;
        }

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
module.exports = NonSessionTapper;
