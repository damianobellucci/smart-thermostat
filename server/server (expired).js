/*************************************************/
var fs = require('fs')
var express = require('express')
var app = express()
const PORT = 3450

currentParameters = {}

fs.readFile('./config.json', function read(err, data) {
    if (err) {
        throw err;
    }

    currentParameters = JSON.parse(data)
});



app.use(express.json());

const axios = require('axios')


const configHeaders = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000 //timeout in milliseconds
}



var stringSettingParameters;


app.post('/setparameters', function (req, res) {
    console.log(req)
    settingParameters = req.body;
    Object.keys(settingParameters).forEach((key) => {
        settingParameters[key] = settingParameters[key].toString();
    });
    console.log(settingParameters)
    console.log("arrived request: ", settingParameters)

    console.log("ciao")
    const valid = validate(settingParameters)
    if (!valid) {
        console.log(validate.errors)
        res.status(400).send({ error: validate.errors[0].message })
    }
    else {

        if (!settingParameters.hasOwnProperty("sampleFrequency") && !settingParameters.hasOwnProperty("minTemp") && !settingParameters.hasOwnProperty("maxTemp") && !settingParameters.hasOwnProperty("minMoi") && !settingParameters.hasOwnProperty("maxMoi")) {
            res.send({ error: "at least one parameter must be setted." })
        }
        else {



            if (
                (settingParameters.hasOwnProperty("sampleFrequency") && !isNumeric(settingParameters.sampleFrequency))
                ||
                (settingParameters.hasOwnProperty("minTemp") && !isNumeric(settingParameters.minTemp))
                ||
                (settingParameters.hasOwnProperty("maxTemp") && !isNumeric(settingParameters.maxTemp))
                ||
                (settingParameters.hasOwnProperty("minMoi") && !isNumeric(settingParameters.minMoi))
                ||
                (settingParameters.hasOwnProperty("maxMoi") && !isNumeric(settingParameters.maxMoi))
            ) {
                res.send({ "error": "parameters must be numbers" })
            }
            else {
                fs.readFile('./config.json', function read(err, data) {
                    if (err) {
                        throw err;
                    }
                    let fileSettingParameters = JSON.parse(data);
                    console.log("asd", fileSettingParameters)

                    //sovrascrizione parametri
                    settingParameters.hasOwnProperty("sampleFrequency") ? settingParameters.sampleFrequency = parseInt(settingParameters.sampleFrequency) : null
                    settingParameters.hasOwnProperty("minTemp") ? settingParameters.minTemp = parseInt(settingParameters.minTemp) : null
                    settingParameters.hasOwnProperty("maxTemp") ? settingParameters.maxTemp = parseInt(settingParameters.maxTemp) : null
                    settingParameters.hasOwnProperty("minMoi") ? settingParameters.minMoi = parseInt(settingParameters.minMoi) : null
                    settingParameters.hasOwnProperty("maxMoi") ? settingParameters.maxMoi = parseInt(settingParameters.maxMoi) : null

                    try {
                        list.forEach(f => {
                            console.log("aaaahhhhh")
                            f(settingParameters)
                        })
                        fs.writeFile('./temporal-config.json', JSON.stringify(settingParameters), (err) => {
                            if (err) throw err;
                            console.log('The file has been saved!');
                            string = settingParameters.sampleFrequency + ";" + settingParameters.minTemp + ";" + settingParameters.maxTemp + ";" + settingParameters.minMoi + ";" + settingParameters.maxMoi + ";";
                            stringSettingParameters = string;
                            const params = new URLSearchParams()
                            params.append('message', string)

                            axios.post("http://192.168.1.30:80/post", params, configHeaders)
                                .then((result) => {
                                    fs.readFile('./temporal-config.json', function read(err, data) {
                                        if (err) {
                                            throw err;
                                        }
                                        data = (JSON.parse(data));
                                        fs.writeFile('./config.json', JSON.stringify(data), (err) => {
                                            if (err) {
                                                throw err;
                                            }
                                            currentParameters = data
                                            console.log(result)
                                            res.status(204).send()
                                        });
                                    })
                                })
                                .catch((err) => {
                                    res.status(502).send({ error: "The parameters have not been set. Impossible to reach the smart pot" })
                                    console.log(err)
                                })
                        })

                    } catch (e) {
                        res.status(400).send({ error: e.toString() })
                    };

                });

            }
        }
    }
});



