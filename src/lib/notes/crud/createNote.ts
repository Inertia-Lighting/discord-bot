import prisma from '@/lib/prisma_client.js';

export async function createNoteForUser(
    {
        discordId
    }: {
        discordId: string,
    },
    {
        note,
        staffId
    }: {
        epoch: number,
        note: string,
        staffId: string,
    }
): Promise<boolean> {
    try {
        await prisma.user.update({
            where: {
                discordId,
            },
            data: {
                notes: {
                    create: {
                        staffUser: {
                            connect: {
                                discordId: staffId
                            }
                        },
                        note
                    }
                }
            }
        })
        return true
    } catch (err) {
        console.trace(err)
        return false;
    }
}