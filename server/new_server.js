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
            "1": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "2": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "3": { type: "integer", minimum: 0, exclusiveMaximum: 2 },
            "t": { type: "number" },
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
        },
        additionalProperties: false,
        minProperties: 1,
        maxProperties: 4
    }
)
/****************************/

app.post('/setparameters', function (req, res) {
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
                res.status(204)
            })
            .catch((err) => {
                res.status(502).send({ error: "The parameters have not been set. Impossible to reach..." })
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
        else obj[el[0]] = Number(el[1])
    }
    return obj
}

app.get('/currentstate', function (req, res) {
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



