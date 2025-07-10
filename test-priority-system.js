#!/usr/bin/env node

// Test script to verify the priority system implementation
const { TicketPriority } = require('./dist/support_system/types');
const { TicketPriorityServiceImpl } = require('./dist/support_system/core/priority-service');

console.log('Testing Priority System Implementation...');

// Test priority configurations
const priorityService = new TicketPriorityServiceImpl();

console.log('\n1. Testing priority configurations:');
const priorities = [TicketPriority.Low, TicketPriority.Medium, TicketPriority.High];
priorities.forEach(priority => {
    const config = priorityService.getPriorityConfig(priority);
    console.log(`${priority}: ${config.emoji} ${config.label} (${config.slaHours}h) - Color: ${config.color.toString(16)}`);
});

console.log('\n2. Testing priority storage:');
const testChannelId = 'test-channel-123';

async function testPriorityOperations() {
    // Test creating default priority
    const defaultPriority = await priorityService.createDefaultPriority(testChannelId);
    console.log('Default priority created:', defaultPriority.priority);
    
    // Test getting priority
    const retrieved = await priorityService.getPriority(testChannelId);
    console.log('Retrieved priority:', retrieved?.priority);
    
    // Test SLA deadline check
    const slaExceeded = await priorityService.checkSLADeadline(testChannelId);
    console.log('SLA exceeded:', slaExceeded);
    
    // Test cleanup
    await priorityService.removePriority(testChannelId);
    const afterCleanup = await priorityService.getPriority(testChannelId);
    console.log('After cleanup:', afterCleanup);
}

testPriorityOperations().then(() => {
    console.log('\n✅ Priority system implementation test completed successfully!');
}).catch(error => {
    console.error('\n❌ Priority system test failed:', error);
});