/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import Discord from 'discord.js';

//---------------------------------------------------------------------------------------------------------------//

type CustomInteraction = {
    identifier: string,
    execute: (interaction: Discord.Interaction) => Promise<void>,
};

//---------------------------------------------------------------------------------------------------------------//

const interactions = new Discord.Collection<string, CustomInteraction>();

//---------------------------------------------------------------------------------------------------------------//

export {
    interactions,
};
