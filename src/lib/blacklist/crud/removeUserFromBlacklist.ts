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
        // await go_mongo_db.remove(db_database_name, db_blacklisted_users_collection_name, {
        //     'identity': identity,
        // });
        await prisma.user.updateMany({
            where: {
                OR: [
                    {
                        discordId
                    },
                    {
                        robloxId
                    }
                ]
            },
            data: {
                receivedPunishments: {
                    deleteMany: {
                        punishmentType: 'blacklist'
                    }
                }
            }
        })
    } catch (error) {
        console.trace(error);
        return false; // user was not removed from blacklist
    }

    return true; // user was removed from blacklist
}