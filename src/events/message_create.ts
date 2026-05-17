// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { automatedQuickSupportHandler, suggestionsCategoryHandler } from '@/common/handlers/index.js'
import { BlacklistModel, UserModel } from '@/lib/mongoose/models/index.js';
import { Prisma } from '@/lib/prisma/client.js';
import prisma from '@/lib/prisma_client.js';
import { DbBlacklistedUserRecord, DbUserData } from '@/types/index.js';
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.MessageCreate,
    // eslint-disable-next-line complexity
    async handler(
        client: Discord.Client,
        message: Discord.Message,
    ) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* don't allow system accounts */
        if (message.author.system) return;

        /* only allow messages from inside of a guild */
        if (!message.inGuild()) return;

        /* only allow messages from inside of the bot guild */
        if (message.guild.id !== config.guild_id) return;

        /* only allow text channels */
        if (!message.channel.isTextBased()) return;

        /* handle messages sent in suggestions channels */
        if (message.channel.parent?.id === config.suggestions_category_id) {
            suggestionsCategoryHandler(message);
            return;
        }

        /* respond to mentions of this bot */
        if (
            message.content.startsWith(
                Discord.userMention(message.client.user.id)
            )
        ) {
            await message.reply({
                content: [
                    'To see a list of commands do /help!',
                ].join('\n'),
            }).catch(console.warn);

            return;
        }

        if (message.content === '!!post_migrate') {
            console.log(`Running "!!post_migrate" for ${message.author.globalName} (${message.author.id}) `)
            const findInPG = await prisma.user.findFirst({
                where: {
                    discordId: message.author.id
                },
                include: {
                    transactions: true
                }
            })
            if (!findInPG) return;
            const findUser = await UserModel.findOne<DbUserData>({
                'identity.discord_user_id': message.author.id,
            }, {
                '_id': false
            })
            const findBlacklist = await BlacklistModel.findOne<DbBlacklistedUserRecord>({
                'identity.discord_user_id': message.author.id,
            }, {
                '_id': false
            })
            const db_products = await prisma.products.findMany();
            let lumenAdd: number = 0;
            const transactions: Omit<Prisma.TransactionsCreateInput, 'User'>[] = [];
            const punishments: Omit<Prisma.PunishmentsCreateManyInput, 'punishedUserId'>[] = [];
            if (findUser && findUser.products) {
                for (const [product, own] of Object.entries(findUser.products)) {
                    if (own === true) {
                        // eslint-disable-next-line max-depth
                        if (findInPG.transactions.some((trans) => trans.productCode === product)) continue;
                        transactions.push({
                            productCode: product,
                            purchaseId: `SYSTEM_TRANSFER_${crypto.randomUUID()}`,
                            transactionAmount: '0',
                            transactionType: 'system',
                        });
                        const db_product = db_products.find((v) => v.code === product)
                        // eslint-disable-next-line max-depth
                        if (!db_product) continue;
                        lumenAdd = lumenAdd + db_product.price_in_robux

                    }
                }
            }
            if (findBlacklist) {
                let issuingUser = await prisma.user.findFirst({
                    where: {
                        discordId: findBlacklist.staff_member_id,
                    },
                });

                if (!issuingUser) {
                    issuingUser = await prisma.user.upsert({
                        where: {
                            discordId: 'SYSTEM_USER',
                            robloxId: 'SYSTEM_USER'
                        },
                        update: {},
                        create: {
                            discordId: 'SYSTEM_USER',
                            robloxId: 'SYSTEM_USER',
                        },
                    });
                }

                if (issuingUser) {
                    console.debug(issuingUser.id);
                    const blacklist_date = new Date();
                    blacklist_date.setFullYear(blacklist_date.getFullYear() + 10);
                    punishments.push({
                        punishmentReason: findBlacklist.reason,
                        punishmentType: 'blacklist',
                        staffUserId: issuingUser.id,
                        duration: blacklist_date,
                    });
                }
            }
            prisma.user.update({
                where: {
                    id: findInPG.id
                },
                data: {
                    transactions: {
                        createMany: {
                            data: transactions
                        }
                    },
                    receivedPunishments: {
                        createMany: {
                            data: punishments
                        }
                    }
                }
            })
            message.reply({
                content: `Transactions: 
                \`\`\`json
                ${transactions}
                \`\`\`
                
                Punishments: 
                \`\`\`json
                ${punishments}
                \`\`\`
                `
            })
        }
        if (message.content === '!!!!!!!FIX_AIDEN BROOOOOOOOOO') {
            console.log(`Running "!!!!!!!FIX_AIDEN BROOOOOOOOOO" for ${message.author.globalName} (${message.author.id}) `)

            const dId = message.content.split(' ')[2]
            const findInPG = await prisma.user.findFirst({
                where: {
                    discordId: dId
                },
                include: {
                    transactions: true
                }
            })
            if (!findInPG) return;
            const findUser = await UserModel.findOne<DbUserData>({
                'identity.discord_user_id': dId,
            }, {
                '_id': false
            })
            const findBlacklist = await BlacklistModel.findOne<DbBlacklistedUserRecord>({
                'identity.discord_user_id': dId,
            }, {
                '_id': false
            })
            const db_products = await prisma.products.findMany();
            let lumenAdd: number = 0;
            const transactions: Omit<Prisma.TransactionsCreateInput, 'User'>[] = [];
            const punishments: Omit<Prisma.PunishmentsCreateManyInput, 'punishedUserId'>[] = [];
            if (findUser && findUser.products) {
                for (const [product, own] of Object.entries(findUser.products)) {
                    if (own === true) {
                        // eslint-disable-next-line max-depth
                        if (findInPG.transactions.some((trans) => trans.productCode === product)) continue;
                        transactions.push({
                            productCode: product,
                            purchaseId: `SYSTEM_TRANSFER_${crypto.randomUUID()}`,
                            transactionAmount: '0',
                            transactionType: 'system',
                        });
                        const db_product = db_products.find((v) => v.code === product)
                        // eslint-disable-next-line max-depth
                        if (!db_product) continue;
                        lumenAdd = lumenAdd + db_product.price_in_robux

                    }
                }
            }
            if (findBlacklist) {
                let issuingUser = await prisma.user.findFirst({
                    where: {
                        discordId: findBlacklist.staff_member_id,
                    },
                });

                if (!issuingUser) {
                    issuingUser = await prisma.user.upsert({
                        where: {
                            discordId: 'SYSTEM_USER',
                            robloxId: 'SYSTEM_USER'
                        },
                        update: {},
                        create: {
                            discordId: 'SYSTEM_USER',
                            robloxId: 'SYSTEM_USER',
                        },
                    });
                }

                if (issuingUser) {
                    console.debug(issuingUser.id);
                    const blacklist_date = new Date();
                    blacklist_date.setFullYear(blacklist_date.getFullYear() + 10);
                    punishments.push({
                        punishmentReason: findBlacklist.reason,
                        punishmentType: 'blacklist',
                        staffUserId: issuingUser.id,
                        duration: blacklist_date,
                    });
                }
            }
            prisma.user.update({
                where: {
                    id: findInPG.id
                },
                data: {
                    transactions: {
                        createMany: {
                            data: transactions
                        }
                    },
                    receivedPunishments: {
                        createMany: {
                            data: punishments
                        }
                    }
                }
            })
            message.reply({
                content: `Transactions: 
                \`\`\`json
                ${transactions}
                \`\`\`
                
                Punishments: 
                \`\`\`json
                ${punishments}
                \`\`\`
                `
            })
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);
    },
};