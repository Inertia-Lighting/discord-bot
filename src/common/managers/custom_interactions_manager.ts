//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import path from 'node:path';

import * as Discord from 'discord.js';

import recursiveReadDirectory from 'recursive-read-directory';

import { DistributiveOmit } from '@root/types';

import { delay } from '@root/utilities';

//------------------------------------------------------------//

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

//------------------------------------------------------------//

type CustomInteractionIdentifier = string;

type CustomInteractionType = Discord.InteractionType;

type CustomInteractionData = DistributiveOmit<Discord.ApplicationCommandData, 'name'> | undefined;

type CustomInteractionMetadata = {
    [key: string]: unknown,
    required_run_context: CustomInteractionRunContext,
    required_access_level: CustomInteractionAccessLevel,
};

type CustomInteractionHandler = (discord_client: Discord.Client<true>, interaction: Discord.Interaction) => Promise<void>;

//------------------------------------------------------------//

export enum CustomInteractionRunContext {
    Global = 1,
    Guild = 2,
    DirectMessage = 3,
}

export enum CustomInteractionAccessLevel {
    Public = 1,
    Staff = 2,
    CustomerService = 3,
    Moderators = 4,
    Admins = 5,
    TeamLeaders = 6,
    CompanyManagement = 7,
}

//------------------------------------------------------------//

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

    public static async registerClientInteractions(): Promise<void> {
        CustomInteractionsManager.interactions.clear();

        const path_to_interaction_files = path.join(process.cwd(), 'dist', 'custom_interactions');
        const client_interaction_file_names: string[] = recursiveReadDirectory(path_to_interaction_files);

        for (const client_interaction_file_name of client_interaction_file_names) {
            if (!client_interaction_file_name.endsWith('.js')) continue;

            const client_interaction_file_path = path.join(path_to_interaction_files, client_interaction_file_name);

            // required b/c esm imports are quirky
            const relative_path = path.relative(path.join(process.cwd(), 'dist', 'common', 'managers'), client_interaction_file_path);
            const esm_compatible_path = `./${relative_path.replace(/\\/g, '/')}`;

            console.info(`Registering client interaction... ${esm_compatible_path}`);

            // required to ensure that the file is reloaded each time
            delete require.cache[require.resolve(client_interaction_file_path)];

            const { default: client_interaction } = await import(esm_compatible_path).then((imported_module) => {
                // handle esm and commonjs module exports
                const imported_module_exports = imported_module.default ?? imported_module;

                return imported_module_exports;
            }) as {
                default: CustomInteraction | unknown,
            };

            if (!(client_interaction instanceof CustomInteraction)) {
                console.trace(`Failed to load client interaction: ${client_interaction_file_path};`);
                continue;
            }

            CustomInteractionsManager.interactions.set(client_interaction.identifier, client_interaction);
        }

        console.info('Registered client interactions.');
    }

    public static async syncInteractionsToDiscord(
        discord_client: Discord.Client,
    ): Promise<void> {
        if (!discord_client.isReady()) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): discord client is not ready');

        if (CustomInteractionsManager.interactions.size < 1) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): No interactions to sync!');

        if (!discord_client.application) throw new Error('CustomInteractionsManager.syncInteractionsToDiscord(): Application is missing?');

        /** remove all non-existent interactions */
        for (const [ application_command_id, application_command ] of await discord_client.application.commands.fetch()) {
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
            ![ bot_guild_id, bot_staff_guild_id ].includes(interaction.guildId)
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

            const access_levels_for_user = [ CustomInteractionAccessLevel.Public ]; // default access level

            const bot_guild = await discord_client.guilds.fetch(bot_guild_id);
            const bot_guild_member = await bot_guild.members.fetch(interaction.user.id);
            const bot_guild_member_roles_cache = bot_guild_member.roles.cache;

            if (bot_guild_member_roles_cache.has(guild_staff_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.Staff);
            }

            if (bot_guild_member_roles_cache.has(guild_customer_service_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.CustomerService);
            }

            if (bot_guild_member_roles_cache.has(guild_moderators_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.Moderators);
            }

            if (bot_guild_member_roles_cache.has(guild_admins_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.Admins);
            }

            if (bot_guild_member_roles_cache.has(guild_team_leaders_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.TeamLeaders);
            }

            if (bot_guild_member_roles_cache.has(guild_company_management_role_id)) {
                access_levels_for_user.push(CustomInteractionAccessLevel.CompanyManagement);
            }

            const highest_access_level_for_user = Math.max(...access_levels_for_user);
            if (highest_access_level_for_user < required_access_level) {
                if (interaction.isRepliable()) {
                    await interaction.reply({
                        content: 'You are not allowed to use this command!',
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
