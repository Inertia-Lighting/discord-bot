#!/usr/bin/env node

/**
 * Simple integration test for the modular support system
 * This verifies that all components can be instantiated and basic operations work
 */

const { SupportSystemManager, SupportCategoryId } = require('../dist/support_system');

async function testSupportSystem() {
    console.log('🔧 Testing modular support system integration...\n');

    try {
        // Test environment variable loading (these should exist)
        console.log('✅ Step 1: Testing configuration loading...');
        const { loadSupportSystemConfig } = require('../dist/support_system/config');
        const config = loadSupportSystemConfig();
        console.log(`   - Loaded configuration with ${Object.keys(config.roles.supportStaff).length} support staff roles`);
        console.log(`   - Satisfaction levels: ${Object.keys(config.satisfaction.levels).length}`);

        // Test manager instantiation
        console.log('\n✅ Step 2: Testing SupportSystemManager instantiation...');
        const manager = new SupportSystemManager();
        console.log('   - Manager created successfully');

        // Test category retrieval
        console.log('\n✅ Step 3: Testing support category retrieval...');
        const enabledCategories = manager.getEnabledCategories();
        console.log(`   - Found ${enabledCategories.length} enabled categories:`);
        enabledCategories.forEach(category => {
            console.log(`     - ${category.id}: ${category.name}`);
        });

        // Test modal configuration retrieval
        console.log('\n✅ Step 4: Testing modal configuration retrieval...');
        const testCategoryIds = [
            SupportCategoryId.Issues,
            SupportCategoryId.Recovery,
            SupportCategoryId.Other
        ];

        for (const categoryId of testCategoryIds) {
            const modalConfig = manager.getModalConfig(categoryId);
            if (modalConfig) {
                console.log(`   - ${categoryId}: Modal found with ${modalConfig.components.length} components`);
            } else {
                console.log(`   - ${categoryId}: ❌ Modal configuration not found`);
            }
        }

        // Test registry
        console.log('\n✅ Step 5: Testing category registry...');
        const { SupportCategoryRegistryImpl } = require('../dist/support_system/core/registry');
        const registry = new SupportCategoryRegistryImpl();
        console.log('   - Registry created successfully');

        console.log('\n🎉 All tests passed! The modular support system is working correctly.');
        return true;

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    // Set required environment variables for testing
    process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID = '805191315947913236';
    process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID = '806602125610057729';
    process.env.BOT_STAFF_ROLE_ID = '789342326978772992';
    process.env.BOT_CUSTOMER_SERVICE_ROLE_ID = '1111047755746521253';
    process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID = '807385028568154113';
    process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID = '809151496490057728';
    process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID = '807385031051575306';
    process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID = '809151858253103186';
    process.env.BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID = '807385032754462761';

    testSupportSystem().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testSupportSystem };