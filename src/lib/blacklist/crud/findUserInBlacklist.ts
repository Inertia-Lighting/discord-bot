/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import prisma from '@/lib/prisma_client.js';

import { FullPunishment } from '../types.js';

/* ------------------------------- Definition ------------------------------- */

export async function findUserInBlacklistedUsersDatabase(
    user_lookup_type: 'discord' | 'roblox',
    user_lookup_query: string,
): Promise<FullPunishment | null> {
    const blacklistData = await prisma.punishments.findFirst({
        where: {
            AND: [
                {
                    punishmentType: 'blacklist',
                },
                {
                    punishedUser: {
                     OR: [
                        {
                            discordId: user_lookup_query
                        },
                        {
                            robloxId: user_lookup_query
                        }
                     ]   
                    }
                }
            ]
        },
        include: {
            punishedUser: true,
            staffUser: true,
        }
    })

    return blacklistData;
}