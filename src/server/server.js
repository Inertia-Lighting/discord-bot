'use strict';

//---------------------------------------------------------------------------------------------------------------//

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('../bot/discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

app.set('port', process.env.SERVER_PORT);

app.use(bodyParser.json()); // parse application/json
app.use('/', router);

router.get('/test', async (req, res) => {
    res.json({
        'message': `this is a test: ${Date.now()}`,
    });
});

//---------------------------------------------------------------------------------------------------------------//

require('./user/verify.js')(router, client);
require('./user/verified.js')(router, client);
require('./user/products/fetch.js')(router, client);
require('./user/products/buy.js')(router, client);

//---------------------------------------------------------------------------------------------------------------//

/* start the server on the port */
app.listen(app.get('port'), () => {
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`Started Bot Server On Port: ${app.get('port')}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});
