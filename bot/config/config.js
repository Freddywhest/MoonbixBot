const _isArray = require("../utils/_isArray");

require("dotenv").config();
const settings = {
  API_ID:
    process.env.API_ID && /^\d+$/.test(process.env.API_ID)
      ? parseInt(process.env.API_ID)
      : process.env.API_ID && !/^\d+$/.test(process.env.API_ID)
      ? "N/A"
      : undefined,
  API_HASH: process.env.API_HASH || "",

  AUTO_PLAY_GAME: process.env.AUTO_PLAY_GAME
    ? process.env.AUTO_PLAY_GAME.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_TASKS: process.env.AUTO_CLAIM_TASKS
    ? process.env.AUTO_CLAIM_TASKS.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_REQUESTS:
    process.env.SLEEP_BETWEEN_REQUESTS &&
    _isArray(process.env.SLEEP_BETWEEN_REQUESTS)
      ? JSON.parse(process.env.SLEEP_BETWEEN_REQUESTS)
      : process.env.SLEEP_BETWEEN_REQUESTS &&
        /^\d+$/.test(process.env.SLEEP_BETWEEN_REQUESTS)
      ? parseInt(process.env.SLEEP_BETWEEN_REQUESTS)
      : [1000, 2000],

  DELAY_BETWEEN_STARTING_BOT:
    process.env.DELAY_BETWEEN_STARTING_BOT &&
    _isArray(process.env.DELAY_BETWEEN_STARTING_BOT)
      ? JSON.parse(process.env.DELAY_BETWEEN_STARTING_BOT)
      : [10, 50],

  DELAY_BETWEEN_PLAYING_GAME:
    process.env.DELAY_BETWEEN_PLAYING_GAME &&
    _isArray(process.env.DELAY_BETWEEN_PLAYING_GAME)
      ? JSON.parse(process.env.DELAY_BETWEEN_PLAYING_GAME)
      : [10, 50],

  DELAY_BETWEEN_TASKS:
    process.env.DELAY_BETWEEN_TASKS && _isArray(process.env.DELAY_BETWEEN_TASKS)
      ? JSON.parse(process.env.DELAY_BETWEEN_TASKS)
      : [10, 50],

  USE_PROXY_FROM_JS_FILE: process.env.USE_PROXY_FROM_JS_FILE
    ? process.env.USE_PROXY_FROM_JS_FILE.toLowerCase() === "true"
    : false,

  USE_PROXY_FROM_TXT_FILE: process.env.USE_PROXY_FROM_TXT_FILE
    ? process.env.USE_PROXY_FROM_TXT_FILE.toLowerCase() === "true"
    : false,
};

module.exports = settings;
