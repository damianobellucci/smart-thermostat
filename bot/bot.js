const axios = require('axios')
URL_SERVER = "http://192.168.1.95:3450"

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '5040146541:AAH-qPWsDsn-Z34fcaePsncU_uqOKfPSKiY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

var lastTopic;


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
            bot.sendMessage(chatId, '22');
            lastTopic = "getstatus"
            break;
        case ("/setparameters"):
            bot.sendMessage(chatId, '/threshold\n/setknights\n/modifytime');
            lastTopic = "setparameters"
            break;
        case ("/threshold"):
            bot.sendMessage(chatId, 'Write a value between 0 and 40:');
            lastTopic = "threshold"
            break;
        case ("/setknights"):
            lastTopic = "setknights"
            bot.sendMessage(chatId, 'Write the number of the knight spaced with on/off');
            break;
        default:
            switch (lastTopic) {
                case ("threshold"):
                    lastTopic = null;
                    if (!isNaN(msg.text)) {
                        console.log("ok")
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
                                if (err.response == undefined) {
                                    bot.sendMessage(chatId, err.code);
                                }
                                else bot.sendMessage(chatId, err.response.data);
                            })
                    }
                default:
                    break;
            }
    }

});