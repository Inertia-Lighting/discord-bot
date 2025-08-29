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