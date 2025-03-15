import Discord from 'discord.js';

/* -------------------------------------------------------------------------- */
/*                                    Utils                                   */
/* -------------------------------------------------------------------------- */

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

declare global {
    /* -------------------------------------------------------------------------- */
    /*                                Interactions                                */
    /* -------------------------------------------------------------------------- */

    type InteractionIdentifier = string;

    type InteractionType = Discord.InteractionType;

    type InteractionData = DistributiveOmit<Discord.ApplicationCommandData, 'name'> | undefined;

    interface InteractionMetadata {
        [key: string]: unknown,
        required_run_context: InteractionRunContext,
        required_access_level: InteractionAccessLevel,
    };

    type InteractionHandler = (client: Discord.Client<true>, interaction: Discord.Interaction) => Promise<void>;

    const enum InteractionRunContext {
        Global = 1,
        Guild = 2,
        DirectMessage = 3,
    }

    interface StaffRole {
        id: string | number,
        access_level: PermissionLevel
    }

    const enum PermissionLevel {
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
}