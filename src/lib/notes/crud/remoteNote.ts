import prisma from '@/lib/prisma_client.js';

export async function removeNoteFromUser(
    { id }: {
        id: string,
    }
): Promise<boolean> {
    if (typeof id !== 'string') throw new TypeError('id must be a string!');

    try {
        // await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
        //     'record.id': id,
        // });
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
