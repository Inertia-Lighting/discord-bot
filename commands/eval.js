'use strict';

module.exports = {
    name: 'eval',
    description: 'Very powerful command this command is used by my bot owner only.',
    ownerOnly: true,
    async execute(message, args, client, Discord) {
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
                .setColor('GREEN')
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
                .setColor('RED')
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
}
