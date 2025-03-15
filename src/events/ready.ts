import Discord from 'discord.js'
import { InteractionsManager } from '../common/interactions/handler'

// export default function ready(client: Discord.Client): void {
//     client
//     const divider = '-'.repeat(process.stdout.columns)
//     console.log(divider)
//     console.log('Bot is up')
//     console.log(`Username: ${client.user.username}`)
//     console.log(`ID: ${client.user.id}`)
// }

export const event_name = 'ready'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handler(client: Discord.Client<true>): void {
  const divider = '-'.repeat(process.stdout.columns)
  console.clear()
  console.log(divider)
  console.log('Bot is up')
  if (client.user) {
    console.log(`Username: ${client.user.username}`)
    console.log(`ID: ${client.user.id}`)
  } else {
    console.log('Client user is null')
  }
  console.log(divider)

  console.info('Starting command registration')
  InteractionsManager.registerInteractions()

  setTimeout(() => InteractionsManager.syncInteractionsToDiscord(client), 1 * 30_000)
}