import prisma from '@/common/lib/prisma_client.js';
import { PrismaProductData } from '@/types/index.js';

// ------------------------------------------------------------//

export class DbProductsCache {
    public static readonly cache_lifetime_ms = 1 * 600_000; // 10 minutes

    public static cache_expiration_epoch_ms = 0; // default to expired so it will be fetched on first call

    public static cache: PrismaProductData[] = [];

    public static async fetch(
        bypass_cache: boolean = false,
    ): Promise<PrismaProductData[]> {
        const now_epoch_ms = Date.now();

        if (
            bypass_cache ||
            this.cache_expiration_epoch_ms < now_epoch_ms
        ) {
            const db_roblox_products = await prisma.products.findMany({
                select: {
                    code: true,
                    name: true,
                    viewable: true,
                },
            });

            this.cache_expiration_epoch_ms = now_epoch_ms + this.cache_lifetime_ms;
            this.cache = db_roblox_products;

            return db_roblox_products;
        }

        return this.cache;
    }

}