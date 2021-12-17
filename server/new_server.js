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

const schema_setparameters = {
    type: "object",
    properties: {
        k1: { type: "integer", minimum: 0, exclusiveMaximum: 2 },
        k2: { type: "integer", minimum: 0, exclusiveMaximum: 2 },
        k3: { type: "integer", minimum: 0, exclusiveMaximum: 2 },
        threshold: { type: "number" },
    },
    additionalProperties: false,
    minProperties: 1
}

const validate_setparameters = ajv.compile(schema_setparameters)
/****************************/


app.post('/setparameters', function (req, res) {
    if (!validate_setparameters(req.body)) {
        res.status(400).send({ error: validate_setparameters.errors[0].message })
    }
    else {
        const params = new URLSearchParams()
        for (let [key, value] of Object.entries(req.body)) {
            params.append(key, JSON.stringify(value))
        }
        res.send("ok")
    }
    /*
        axios.post("http://192.168.1.30:80/setparameters", params, configHeaders)
            .then((result) => {
                res.status(204).send()
            })
            .catch((err) => {
                res.status(502).send({ error: "The parameters have not been set. Impossible to reach..." })
                console.log(err)
            })
    }*/
});


app.listen(PORT, () => {
    console.log("listening port ", PORT)
})



