'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
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

//---------------------------------------------------------------------------------------------------------------//

/* request logging */
router.use(async (req, res, next) => {
    const request_timestamp = moment().tz('America/New_York').format('YYYY[-]MM[-]DD hh:mm:ss A [GMT]ZZ');
    const request_origin = (req.header('x-forwarded-for') || req.connection.remoteAddress).split(', ')[0];
    console.info(
        `${request_timestamp} | ${req.method} ${req.url} | ${request_origin}`,
        (process.env.SERVER_ADVANCED_LOGGING === 'enabled' ? {
            'req.body': req.body,
        } : ''),
    );
    console.info('----------------------------------------------------------------------------------------------------------------');
    next(); // continue the request
});

//---------------------------------------------------------------------------------------------------------------//

router.get('/test', async (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({
        'message': `this is a test: ${Date.now()}`,
    }, null, 2));
});

//---------------------------------------------------------------------------------------------------------------//

require('./v1/auth/keys/generate.js')(router, client);

require('./v1/products/fetch/fetch.js')(router, client);

require('./v1/user/blacklist/blacklisted.js')(router, client);
require('./v1/user/products/fetch.js')(router, client);
require('./v1/user/products/purchase.js')(router, client);
require('./v1/user/verification/verify.js')(router, client);
require('./v1/user/verification/verified.js')(router, client);

//---------------------------------------------------------------------------------------------------------------//

/* start the server on the port */
app.listen(app.get('port'), () => {
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`Started Bot Server On Port: ${app.get('port')}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});
