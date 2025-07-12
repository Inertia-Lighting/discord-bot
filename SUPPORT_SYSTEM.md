# Modular Support System

This document describes the new modular support system architecture that replaces the previous monolithic implementation.

## Overview

The support system has been redesigned to be modular, maintainable, and extensible. The new architecture separates concerns and provides clear interfaces for different components.

## Architecture

### Core Components

#### 1. Types (`src/support_system/types/index.ts`)

Defines all the interfaces and types used throughout the support system:

- `SupportCategoryId` - Enum for all support category identifiers
- `SupportTicketContext` - Context information for a support ticket
- `SupportCategoryConfig` - Configuration for a support category
- `SupportCategoryHandler` - Interface for category-specific handlers
- `SupportTicketService` - Interface for ticket management
- `SupportCategoryRegistry` - Interface for category registry

#### 2. Configuration (`src/support_system/config/index.ts`)

Centralizes all configuration loading from environment variables:

- Validates required environment variables on startup
- Provides typed configuration objects
- Includes satisfaction levels for feedback

#### 3. Core Services

##### Registry (`src/support_system/core/registry.ts`)
- Manages registration and retrieval of support categories
- Validates category configurations
- Provides enabled categories for UI

##### Ticket Service (`src/support_system/core/ticket-service.ts`)
- Handles ticket channel creation
- Manages ticket closure and cleanup
- Generates transcripts and handles feedback

##### Base Handler (`src/support_system/core/base-handler.ts`)
- Provides common functionality for all category handlers
- Implements the template method pattern
- Standardizes response formatting

### Support Categories

Each support category is implemented as a separate module with its own handler and configuration:

#### 1. Product Issues (`src/support_system/categories/issues.ts`)
- Handles technical support requests
- Validates product-related inputs
- Provides automated responses for common issues

#### 2. Account Recovery (`src/support_system/categories/recovery.ts`)
- Handles account recovery requests
- Validates user IDs (Roblox and Discord)
- Staff: Database support team

#### 3. Product Transfers (`src/support_system/categories/transfers.ts`)
- Handles product transfer requests
- Validates transfer details
- Staff: Database support team

#### 4. Product Transactions (`src/support_system/categories/transactions.ts`)
- Handles transaction issues
- Validates purchase information
- Staff: Product purchases support team

#### 5. Partnership Requests (`src/support_system/categories/partnerships.ts`)
- Handles partnership applications
- Validates group information
- Staff: Partnership support team

#### 6. Other Questions (`src/support_system/categories/other.ts`)
- Handles general support questions
- Minimal validation requirements
- Staff: General support and customer service

### Manager (`src/support_system/manager.ts`)

The main orchestrator that:
- Initializes all categories with proper role assignments
- Provides a unified interface for the support system
- Handles modal submissions and ticket operations

## Usage

### Adding a New Support Category

1. **Create the handler class** extending `BaseSupportCategoryHandler`:

```typescript
export class NewCategoryHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.NewCategory;

    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>) {
        return [
            {
                question: 'Your question?',
                answer: interaction.fields.getTextInputValue('field_id'),
            },
        ];
    }

    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        // Your validation logic
        return true;
    }
}
```

2. **Create the configuration**:

```typescript
export const NewCategoryConfig = {
    id: SupportCategoryId.NewCategory,
    name: 'New Category',
    description: 'Description for the new category',
    staffRoleIds: [],
    isEnabled: true,
    modalConfig: {
        title: 'New Category Questions',
        customId: 'new_category_modal',
        components: [
            // Your modal components
        ],
    } as Discord.ModalComponentData,
};
```

3. **Register in the manager**:

Add the category to the `initializeCategories()` method in `SupportSystemManager`.

4. **Create the modal handler**:

Create a new file in `src/custom_interactions/modal/support_system/` following the existing pattern.

### Modifying Existing Categories

To modify an existing category:

1. Update the handler class in `src/support_system/categories/`
2. Modify the configuration as needed
3. Update the modal handler if the custom ID changed

