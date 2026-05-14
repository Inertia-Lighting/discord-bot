import prisma from '@/lib/prisma_client.js';

export async function purgeNotesFromUser(
    { discordId }: {
        discordId: string,
    }
): Promise<boolean> {
    try {
        await prisma.notes.deleteMany({
            where: {
                notedUser: {
                    discordId
                }
            }
        })
    } catch (error) {
        console.trace('purgeNotesFromUser():', error);
        return false;
    }

    return true;
}