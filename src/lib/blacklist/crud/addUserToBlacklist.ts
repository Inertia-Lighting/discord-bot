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
        await prisma.punishments.create({
            data: {
                punishmentType: 'blacklist',
                punishmentReason: reason,
                staffUser: {
                    connect: {
                        discordId: staff_member_id
                    },
                },
                duration: blacklist_date,
                punishedUser: {
                    connect: {
                        robloxId,
                        discordId
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