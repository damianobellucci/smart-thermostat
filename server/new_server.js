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
        axios.post("http://192.168.1.30:80/setparameters", params, configHeaders)
            .then((result) => {
                res.status(204).send()
            })
            .catch((err) => {
                res.status(502).send({ error: "The parameters have not been set. Impossible to reach..." })
            })
    }
});


app.listen(PORT, () => {
    console.log("listening port ", PORT)
})



