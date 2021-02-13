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
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({
        'message': `this is a test: ${Date.now()}`,
    }, null, 2));
});

//---------------------------------------------------------------------------------------------------------------//

require('./v1/auth/keys/generate.js')(router, client);

require('./v1/user/blacklisted.js')(router, client);
require('./v1/user/verify.js')(router, client);
require('./v1/user/verified.js')(router, client);
require('./v1/user/products/fetch.js')(router, client);
require('./v1/user/products/purchase.js')(router, client);

//---------------------------------------------------------------------------------------------------------------//

/* start the server on the port */
app.listen(app.get('port'), () => {
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`Started Bot Server On Port: ${app.get('port')}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});
