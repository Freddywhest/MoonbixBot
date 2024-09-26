> [<img src="https://img.shields.io/badge/Telegram-%40Me-orange">](https://t.me/roddyfred)

# Use Node.Js 18 or later

## Functionality

| Functional                            | Supported |
| ------------------------------------- | :-------: |
| Claiming tasks                        |    ✅     |
| Claiming daily rewards                |    ✅     |
| Palying games                         |    ✅     |
| Multithreading                        |    ✅     |
| Data caching                          |    ✅     |
| Creating sessions with qrcode         |    ✅     |
| Using a session/query_id              |    ✅     |
| Binding a proxy to a session/query_id |    ✅     |
| Random sleep time between clicks      |    ✅     |

### [How to add query id](https://github.com/Freddywhest/RockyRabbitBot/blob/main/AddQueryId.md)

### [How to use python sessions with this bot](https://github.com/Freddywhest/SessionConvertor)

## [Settings](https://github.com/FreddyWhest/MoonbixBot/blob/main/.env-example)

| Settings                       | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| **API_ID / API_HASH**          | Telegram API ID and Hash obtained from my.telegram.org                     |
| **AUTO_PLAY_GAME**             | Whether the bot should play games (True / False)                           |
| **AUTO_CLAIM_TASKS**           | Whether the bot should claim tasks (True / False)                          |
| **DELAY_BETWEEN_STARTING_BOT** | Delay between bot starts (eg. [20, 30])                                    |
| **DELAY_BETWEEN_PLAYING_GAME** | Delay between starting/playing games (eg. [20, 30])                        |
| **DELAY_BETWEEN_TASKS**        | Delay between completing tasks (eg. [20, 30])                              |
| **SLEEP_BETWEEN_REQUESTS**     | Delay between taps in seconds (eg. [500, 1200])                            |
| **USE_PROXY_FROM_JS_FILE**     | Whether to use proxy from the `bot/config/proxies.js` file (True / False)  |
| **USE_PROXY_FROM_TXT_FILE**    | Whether to use proxy from the `bot/config/proxies.txt` file (True / False) |

## Installation

You can download [**Repository**](https://github.com/FreddyWhest/MoonbixBot) by cloning it to your system and installing the necessary dependencies:

```shell
~ >>> git clone https://github.com/FreddyWhest/MoonbixBot.git
~ >>> cd MoonbixBot

#Linux and MocOS
~/MoonbixBot >>> chmod +x check_node.sh
~/MoonbixBot >>> ./check_node.sh

OR

~/MoonbixBot >>> npm install
~/MoonbixBot >>> cp .env-example .env
~/MoonbixBot >>> nano .env # Here you must specify your API_ID and API_HASH , the rest is taken by default
~/MoonbixBot >>> node index.js

#Windows
1. Double click on INSTALL.bat in MoonbixBot directory to install the dependencies
2. Double click on START.bat in MoonbixBot directory to start the bot

OR

~/MoonbixBot >>> npm install
~/MoonbixBot >>> cp .env-example .env
~/MoonbixBot >>> # Specify your API_ID and API_HASH, the rest is taken by default
~/MoonbixBot >>> node index.js
```

Also for quick launch you can use arguments, for example:

```shell
~/MoonbixBot >>> node index.js --action=1

OR

~/MoonbixBot >>> node index.js --action=2 #For sessions

OR

~/MoonbixBot >>> node index.js --action=3 #For query ids

#1 - Create session
#2 - Run bot with sessions
#3 - Run bot with query ids
```
