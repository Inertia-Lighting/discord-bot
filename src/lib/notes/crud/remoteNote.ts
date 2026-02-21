import prisma from '@/lib/prisma_client.js';

export async function removeNoteFromUser(
    { id }: {
        id: string,
    }
): Promise<boolean> {
    if (typeof id !== 'string') throw new TypeError('id must be a string!');

    try {
        await prisma.notes.delete({
            where: {
                id,
            }
        })
    } catch (error) {
        console.trace('removeNoteFromUser():', error);
        return false;
    }

    return true;
}
