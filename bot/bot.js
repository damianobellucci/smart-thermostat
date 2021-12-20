const URL_SERVER = "http://192.168.1.95:3450"

const TelegramBot = require('node-telegram-bot-api');
// replace the value below with the Telegram token you receive from @BotFather
const token = '5040146541:AAH-qPWsDsn-Z34fcaePsncU_uqOKfPSKiY';
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", console.log);

const axios = require('axios')


var lastTopic;
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
            lastTopic = null
            break;
        case ("/getstatus"):
            lastTopic = null;
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
                        "Time: " + result.data.time.hh + ":" + result.data.time.mm + ":" + result.data.time.ss + " " + result.data.time.dd + "/" + result.data.time.mm + "/" + result.data.time.yy + "\n" +
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
            lastTopic = null;
            bot.sendMessage(chatId, menuSentence + '/threshold\n/setknights\n/modifytime');
            lastTopic = "setparameters"
            break;
        case ("/threshold"):
            bot.sendMessage(chatId, 'Write a value: ');
            lastTopic = "threshold"
            break;
        case ("/setknights"):
            lastTopic = "setknights"
            bot.sendMessage(chatId, 'Write the number of the knight spaced with on/off:');
            break;
        case ("/modifytime"):
            lastTopic = "modifytime"
            bot.sendMessage(chatId, 'Add/subtract dd hh mm ss (ex: hh 2):');
            break;
        default:
            switch (lastTopic) {
                case ("modifytime"):
                    if (
                        !(() => {

                            let lst = msg.text.split(" ").filter(x => x != "" ? x : null)
                            console.log(lst.length)
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
                                lastTopic = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic = null
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
                                lastTopic = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic = null
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
                                lastTopic = null;
                            })
                            .catch(async (err) => {
                                if (err.response.data.error[0].message == undefined) {
                                    await bot.sendMessage(chatId, "Something went wrong. Request not satisfied.");
                                    defaultMenu_sentence
                                    bot.sendMessage(chatId, defaultMenu_sentence);
                                    lastTopic = null
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