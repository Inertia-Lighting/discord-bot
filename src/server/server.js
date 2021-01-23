'use strict';

//---------------------------------------------------------------------------------------------------------------//

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();

//---------------------------------------------------------------------------------------------------------------//

app.set('port', process.env.SERVER_PORT);

app.use(bodyParser.json()); // parse application/json
app.use('/', router);

//---------------------------------------------------------------------------------------------------------------//

const { userVerify } = require('./src/server/user/verify');
const { userVerified } = require('./src/server/user/verified');
const { userProductsFetch } = require('./src/server/user/fetch-products');
const { userProductsBuy } = require('./src/server/user/buy-products');

//---------------------------------------------------------------------------------------------------------------//

userVerify(router, client);
userVerified(router, client);
userProductsFetch(router, client);
userProductsBuy(router, client);

/* start the server on the port */
app.listen(app.get('port'), () => {
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`Started Bot Server On Port: ${app.get('port')}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});
