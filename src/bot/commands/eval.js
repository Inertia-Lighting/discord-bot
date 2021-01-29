'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'eval',
    description: 'very powerful command that is used by my bot owner',
    ownerOnly: true,
    async execute(message, args) {
        message.delete();
        const clean = text => {
            if (typeof (text) === 'string') {return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));}
            else {return text;}
        };
        const code = args.join(' ');
        try {
            let evaled = eval(code);

            if (typeof evaled !== 'string') {evaled = require('util').inspect(evaled);}

            const embed = new Discord.MessageEmbed()
                .setColor(0x2f3136)
                .setTitle('Evaluation Successful')
                .addFields(
                    { name: 'Input', value: `\`\`\`js\n${code}\`\`\`` },
                    { name: 'Output', value: `\`\`\`js\n${clean(evaled)}\`\`\`` },
                )
                .setTimestamp()
                .setFooter(`Code executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: 'png', dynamic: true }));

            message.channel.send(embed);
        }
        catch (error) {
            console.error('Eval:', error);
            const embed = new Discord.MessageEmbed()
                .setColor(0x2f3136)
                .setTitle('Evaluation Error')
                .addFields(
                    { name: 'Input', value: `\`\`\`js\n${code}\`\`\`` },
                    { name: 'Error message', value: `\`\`\`js\n${error.message}\`\`\`` },
                )
                .setTimestamp()
                .setFooter(`Code executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: 'png', dynamic: true }));
            message.channel.send(embed);
        }
    },
};
