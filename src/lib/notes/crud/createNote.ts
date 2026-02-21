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
        const user = await prisma.user.findFirst({
            where: {
                discordId,
            }
        })
        const staffUser = await prisma.user.findFirst({
            where: {
                discordId: staffId,
            }
        })
        if (!user || !staffUser) {
            return false;
        }
        await prisma.notes.create({
            data: {
                notedUserId: user.id,
                staffUserId: staffUser.id,
                note
            }
        })
        return true
    } catch (err) {
        console.trace(err)
        return false;
    }
}