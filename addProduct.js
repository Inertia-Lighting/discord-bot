const mongo = require('./mongo');
const productSchema = require('./schemas/productSchema');

const roblox_products = [
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
        description: 'n/a',
    }, {
        id: '1048656930',
        code: 'Follow_Spotlight',
        name: 'Follow Spotlight',
        discord_role_id: '703378159768436778',
        description: 'n/a',
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
        description: 'n/a',
    },
];

async function main() {
    await mongo();

    for (const product of roblox_products) {
        await productSchema.findOneAndUpdate({
            id: product.id,
        }, {
            ...product,
        }, {
            upsert: true,
        });
    }
}

main();