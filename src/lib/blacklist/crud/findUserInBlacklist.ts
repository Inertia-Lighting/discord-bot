import prisma from '@/lib/prisma_client.js';

import { FullPunishment } from '../types.js';

export async function findUserInBlacklistedUsersDatabase(
    user_lookup_type: 'discord' | 'roblox',
    user_lookup_query: string,
): Promise<FullPunishment | null> {
    if (typeof user_lookup_query !== 'string') throw new TypeError('`user_lookup_query` must be a string');

    // const find_query = {
    //     ...(user_lookup_type === 'discord' ? {
    //         'identity.discord_user_id': user_lookup_query,
    //     } : {
    //         'identity.roblox_user_id': user_lookup_query,
    //     }),
    // };

    // const db_blacklisted_user_data_find_cursor = await go_mongo_db.find(db_database_name, db_blacklisted_users_collection_name, find_query, {
    //     projection: {
    //         '_id': false,
    //     },
    // });

    const blacklistData = await prisma.punishments.findFirst({
        where: {
            AND: [
                {
                    punishmentType: 'blacklist',
                },
                {
                    punishedUser: {
                     OR: [
                        {
                            discordId: user_lookup_query
                        },
                        {
                            robloxId: user_lookup_query
                        }
                     ]   
                    }
                }
            ]
        },
        include: {
            punishedUser: true,
            staffUser: true,
        }
    })

    return blacklistData;
}