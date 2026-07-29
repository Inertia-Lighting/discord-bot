/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Definition ------------------------------- */

import prisma from '@/lib/prisma_client.js'

/* ------------------------------- Definition ------------------------------- */

export async function removeUserFromBlacklistedUsersDatabase(
    {
        discordId,
        robloxId
    }: {
        discordId: string,
        robloxId: string,
    },
): Promise<boolean> {
    try {

        await prisma.punishments.deleteMany({
            where: {
                punishedUser: {
                    OR: [
                        {
                            discordId,
                        },
                        {
                            robloxId
                        }
                    ],
                },
                punishmentType: 'blacklist'
            }
        })
    } catch (error) {
        console.trace(error);
        return false; // user was not removed from blacklist
    }

    return true; // user was removed from blacklist
}