//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

/* prevent the script from crashing for unhandledRejections */
process.on('unhandledRejection', (reason, promise) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('unhandledRejection at:', reason, promise);
    console.error('----------------------------------------------------------------------------------------------------------------');
});

/* prevent the script from crashing for uncaughtExceptions */
process.on('uncaughtException', (error) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('uncaughtException at:', error);
    console.error('----------------------------------------------------------------------------------------------------------------');
});

//------------------------------------------------------------//

// eslint-disable-next-line no-unused-expressions
require('./bot/bot.js');
