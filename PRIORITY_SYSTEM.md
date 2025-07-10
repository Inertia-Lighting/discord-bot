# Ticket Priority System

## Overview

The ticket priority system adds comprehensive priority management to Discord support tickets with SLA tracking, automatic escalation, and visual indicators.

## Features

### Priority Levels

| Priority | Emoji | SLA Time | Color | Use Case |
|----------|-------|----------|-------|----------|
| Low      | 🟢    | 24 hours | Green | General questions and non-urgent issues |
| Medium   | 🟡    | 8 hours  | Yellow | Issues affecting functionality |
| High     | 🔴    | 1 hour   | Red | Critical issues needing immediate attention |

### Key Functionality

1. **Automatic Default Priority**: All new tickets automatically start with Low priority (🟢)
2. **Visual Indicators**: Priority emoji appears in ticket channel names (e.g., `🟢-issues-123456789`)
3. **SLA Tracking**: Automatic deadline calculation based on priority level
4. **Enhanced Embeds**: Ticket embeds show priority information and SLA deadlines
5. **Escalation System**: Automatic pings to customer service when SLA is exceeded
6. **Staff Response Tracking**: Escalation stops when staff responds

## Commands

### `/priority` Command

**Usage**: `/priority level:[low/medium/high]`

**Access**: Available to both ticket owners and staff members

**Examples**:
- `/priority level:medium` - Sets ticket to medium priority (8 hours SLA)
- `/priority level:high` - Sets ticket to high priority (1 hour SLA)

## How It Works

### Ticket Creation
1. User creates a support ticket
2. System automatically sets priority to Low (🟢)
3. Channel name is updated with priority emoji
4. Initial embed shows priority and SLA information

### Priority Changes
1. User or staff uses `/priority` command
2. System updates channel name with new emoji
3. New SLA deadline is calculated
4. Embed is sent showing the priority change

### SLA Monitoring
1. Background service checks tickets every 30 minutes
2. When SLA deadline passes, escalation begins
3. Customer service role is pinged every 2 hours
4. Escalation stops when staff responds

### Staff Response Detection
1. System monitors messages in ticket channels
2. When staff member sends message, response is recorded
3. Escalation is automatically stopped
4. Confirmation message is sent

## Implementation Details

### Database Schema
```sql
model TicketPriorities {
    id                  String        @id @default(cuid())
    channelId           String        @unique
    priority            TicketPriority @default(low)
    slaDeadline         DateTime
    lastStaffResponse   DateTime?
    escalationStarted   DateTime?
    escalationCount     Int           @default(0)
    createdAt           DateTime      @default(now())
    updatedAt           DateTime      @updatedAt
}

enum TicketPriority {
    low
    medium
    high
}
```

### Channel Naming Convention
- **Without Priority**: `category-userid`
- **With Priority**: `emoji-category-userid`
- **Examples**:
  - `🟢-issues-123456789` (Low priority)
  - `🟡-recovery-987654321` (Medium priority)
  - `🔴-transactions-555666777` (High priority)

### Escalation Timeline
1. **SLA Exceeded**: First escalation ping sent immediately
2. **2 Hours Later**: Second escalation ping (if no staff response)
3. **4 Hours Later**: Third escalation ping (continues every 2 hours)
4. **Staff Response**: Escalation stops, confirmation sent

## Integration

### Existing Systems
- **Ticket Creation**: Seamlessly integrates with existing ticket flow
- **Ticket Closure**: Automatically cleans up priority data
- **Ticket Type Changes**: Preserves priority when changing ticket types
- **Permissions**: Respects existing permission system

### Monitoring
- **Startup**: Escalation service starts 2 minutes after bot is ready
- **Background**: Checks for escalations every 30 minutes
- **Logging**: Console logs for escalation events and staff responses

## Benefits

1. **Clear Expectations**: Visual priority indicators and SLA deadlines
2. **Improved Response Times**: Automatic escalation ensures timely responses
3. **User Empowerment**: Users can set priority based on urgency
4. **Staff Efficiency**: Priority-based workflow and clear SLA targets
5. **Accountability**: Tracking of response times and escalations
6. **Reduced Workload**: Automatic escalation management

## Configuration

The system uses existing environment variables and integrates with the current support system configuration. No additional setup required beyond the database schema update.

## Future Enhancements

- Database persistence (currently uses in-memory storage)
- Priority analytics and reporting
- Customizable SLA times per category
- Integration with external ticketing systems
- Advanced escalation rules