// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import path from 'node:path';

import * as Discord from 'discord.js';

import { CustomEmbed } from '@/common/message.js'
import { fetchHighestAccessLevelForUser } from '@/common/permissions.js'
import { DistributiveOmit } from '@/types/index.js'
import { delay } from '@/utilities/index.js'

import { findJSFiles } from '../utils.js';

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('Environment variable: BOT_GUILD_ID; was not set correctly!');

const bot_staff_guild_id = `${process.env.BOT_STAFF_GUILD_ID ?? ''}`;
if (bot_staff_guild_id.length < 1) throw new Error('Environment variable: BOT_STAFF_GUILD_ID; was not set correctly!');

const guild_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
if (guild_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not set correctly!');

const guild_customer_service_role_id = `${process.env.BOT_CUSTOMER_SERVICE_ROLE_ID ?? ''}`;
if (guild_customer_service_role_id.length < 1) throw new Error('Environment variable: BOT_CUSTOMER_SERVICE_ROLE_ID; was not set correctly!');

const guild_moderators_role_id = `${process.env.BOT_MODERATOR_ROLE_ID ?? ''}`;
if (guild_moderators_role_id.length < 1) throw new Error('Environment variable: BOT_MODERATOR_ROLE_ID; was not set correctly!');

const guild_admins_role_id = `${process.env.BOT_ADMIN_ROLE_ID ?? ''}`;
if (guild_admins_role_id.length < 1) throw new Error('Environment variable: BOT_ADMIN_ROLE_ID; was not set correctly!');

const guild_team_leaders_role_id = `${process.env.BOT_TEAM_LEADERS_ROLE_ID ?? ''}`;
if (guild_team_leaders_role_id.length < 1) throw new Error('Environment variable: BOT_TEAM_LEADERS_ROLE_ID; was not set correctly!');

const guild_company_management_role_id = `${process.env.BOT_COMPANY_MANAGEMENT_ROLE_ID ?? ''}`;
if (guild_company_management_role_id.length < 1) throw new Error('Environment variable: BOT_COMPANY_MANAGEMENT_ROLE_ID; was not set correctly!');

// ------------------------------------------------------------//

type CustomInteractionIdentifier = string;

type CustomInteractionType = Discord.InteractionType;

type CustomInteractionData = DistributiveOmit<Discord.ApplicationCommandData, 'name'> | undefined;

type CustomInteractionMetadata = {
    [key: string]: unknown,
    required_run_context: CustomInteractionRunContext,
    required_access_level: CustomInteractionAccessLevel,
};

type CustomInteractionHandler = (discord_client: Discord.Client<true>, interaction: Discord.Interaction) => Promise<void>;

// ------------------------------------------------------------//

export enum CustomInteractionRunContext {
    Global = 1,
    Guild = 2,
    DirectMessage = 3,
}

export enum CustomInteractionAccessLevel {
    Public = 1,
    Staff = 2,
    CustomerService = 3,
    Dev = 4,
    SeniorDev = 5,
    Moderators = 6,
    Admins = 7,
    TeamLeaders = 8,
    CompanyManagement = 9,
    BotAdmin = 10
}

// ------------------------------------------------------------//

export class CustomInteraction {
    private _identifier: CustomInteractionIdentifier;
    private _type: CustomInteractionType;
    private _data: CustomInteractionData;
    private _metadata: CustomInteractionMetadata;
    private _handler: CustomInteractionHandler;

    public constructor(
        opts: {
            identifier: CustomInteractionIdentifier,
            type: CustomInteractionType,
            data: CustomInteractionData,
            metadata: CustomInteractionMetadata,
            handler: CustomInteractionHandler,
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
            name: this._identifier,
        };
    }

    get metadata() {
        return this._metadata ?? {};
    }

    public async handler(
        discord_client: Discord.Client<true>,
        interaction: Discord.Interaction,
    ) {
        await this._handler(discord_client, interaction);
    }
}

export class CustomInteractionsManager {
    public static interactions = new Discord.Collection<CustomInteractionIdentifier, CustomInteraction>();

    public static cached_interactions = new Discord.Collection<CustomInteractionIdentifier, CustomInteraction>();

    public static async registerClientInteractions(): Promise<void> {
        CustomInteractionsManager.cached_interactions.clear();
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
                default: CustomInteraction,
            };
            CustomInteractionsManager.cached_interactions.set(client_interaction.default.identifier, client_interaction.default);
        }

        console.info('Registered interactions.');
    }

    public static async syncInteractionsToDiscord(
        discord_client: Discord.Client,
    ): Promise<void> {
        if (!discord_client.isReady()) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): discord client is not ready');

        if (CustomInteractionsManager.interactions.size < 1) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): No interactions to sync!');

        if (!discord_client.application) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): Application is missing?');

        /** remove all non-existent interactions */
        for (const [application_command_id, application_command] of await discord_client.application.commands.fetch()) {
            const command_exists = this.interactions.find(
                (interaction) => interaction.identifier === application_command.name
            );

            if (!command_exists) {
                console.info(`Deleting application command from discord: ${application_command.name};`);
                await discord_client.application.commands.delete(application_command_id);
            }

            await delay(250); // prevent api abuse
        }

        const commands_to_register: Discord.ApplicationCommandDataResolvable[] = [];
        for (const client_interaction of CustomInteractionsManager.interactions.values()) {
            if (client_interaction.type !== Discord.InteractionType.ApplicationCommand) continue;

            console.info(`Syncing application command to discord: ${client_interaction.identifier};`);

            commands_to_register.push(client_interaction.data as Discord.ApplicationCommandDataResolvable);
        }

        try {
            console.info(`Registering ${commands_to_register.length} global interactions...`);
            await discord_client.application.commands.set(commands_to_register);
        } catch (error) {
            console.trace('Failed to sync application commands to discord:', error);
        }
    }

    public static async handleInteractionFromDiscord(
        discord_client: Discord.Client<true>,
        interaction: Discord.Interaction,
    ): Promise<void> {
        /* ensure the discord client is ready */
        if (!discord_client.isReady()) throw new Error('CustomInteractionsManager.handleInteractionFromDiscord(): discord client is not ready');

        let unknown_interaction_identifier: string;

        switch (interaction.type) {
            case Discord.InteractionType.ApplicationCommand: {
                unknown_interaction_identifier = interaction.commandName;
                break;
            }
            case Discord.InteractionType.ApplicationCommandAutocomplete: {
                unknown_interaction_identifier = interaction.commandName;
                break;
            }

            case Discord.InteractionType.MessageComponent: {
                unknown_interaction_identifier = interaction.customId;
                break;
            }

            case Discord.InteractionType.ModalSubmit: {
                unknown_interaction_identifier = interaction.customId;
                break;
            }

            default: {
                /* this is necessary to re-assert that a 'never' condition might actually happen */
                const really_unknown_interaction = interaction as Discord.Interaction;

                console.warn(`unknown interaction type: ${really_unknown_interaction.type};`);

                unknown_interaction_identifier = really_unknown_interaction.id;

                break;
            }
        }

        const custom_interaction = CustomInteractionsManager.interactions.get(unknown_interaction_identifier);

        /* ensure the client interaction exists before handling it */
        if (!custom_interaction) return;

        /* if the interaction is from a guild, ensure it is from an allowed guild */
        if (
            interaction.inGuild() &&
            ![bot_guild_id, bot_staff_guild_id].includes(interaction.guildId)
        ) return; // ignore the interaction

        /* ensure the interaction is from a guild if the interaction requires it */
        if (
            custom_interaction.metadata.guild_only &&
            !interaction.inCachedGuild()
        ) throw new Error('This interaction is restricted to only work in guilds');

        const required_access_level = custom_interaction.metadata.required_access_level;

        if (
            typeof required_access_level !== 'number' &&
            interaction.isChatInputCommand()
        ) throw new Error('required_access_level was not found for this interaction');

        if (typeof required_access_level === 'number') {
            if (!interaction.inCachedGuild()) throw new Error('required_access_level was supplied, however the interaction was not from a cached guild');

            const highest_access_level_for_user = await fetchHighestAccessLevelForUser(discord_client, interaction.user);
            if (highest_access_level_for_user < required_access_level) {
                if (interaction.isRepliable()) {
                    await interaction.reply({
                        embeds: [
                            CustomEmbed.from({
                                color: CustomEmbed.Color.Violet,
                                title: 'Access Denied',
                                description: `${Discord.userMention(interaction.user.id)}, you are not allowed to use this command!`,
                            }),
                        ],
                    });
                }

                return; // prevent the user from running the interaction
            }
        }

        try {
            if (interaction.isChatInputCommand()) {
                console.log(`CustomInteractionsManager.handleInteractionFromDiscord(): running handler for chat input command interaction: ${custom_interaction.identifier}`);
            }

            await custom_interaction.handler(discord_client, interaction);
        } catch (error) {
            console.trace(error);

            // send an error if possible
            if (interaction.isRepliable()) {
                await interaction.followUp({
                    content: 'Sorry but this command doesn\'t work right now!',
                }).catch(console.warn);
            }
        }
    }
}
