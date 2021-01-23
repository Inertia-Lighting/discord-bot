'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const roblox_products = new Discord.Collection([
    {
        id: '1048655672',
        code: 'SGM_Q7_STROBE',
        name: 'SGM Q7 Strobe',
        discord_role_id: '728050461566828554',
        description: 'Stage Strobe Lights System',
    }, {
        id: '1048656189',
        code: 'Laser_Fixture',
        name: 'Laser Fixture',
        discord_role_id: '701758602624368741',
        description: '',
    }, {
        id: '1048656930',
        code: 'Follow_Spotlight',
        name: 'Follow Spotlight',
        discord_role_id: '703378159768436778',
        description: '',
    }, {
        id: '1048657587',
        code: 'JDC1',
        name: 'JDC1',
        discord_role_id: '651875390226169896',
        description: 'The JDC1 contains a single tube element with LEDs that produce a clear, bright white output, combined with a surrounding full RGB power',
    }, {
        id: '1048658409',
        code: 'C_Lights',
        name: 'C-Lights',
        discord_role_id: '601909655165337600',
        description: 'A cutting edge moving head that includes light color patterns, sequences, and gobos',
    }, {
        id: '1048659490',
        code: 'LED_Bars',
        name: 'LED Bars',
        discord_role_id: '616358700642467856',
        description: 'LED Bars are a full-sized linear light strip with color loops, positions and position loops used to create linear effects',
    }, {
        id: '1048660338',
        code: 'MagicPanels',
        name: 'Magic Panels',
        discord_role_id: '679585419192434699',
        description: 'The Magic Panels are a \'wash light\' that allows a burst of light to show during effect and color loops',
    }, {
        id: '1048660903',
        code: 'House_Lights',
        name: 'House Lights',
        discord_role_id: '704504968748466226',
        description: 'House Lights are parts that have color effects and basic dimming abilities',
    }, {
        id: '1048661603',
        code: 'Pars',
        name: 'Pars',
        discord_role_id: '655225947951333376',
        description: 'Pars are a set of stationary lights that are set into position to create a lighting effect during an event, they can be used as back-lights as well',
    }, {
        id: '1048662044',
        code: 'Blinders',
        name: 'Blinders',
        discord_role_id: '608432734578147338',
        description: 'Stage Blinder Light System',
    }, {
        id: '1052217623',
        code: 'Wash',
        name: 'Washes',
        discord_role_id: '673362639660908559',
        description: '',
    },
].map(item => ([item.id, item])));

//---------------------------------------------------------------------------------------------------------------//

async function userProductsBuy(router, client, userSchema, mongo) {
    router.post('/user/products/buy', async (req, res) => {
        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const {
            player_id: roblox_user_id,
            product_id: roblox_product_id,
        } = req.body;

        await mongo(); // initialize connection to database

        const db_user_data = await userSchema.findOne({
            'ROBLOX_ID': roblox_user_id,
        });

        if (!db_user_data) {
            console.log(`roblox user: ${roblox_user_id}; not found in database`);
            res.status(404).send('roblox user not found in database');
            return;
        }

        const guild = client.guilds.resolve('601889649601806336');
        if (!guild) return;

        const guild_member = await guild.members.fetch(db_user_data._id).catch(console.warn);
        if (!guild_member) return;
        
        const dm_channel = await guild_member.createDM().catch(console.warn);
        if (!dm_channel) return;

        const purchased_product = roblox_products.get(roblox_product_id);

        console.log({
            roblox_product_id,
            purchased_product,
        });

        await userSchema.findOneAndUpdate({
            'ROBLOX_ID': roblox_user_id,
        }, {
            [purchased_product.code]: true,
        }, {
            upsert: true,
        });

        /* dm the user */
        dm_channel.send(new Discord.MessageEmbed({
            color: 0x404040,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Confirmed Purchase',
            },
            title: `Thank you for purchasing ${purchased_product.name}!`,
            description: 'You have been given the roles in the Discord Server to your product',
            fields: [
                {
                    name: `${purchased_product.code}`,
                    value: `${purchased_product.description}`,
                },
            ],
        })).catch(console.warn);

        /* add the role to the user */
        guild_member.roles.add(purchased_product.discord_role_id);

        /* respond to game */
        res.status(200).send('user successfully bought the product');
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userProductsBuy,
};
