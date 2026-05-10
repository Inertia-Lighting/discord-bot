// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

/**
 * Custom Interactions Manager
 *
 * This module exposes two primary classes:
 * - `CustomInteraction` — a typed wrapper around an interaction implementation.
 * - `CustomInteractionsManager` — loads interaction modules, caches them,
 *   and synchronizes application commands with Discord.
 *
 * The project uses ESM; to support legacy `require.cache` logic when
 * loading files from `dist`, a `require` shim is created via
 * `createRequire(import.meta.url)`.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

import * as Discord from 'discord.js';

import { CustomEmbed } from '@/common/message.js'
import { DistributiveOmit } from '@/types/index.js'
import { delay, findJSFiles } from '@/utilities/index.js'
import { fetchPermissions, isDeveloper } from '@/utilities/permissions.js';

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

const require = createRequire(import.meta.url);

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

/**
 * Represents a single custom interaction implementation.
 *
 * Instances are expected to be provided by the modules under
 * `dist/custom_interactions`. The manager will call `handler()` when
 * Discord delivers an interaction matching `identifier`.
 */
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

    /**
     * The identifier/name for this interaction.
     */
    get identifier() {
        return this._identifier;
    }

    /**
     * The Discord interaction type for this interaction.
     */
    get type() {
        return this._type;
    }

    /**
     * The application command data used to register the command with Discord.
     * The `name` field is derived from the stored identifier.
     */
    get data() {
        return {
            ...this._data,
            name: this._identifier,
        };
    }

    /**
     * Arbitrary metadata for the interaction. Includes required run
     * context and access level keys consumed by the manager.
     */
    get metadata() {
        return this._metadata ?? {};
    }

    /**
     * Invoke the implementation-provided handler for this interaction.
     * @param discord_client - Logged-in Discord client
     * @param interaction - The raw Discord interaction object
     */
    public async handler(
        discord_client: Discord.Client<true>,
        interaction: Discord.Interaction,
    ) {
        await this._handler(discord_client, interaction);
    }
}

/**
 * Loads, caches and synchronizes custom interactions with Discord.
 *
 * Notes:
 * - `registerInteractions()` dynamically imports interaction modules
 *   from the compiled `dist/custom_interactions` folder.
 * - `syncInteractionsToDiscord()` compares the cached set against the
 *   application's registered commands and registers/deletes as needed.
 */
export class CustomInteractionsManager {
    /**
     * Cached interactions keyed by their identifier.
     */
    public static cached_interactions = new Discord.Collection<CustomInteractionIdentifier, CustomInteraction>();

    public static async registerInteractions(): Promise<void> {
        CustomInteractionsManager.cached_interactions.clear();
        const interactions_path = path.join(process.cwd(), 'dist', 'custom_interactions');
        const interactions: string[] = findJSFiles(interactions_path);

        for (const interaction of interactions) {
            const interaction_path = path.resolve(interaction);

            const relative_path = path.relative(__dirname, interaction_path);
            const esm_path = `./${relative_path.replace(/\\/g, '/')}`;

            console.log(`Registering: ${esm_path}`);

            delete require.cache[require.resolve(interaction_path)];

            /**
             * Dynamic import of the interaction module. We accept both
             * default and named exports to be tolerant of different
             * build outputs.
             */
            const imported_module = await import(esm_path);

            const exported_value = imported_module.default ?? imported_module;

            let interaction_instance: CustomInteraction | undefined;

            if (exported_value && typeof exported_value === 'object' && 'identifier' in exported_value) {
                interaction_instance = exported_value as CustomInteraction;
            } else if (exported_value && typeof exported_value === 'object' && 'default' in exported_value && exported_value.default && 'identifier' in exported_value.default) {
                interaction_instance = exported_value.default as CustomInteraction;
            }

            if (!interaction_instance) {
                console.warn(`Skipping ${esm_path}: no CustomInteraction export found.`);
                continue;
            }

            CustomInteractionsManager.cached_interactions.set(interaction_instance.identifier.toLowerCase(), interaction_instance);
        }

        console.info('Registered interactions.');
    }

    public static async syncInteractionsToDiscord(client: Discord.Client<true>): Promise<void> {
        if (CustomInteractionsManager.cached_interactions.size < 1) throw new Error('No interactions to sync!');

        if (!client.application) throw new Error('Application is missing!');

        // Remove commands that no longer exist in our cache
        for (const [application_command_id, application_command] of await client.application.commands.fetch()) {
            const command_exists = CustomInteractionsManager.cached_interactions.find(
                (interaction) => interaction.identifier === application_command.name
            );

            if (!command_exists) {
                console.info(`Deleting application command from discord: ${application_command.name};`);
                await client.application.commands.delete(application_command_id);
            }

            await delay(250); // prevent api abuse
        }

        const commands: Discord.ApplicationCommandDataResolvable[] = [];
        // Build the list of application commands to register
        for (const client_interaction of CustomInteractionsManager.cached_interactions.values()) {
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

        const client_interaction = CustomInteractionsManager.cached_interactions.get(interaction_name);

        // If we don't have a registered interaction, ignore it quietly.
        if (!client_interaction) {
            throw new Error(`Could not find interaction (${interaction_name}) in cache`, );
        }

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
                                color: CustomEmbed.Color.Violet,
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
                                color: CustomEmbed.Color.Violet,
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
                            color: CustomEmbed.Color.Violet,
                            title: 'Command Unavailable',
                            description: 'This command is currently unavailable right now. Try again later.'
                        })
                    ]
                }).catch(console.warn);
            }
        }
    }
}
