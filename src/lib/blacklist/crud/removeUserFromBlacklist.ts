import prisma from '@/lib/prisma_client.js';

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