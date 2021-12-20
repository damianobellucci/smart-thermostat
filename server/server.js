const URL_HARDWARE = "http://192.168.1.30:80"

/***********CONFIGURE CLIENT FOR INTERACTION WITH ESP32 */
const configHeaders = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000 //timeout in milliseconds
}
/*****************************************************/

const axios = require('axios')

/*********SERVER CONFIG*********/
var express = require('express')
var app = express()
const PORT = 3450
app.use(express.json());

/****************************/

/*********REQUESTS VALIDATION*********/
const Ajv = require("ajv")
const ajv = new Ajv()

const validate_setparameters = ajv.compile(
    {
        type: "object",
        properties: {
            "0": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "1": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "2": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "3": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "4": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "5": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "6": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "7": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "8": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "9": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "10": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "11": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "12": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "13": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "14": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "15": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "16": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "17": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "18": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "19": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "21": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "22": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "23": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "t": { type: "number" },

            "hh": { type: "integer", minimum: -120, exclusiveMaximum: 100 },
            "mm": { type: "integer", minimum: -100, exclusiveMaximum: 100 },
            "ss": { type: "integer", minimum: -100, exclusiveMaximum: 100 },
            "dd": { type: "integer", minimum: -365, exclusiveMaximum: 365 },


        },
        additionalProperties: false,
        minProperties: 1
    }
)

const validate_currentstate = ajv.compile(
    {
        type: "object",
        properties: {
            "temperature": { type: "string" },
            "threshold": { type: "string" },
            "status": { type: "string" },
            "knights": { type: "string" },
            "time": { type: "string" },
        },
        additionalProperties: false,
        minProperties: 1,
        maxProperties: 5
    }
)
/****************************/

app.post('/setparameters', function (req, res) {
    console.log("request POST /setparameters");
    if (!validate_setparameters(req.body)) {
        res.status(400).send({ error: validate_setparameters.errors })
    }
    else {
        const params = new URLSearchParams()
        for (let [key, value] of Object.entries(req.body)) {
            params.append(key, value)
        }
        axios(
            {
                method: 'post',
                url: URL_HARDWARE + "/setparameters",
                data: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000 //timeout in milliseconds
            }
        )
            .then((result) => {
                res.status(204).send()
            })
            .catch((err) => {
                if (err.response == undefined) res.status(503).send({ error: err.code })
                else res.status(err.response.status).send({ error: err.response.data })
            })
    }
});

function parseDataCurrentState(data) {
    let obj = {}
    for (const element of data.split(";").slice(0, -1)) {
        let el = element.split(":")
        if (el[0] == "knights") {
            let list = el[1].split(",")
            let obj_knights = {}
            for (let i = 0; i < list.length; i++) {
                obj_knights[i] = Number(list[i])
            }
            obj[el[0]] = obj_knights
        }
        else if (el[0] == "time") {
            let list = el[1].split(",")
            let obj_time = {}

            obj_time["hh"] = Number(list[0])
            obj_time["mm"] = Number(list[1])
            obj_time["ss"] = Number(list[2])
            obj_time["dd"] = Number(list[3])
            obj_time["mo"] = Number(list[4])
            obj_time["yy"] = Number(list[5])

            obj[el[0]] = obj_time
        }
        else obj[el[0]] = Number(el[1])
    }
    return obj
}

app.get('/currentstate', function (req, res) {
    console.log("request GET /currentstate");
    if (!validate_currentstate(req.query)) {
        res.status(400).send({ error: validate_currentstate.errors })
    }

    else {
        axios(
            {
                method: "get",
                url: URL_HARDWARE + "/currentstate",
                params: req.query,
                timeout: 10000
            }
        )
            .then((result) => {
                res.status(200).send(parseDataCurrentState(result.data))
            })
            .catch((err) => {
                res.status(502).send({ error: err.code })
            })
    }
});


app.listen(PORT, () => {
    console.log("listening port ", PORT)
})