### Configuration Changes

Environment variables are centralized in the configuration service. To add new variables:

1. Add to the `requiredEnvVars` array
2. Add to the configuration object structure
3. Update the `SupportSystemConfig` interface if needed

### Required Environment Variables

The following environment variables are required for the support system:

- `BOT_SUPPORT_TICKETS_CATEGORY_ID` - Discord category ID for support tickets
- `BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID` - Discord channel ID for ticket transcripts
- `BOT_SUPPORT_TICKETS_SLA_NOTIFICATIONS_CHANNEL_ID` - Discord channel ID for SLA notifications
- `BOT_STAFF_ROLE_ID` - Discord role ID for general staff
- `BOT_CUSTOMER_SERVICE_ROLE_ID` - Discord role ID for customer service
- `BOT_SUPPORT_STAFF_DATABASE_ROLE_ID` - Discord role ID for database support staff
- `BOT_SUPPORT_STAFF_OTHER_ROLE_ID` - Discord role ID for other support staff
- `BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID` - Discord role ID for product issues support staff
- `BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID` - Discord role ID for product purchases support staff
- `BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID` - Discord role ID for partnership requests support staff

## Benefits

### 1. Modularity
- Each category is self-contained
- Easy to add, remove, or modify categories
- Clear separation of concerns

### 2. Maintainability
- Smaller, focused files
- Consistent patterns across categories
- Clear interfaces and contracts

### 3. Extensibility
- Easy to add new categories
- Plugin-like architecture
- Configurable behavior

### 4. Testability
- Each component can be tested independently
- Clear interfaces for mocking
- Isolated business logic

### 5. Type Safety
- Full TypeScript support
- Compile-time error checking
- IntelliSense support

## Migration

The new system is designed to be backward compatible:

- All existing modal custom IDs are preserved
- Existing environment variables are still used
- User experience remains the same

The old `support_system_handler.ts` can be safely removed after the new system is verified to work correctly.

## Database-Driven Workflows

The support system now uses a comprehensive database-driven approach for ticket management:

### Creation Workflow
1. **Ticket Creation**: When a support ticket is created, it's stored in the database with relevant metadata
2. **No Initial Priority**: Tickets start without a priority set
3. **Staff Message Restriction**: Staff cannot send messages in the channel until a priority is set
4. **Channel Creation**: Discord channel is created with proper permissions

### Command Workflows
- **`/ticket_type` command**: Updates ticket type metadata in the database and reflects changes in the channel
- **`/priority` command**: Updates priority metadata in database and channel; SLA countdown starts from first use of this command
- **`/close_ticket` command**: Updates database as needed, deletes the ticket channel, sends transcript to appropriate locations with feedback request

### SLA Notification Workflows
- **Staff Non-Response**: If support staff do not respond within SLA, ping relevant ticket role every 24 hours in the ticket channel
- **Half-SLA Notifications**: If support staff do not respond within half the SLA time after ticket owner sends a message, ping relevant ticket role every 24 hours in the SLA notification channel
- **User Inactivity**: If ticket owner does not respond within 24 hours after a staff message, ping ticket owner every 24 hours in the ticket channel as a reminder
- **Auto-Close**: If ticket owner's last message is over 7 days old (and a staff response has come after that), auto-close the ticket with no feedback requested

### Startup Cleanup
- **Orphaned Tickets**: On bot startup, check all open tickets in the database; if the associated Discord channel doesn't exist, delete the ticket record
- **Data Integrity**: Ensures database and Discord state remain synchronized

## Error Handling

The system includes comprehensive error handling:

- Environment variable validation on startup
- Input validation for each category
- Graceful degradation for failures
- Detailed error logging

## Future Enhancements

The modular architecture enables future enhancements such as:

- Database-driven category configuration
- Dynamic category enabling/disabling
- Custom validation rules per category
- Integration with external systems
- Analytics and reporting
- A/B testing of different flows