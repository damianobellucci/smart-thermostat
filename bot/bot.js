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

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    switch (msg.text) {
        case ("/start"):
            bot.sendMessage(chatId, '/getstatus\n/setparameters');
            lastTopic = "start"
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
                .then((result) => {
                    bot.sendMessage(chatId, JSON.stringify(result.data));
                })
                .catch((err) => {

                    bot.sendMessage(chatId, "error " + err.code);
                })

            break;
        case ("/setparameters"):
            bot.sendMessage(chatId, '/threshold\n/setknights\n/modifytime');
            lastTopic = "setparameters"
            break;
        case ("/threshold"):
            bot.sendMessage(chatId, 'Write a value: ');
            lastTopic = "threshold"
            break;
        case ("/setknights"):
            lastTopic = "setknights"
            bot.sendMessage(chatId, 'Write the number of the knight spaced with on/off');
            break;
        case ("/modifytime"):
            lastTopic = "modifytime"
            bot.sendMessage(chatId, 'Write the number of the knight spaced with on/off');
            break;
        default:
            switch (lastTopic) {
                case ("setknights"):
                    break;
                case ("threshold"):
                    lastTopic = null;
                    axios(
                        {
                            method: 'post',
                            url: URL_SERVER + "/setparameters",
                            data: { "t": parseInt(msg.text) },
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: 10000 //timeout in milliseconds
                        }
                    )
                        .then((result) => {
                            bot.sendMessage(chatId, 'New setting is ok.');
                        })
                        .catch((err) => {
                            bot.sendMessage(chatId, err.response.data.error[0].message);

                        })
                    break;
                default:
                    bot.sendMessage(chatId, 'Invalid operation. Choose between these:\n' + defaultMenu);
                    break;
            }
    }
});