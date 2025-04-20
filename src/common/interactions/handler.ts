import config from '@root/config';
import Discord from 'discord.js';
import path from 'path';

import { delay, findJSFiles } from '../utils';
import { fetchPermissions, isDeveloper } from '../utilities/permissions';
import { CustomEmbed } from '../utilities/embed';

export class Interaction {
  private _identifier: InteractionIdentifier;
  private _type: InteractionType;
  private _data: InteractionData;
  private _metadata: InteractionMetadata;
  private _handler: InteractionHandler;

  public constructor(
    opts: {
      identifier: InteractionIdentifier,
      type: InteractionType,
      data: InteractionData,
      metadata: InteractionMetadata,
      handler: InteractionHandler,
    },
  ) {
    this._identifier = opts.identifier;
    this._type = opts.type;
    this._data = opts.data;
    this._metadata = opts.metadata;
    this._handler = opts.handler;
  }

  get identifier() {
    return this._identifier;
  }

  get type() {
    return this._type;
  }

  get data() {
    return {
      ...this._data,
      name: this._identifier
    };
  }

  get metadata() {
    return this._metadata ?? {};
  }

  public async handler(client: Discord.Client<true>, interaction: Discord.Interaction) {
    await this._handler(client, interaction);
  }
}

export class InteractionsManager {
  public static cached_interactions = new Discord.Collection<InteractionIdentifier, Interaction>();

  public static async registerInteractions(): Promise<void> {
    InteractionsManager.cached_interactions.clear();
    const interactions_path = path.join(process.cwd(), 'dist', 'interactions');
    const interactions: string[] = findJSFiles(interactions_path);

    for (const interaction of interactions) {
      const interaction_path = path.resolve(interaction);

      const relative_path = path.relative(__dirname, interaction_path);
      const esm_path = `./${relative_path.replace(/\\/g, '/')}`;

      console.log(`Registering: ${esm_path}`);

      delete require.cache[require.resolve(interaction_path)];

      const client_interaction = await import(esm_path).then((imported_module) => {
        const imported_module_exports = imported_module.default ?? imported_module;
        // console.log(imported_module_exports)
        return imported_module_exports;
        
      }) as {
        default: Interaction,
      };



      InteractionsManager.cached_interactions.set(client_interaction.default.identifier, client_interaction.default);
    }

    console.info('Registered interactions.');
  }

  public static async syncInteractionsToDiscord(client: Discord.Client<true>): Promise<void> {
    if (InteractionsManager.cached_interactions.size < 1) throw new Error('No interactions to sync!');

    if (!client.application) throw new Error('Application is missing!');

    for (const [application_command_id, application_command] of await client.application.commands.fetch()) {
      const command_exists = InteractionsManager.cached_interactions.find(
        (interaction) => interaction.identifier === application_command.name
      );

      if (!command_exists) {
        console.info(`Deleting application command from discord: ${application_command.name};`);
        await client.application.commands.delete(application_command_id);
      }

      await delay(250); // prevent api abuse
    }

    const commands: Discord.ApplicationCommandDataResolvable[] = [];
    for (const client_interaction of InteractionsManager.cached_interactions.values()) {
      if (client_interaction.type !== Discord.InteractionType.ApplicationCommand) continue;

      console.info(`Syncing command: ${client_interaction.identifier}`);

      commands.push(client_interaction.data as Discord.ApplicationCommandDataResolvable);
    }
    try {
      console.info(`Registering ${commands.length} interactions`);
      await client.application.commands.set(commands);
    } catch (error) {
      console.trace('Failed to sync', error);
    }
  }

  // eslint-disable-next-line complexity
  public static async handleInteractionFromDiscord(client: Discord.Client<true>, interaction: Discord.Interaction): Promise<void> {
    let interaction_name: string;

    switch (interaction.type) {
      case Discord.InteractionType.ApplicationCommand: {
        interaction_name = interaction.commandName.toLowerCase();
        break;
      }
      case Discord.InteractionType.ApplicationCommandAutocomplete: {
        interaction_name = interaction.commandName.toLowerCase();
        break;
      }
      case Discord.InteractionType.MessageComponent: {
        interaction_name = interaction.customId.toLowerCase();
        break;
      }
      case Discord.InteractionType.ModalSubmit: {
        interaction_name = interaction.customId.toLowerCase();
        break;
      }
      default: {
        const unknown_interaction = interaction as Discord.Interaction;

        console.warn(`Unknown interaction type: ${unknown_interaction.type}`);

        interaction_name = unknown_interaction.id;

        break;
      }
    }

    const client_interaction = InteractionsManager.cached_interactions.get(interaction_name);

    if (!client_interaction) return;

    if (interaction.inGuild() && [config.guild_id, config.staff_guild_id].includes(interaction.guildId)) return;

    if (client_interaction.metadata.guild_only && !interaction.inCachedGuild()) throw new Error('Expected guild for this interaction');

    const access_level = client_interaction.metadata.required_access_level;

    if (typeof access_level !== 'number' && interaction.isChatInputCommand()) throw new Error('Access level was not found for this interaction');

    if (typeof access_level === 'number') {
      if (!interaction.inCachedGuild()) throw new Error('Access Level was supplied but interaction was not from a cached guild');

      const highest_access = fetchPermissions(interaction.member);

      if (highest_access < access_level) {
        if (interaction.isRepliable()) {
          await interaction.reply({
            embeds: [
              CustomEmbed.from({
                color: CustomEmbed.color.Violet,
                title: 'Access Denied',
                description: `${Discord.userMention(interaction.user.id)}, you are not allowed to use this command!`,
              }),
            ],
          });
        }
        return;
      }
      const is_dev = isDeveloper(interaction.member)
      if (client_interaction.metadata.dev_only && !is_dev) {
        if (interaction.isRepliable()) {
          await interaction.reply({
            embeds: [
              CustomEmbed.from({
                color: CustomEmbed.color.Violet,
                title: 'Access Denied',
                description: `${Discord.userMention(interaction.user.id)}, this command is currently under development!`,
              }),
            ],
          });
        }
        return;
      }
    }

    try {
      if (interaction.isChatInputCommand()) {
        console.info(`CustomInteractionsManager.handleInteractionFromDiscord(): running handler for chat input command interaction: ${client_interaction.identifier}`);
      }

      await client_interaction.handler(client, interaction);
    } catch (error) {
      console.trace(error);

      if (interaction.isRepliable()) {
        await interaction.followUp({
          embeds: [
            CustomEmbed.from({
              color: CustomEmbed.color.Violet,
              title: 'Command Unavailable',
              description: 'This command is currently unavailable right now. Try again later.'
            })
          ]
        }).catch(console.warn);
      }
    }
  }
}