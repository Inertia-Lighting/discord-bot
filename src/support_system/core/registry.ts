// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { 
    SupportCategoryConfig, 
    SupportCategoryHandler, 
    SupportCategoryId, 
    SupportCategoryRegistry 
} from '../types/index.js'
;

/**
 * Implementation of the support category registry
 */
export class SupportCategoryRegistryImpl implements SupportCategoryRegistry {
    private categories = new Map<SupportCategoryId, {
        config: SupportCategoryConfig;
        handler: SupportCategoryHandler;
    }>();

    /**
     * Registers a support category handler
     */
    registerCategory(config: SupportCategoryConfig, handler: SupportCategoryHandler): void {
        if (config.id !== handler.categoryId) {
            throw new Error(`Category ID mismatch: config has ${config.id}, handler has ${handler.categoryId}`);
        }

        this.categories.set(config.id, { config, handler });
    }

    /**
     * Gets a support category handler by ID
     */
    getHandler(categoryId: SupportCategoryId): SupportCategoryHandler | null {
        return this.categories.get(categoryId)?.handler || null;
    }

    /**
     * Gets a support category configuration by ID
     */
    getConfig(categoryId: SupportCategoryId): SupportCategoryConfig | null {
        return this.categories.get(categoryId)?.config || null;
    }

    /**
     * Gets all registered support categories
     */
    getAllCategories(): Array<{ config: SupportCategoryConfig; handler: SupportCategoryHandler }> {
        return Array.from(this.categories.values());
    }

    /**
     * Gets all enabled support categories
     */
    getEnabledCategories(): Array<{ config: SupportCategoryConfig; handler: SupportCategoryHandler }> {
        return this.getAllCategories().filter(({ config }) => config.isEnabled);
    }
}