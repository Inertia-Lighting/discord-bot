/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import prisma from '@/lib/prisma_client.js';

/* ------------------------------- Definition ------------------------------- */

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