import prisma from '@/lib/prisma_client.js';

export async function updateNoteForUser(
    { id, epoch, note, staff_member_id }: {
        id: string,
        epoch: number,
        note: string,
        staff_member_id: string,
    }
): Promise<boolean> {
    if (typeof id !== 'string') throw new TypeError('id must be a string!');
    if (typeof epoch !== 'number') throw new TypeError('epoch must be a number!');
    if (typeof note !== 'string') throw new TypeError('note must be a string!');
    if (typeof staff_member_id !== 'string') throw new TypeError('staff_member_id must be a string!');

    try {
        const staffUser = await prisma.user.findFirst({
            where: {
                discordId: staff_member_id
            }
        })
        if(!staffUser) {
            return false;
        }
        await prisma.notes.update({
            where: {
                id,
            },
            data: {
                note,
                staffUserId: staffUser.id
            }
        })
    } catch (error) {
        console.trace('updateNoteForUser():', error);
        return false;
    }

    return true;
}