app.get('/getparameters', function (req, res) {

    fs.readFile('./config.json', function read(err, data) {
        if (err) {
            throw err;
        }
        data = (JSON.parse(data));
        console.log(data)
        final = data.sampleFrequency + ";" + data.minTemp + ";" + data.maxTemp + ";" + data.minMoi + ";" + data.maxMoi + ";";
        res.send(final);


    });

})

app.listen(PORT, () => {
    console.log("listening port ", PORT)
})


/*************************************************/
var mqtt = require('mqtt')
const IPbroker = 'mqtt://130.136.2.70:1883'
const topic_1 = 'damianobellucci/test_setting_parameters'
const options = {
    clientId: 'clientJSpub',
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    connectTimeout: 1000,
    debug: true,
    username: 'IOTuser',
    password: 'IOTuser',
    retain: true,
    qos: 2 //perché voglio che parametri di settaggio arrivino al broker senza duplicati e senza dubbio che non siano arrivati
};
var client = mqtt.connect(IPbroker, options);


client.on('connect', function () {
    console.log("mqtt connected")
})

client.on("error", function (error) {
    console.log("Mqtt error: " + error);
});


/*************************************************/

const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
    type: "object",
    properties: {
        sampleFrequency: { type: "string" },
        minTemp: { type: "string" },
        maxTemp: { type: "string" },
        minMoi: { type: "string" },
        maxMoi: { type: "string" }
    },
    additionalProperties: false,
    /*"anyOf": [
        { "required": ["sampleFrequency"] },
        { "required": ["minTemp"] },
        { "required": ["maxTemp"] },
        { "required": ["minMoi"] },
        { "required": ["maxMoi"] }
    ]*/
}

const validate = ajv.compile(schema)

function isNumeric(num) {
    return !isNaN(num)
}
/*****************/



//prendo vecchia config (da file ) e ci applico sopra quella nuova, a quella nuova applico il test e se c'è qualche errore faccio una throw
errors = {
    one: "minMoi and maxMoi values must be between zero and 100",
    two: "minMoi must be less than maxMoi",
    three: "minTemp and maxTemp values must be between -40 and 125",
    four: "minTemp must be less than maxTemp",
    five: "sampleFrequency must not be less than 100 and less than 5000",
    six: "minTemp must be less than maxTemp. Current minTemp: ",
    seven: "maxTemp must be less than minTemp. Current maxTemp: ",
    eight: "minMoi must be less than maxMoi. Current maxMoi: ",
    nine: "maxMoi must be less than minMoi. Current maxMoi: "
}

function test1(obj) {
    if (obj.minMoi < 0 || obj.minMoi > 100)
        throw (errors.one)
}

function test2(obj) {
    if (obj.minMoi > obj.maxMoi)
        throw (errors.two)
}

function test3(obj) {
    if (obj.minTemp < -40 || obj.maxTemp > 125)
        throw (errors.three)
}

function test4(obj) {
    if (obj.minTemp > obj.maxTemp)
        throw (errors.four)
}

function test5(obj) {
    if (obj.sampleFrequency < 100 || obj.sampleFrequency >= 5000)
        throw (errors.five)
}

function test6(obj) {
    if (obj.minTemp > currentParameters.maxTemp && !obj.hasOwnProperty('maxTemp')) {
        throw (errors.six + currentParameters.maxTemp)
    }
}

function test7(obj) {
    if (obj.maxTemp < currentParameters.minTemp && !obj.hasOwnProperty('minTemp')) {
        throw (errors.seven + currentParameters.minTemp)
    }
}

function test8(obj) {
    console.log("lol", obj)
    if (obj.minMoi > currentParameters.maxMoi && !obj.hasOwnProperty('maxMoi')) {
        throw (errors.eight + currentParameters.maxMoi)
    }
}

function test9(obj) {
    if (obj.maxMoi < currentParameters.minMoi && !obj.hasOwnProperty('minMoi')) {
        throw (errors.nine + currentParameters.minMoi)
    }
}




list = [test1, test2, test3, test4, test5, test6, test7, test8, test9]


//let a = { "minMoi": 1, "maxMoi": 10, "minTemp": 1, "maxTemp": 3, "sampleFrequency": 4 }



/*
if (client.connected) {
client.publish(topic_1, string.toString(), options, function (err) {
    if (err) {
        res.send(err)
        console.log(err)
    }
    else {
        console.log('-published: ', string)
        res.send({ ack: '', committedRequest: string })
    }
});
}
else {
res.send({ failed: "something wrong in the server. Try again." })
}*/