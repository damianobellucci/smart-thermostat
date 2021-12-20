const URL_SERVER = "http://192.168.1.95:3450"

const TelegramBot = require('node-telegram-bot-api');
// replace the value below with the Telegram token you receive from @BotFather
const token = '5040146541:AAH-qPWsDsn-Z34fcaePsncU_uqOKfPSKiY';
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", console.log);

bot.setMyCommands([
    { command: '/start', description: 'start with main menu' },
    { command: '/getstatus', description: 'get all the informations' },
    { command: '/setparameters', description: 'display all the possibilities for setting parameters' },
    { command: '/modifythreshold', description: 'modify on/off threshold' },
    { command: '/setknights', description: 'set hour knights' },
    { command: '/modifytime', description: 'shift time by adding/subtract days, hours, minutes, seconds' },
])

const axios = require('axios')


var lastTopic = {}; //hash table per tenere traccia dello stato di ogni utente, evitando sovrapposizioni
var defaultMenu = '/getstatus\n/setparameters';
var menuSentence = 'Choose between these:\n';
var defaultMenu_sentence = 'Choose between these:\n' + defaultMenu;
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    switch (msg.text) {
        case ("/start"):
            bot.sendMessage(chatId, defaultMenu_sentence);
            lastTopic[chatId] = null
            break;
        case ("/getstatus"):
            lastTopic[chatId] = null;
            params = {
                temperature: '',
                status: '',
                knights: '',
                threshold: '',
                time: ''
            }
            axios(
                {
                    method: "get",
                    url: URL_SERVER + "/currentstate",
                    params: params,
                    timeout: 10000
                }
            )
                .then(async (result) => {

                    let str_knights = "";
                    for (let [key, value] of Object.entries(result.data.knights)) {
                        str_knights = str_knights + "\n" + (() => { return key.length == 1 ? "  " + key : key })() + ": " + (() => { return value == 1 ? "      on" : "off" })()
                    }

                    let final_string =
                        "Temperature: " + result.data.temperature + " °C" + "\n" +
                        "Status: " + (() => { return result.data.status == 1 ? "on" : "off" })() + "\n" +
                        "Threshold: " + result.data.threshold + " °C" + "\n" +
                        "Time: " + result.data.time.hh + ":" + result.data.time.mm + ":" + result.data.time.ss + " " + result.data.time.dd + "/" + result.data.time.mo + "/" + result.data.time.yy + "\n" +
                        "Knights: " + str_knights

                    await bot.sendMessage(chatId, final_string);
                    bot.sendMessage(chatId, defaultMenu_sentence);

                })
                .catch(async (err) => {
                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                    bot.sendMessage(chatId, defaultMenu_sentence);

                })

            break;
        case ("/setparameters"):
            lastTopic[chatId] = null;
            bot.sendMessage(chatId, menuSentence + '/modifythreshold\n/setknights\n/modifytime' + "\n\n Or return to default menu:\n /start");
            lastTopic[chatId] = "setparameters"
            break;
        case ("/modifythreshold"):
            bot.sendMessage(chatId, 'Write a value: ');
            lastTopic[chatId] = "threshold"
            break;
        case ("/setknights"):
            lastTopic[chatId] = "setknights"
            bot.sendMessage(chatId, 'Write the number of the knight spaced with on/off:');
            break;
        case ("/modifytime"):
            lastTopic[chatId] = "modifytime"
            bot.sendMessage(chatId, 'Add/subtract dd hh mm ss (ex: hh 2):');
            break;
        default:
            switch (lastTopic[chatId]) {
                case ("modifytime"):
                    if (
                        !(() => {

                            let lst = msg.text.split(" ").filter(x => x != "" ? x : null)
                            return lst.length == 2 && ['hh', 'dd', 'mm', 'ss'].includes(lst[0]) && !isNaN(lst[1])
                        })()
                    ) {
                        bot.sendMessage(chatId, "Invalid input (ex: hh 1). Retry: ");
                    }
                    else {
                        let lst = msg.text.split(" ").filter(x => x != "" ? x : null)
                        let body = {};
                        body[lst[0]] = parseInt(lst[1])

                        axios(
                            {
                                method: 'post',
                                url: URL_SERVER + "/setparameters",
                                data: body,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                timeout: 10000 //timeout in milliseconds
                            }
                        )
                            .then(async (result) => {
                                await bot.sendMessage(chatId, 'New setting is ok.');
                                bot.sendMessage(chatId, defaultMenu_sentence);
                                lastTopic[chatId] = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic[chatId] = null
                                }
                                else {
                                    bot.sendMessage(chatId, "The value " + err.response.data.error[0].message + ". Retry:");
                                }
                            })
                    }
                    break;
                case ("setknights"):
                    if (
                        !(() => {
                            let lst = msg.text.split(" ").filter(x => x != "" ? x : null)
                            return lst.length < 3 && !isNaN(lst[0]) && (lst[1] == "off" || lst[1] == "on")
                        })()
                    ) {
                        bot.sendMessage(chatId, "Invalid input (ex: 21 on). Retry: ");
                    }
                    else {
                        let lst = msg.text.split(" ").filter(x => x != "" ? x : null)
                        let body = {};
                        body[lst[0]] = parseInt(lst[1] == "on" ? 1 : 0)

                        axios(
                            {
                                method: 'post',
                                url: URL_SERVER + "/setparameters",
                                data: body,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                timeout: 10000 //timeout in milliseconds
                            }
                        )
                            .then(async (result) => {
                                await bot.sendMessage(chatId, 'New setting is ok.');
                                bot.sendMessage(chatId, defaultMenu_sentence);
                                lastTopic[chatId] = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic[chatId] = null
                                }
                                else {
                                    bot.sendMessage(chatId, err.response.data.error[0].message + ". Retry:");
                                }
                            })
                    }
                    break;
                case ("threshold"):
                    if ((isNaN(msg.text))) {
                        bot.sendMessage(chatId, "Invalid. It must be a number  (ex: 23.5). Retry: ");
                    }
                    else {
                        axios(
                            {
                                method: 'post',
                                url: URL_SERVER + "/setparameters",
                                data: { "t": parseFloat(msg.text) },
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                timeout: 10000 //timeout in milliseconds
                            }
                        )
                            .then(async (result) => {
                                await bot.sendMessage(chatId, 'New setting is ok.');
                                bot.sendMessage(chatId, defaultMenu_sentence);
                                lastTopic[chatId] = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic[chatId] = null
                                }
                                else {
                                    bot.sendMessage(chatId, "The value " + err.response.data.error[0].message + ". Retry:");
                                }


                            })
                    }
                    break;
                default:
                    bot.sendMessage(chatId, 'Invalid operation. Choose between these:\n' + defaultMenu);
                    break;
            }
    }
});