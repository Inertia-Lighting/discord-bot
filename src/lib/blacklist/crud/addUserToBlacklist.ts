import prisma from '@/lib/prisma_client.js';

export async function addUserToBlacklistedUsersDatabase(
    {
        discordId,
        robloxId
    }: {
        discordId: string,
        robloxId: string,
    },
    { reason, staff_member_id }: {
        reason: string,
        staff_member_id: string,
    },
): Promise<boolean> {

    try {
        const blacklist_date = new Date();
        blacklist_date.setFullYear(blacklist_date.getFullYear() + 10);
        // await go_mongo_db.add(db_database_name, db_blacklisted_users_collection_name, [user_blacklist_data]);
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
                    create: {
                        punishmentType: 'blacklist',
                        punishmentReason: reason,
                        staffUser: {
                            connect: {
                                discordId: staff_member_id
                            },
                        },
                        duration: blacklist_date
                    }
                }
            }
        })
    } catch (error) {
        console.trace(error);
        return false; // user was not added to blacklist
    }

    return true; // user was added to blacklist
}