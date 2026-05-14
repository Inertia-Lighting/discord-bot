import prisma from '@/lib/prisma_client.js';

import { FullNote } from '../types.js';

export async function lookupNoteForUser(
    { id }: {
        id: string,
    }
): Promise<FullNote | null> {

    const note = await prisma.notes.findFirst({
        where: {
            id
        },
        include: {
            notedUser: true,
            staffUser: true,
        }
    })

    return note;
}