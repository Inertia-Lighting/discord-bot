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
        dev_only?: boolean
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
    Staff,
    CustomerService,
    Dev,
    SeniorDev,
    Moderators,
    Admins,
    TeamLeaders,
    CompanyManagement,
    BotAdmin
}

}