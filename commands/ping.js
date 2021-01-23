module.exports = {
    name: 'ping',
    description: 'shows bot ping',
    staffOnly: true,
    aliases: ['ping'],
    execute(message, args, client, Discord) {
        message.channel.send(`Pong: ${client.ws.ping}ms`)
    }
}
