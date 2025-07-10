// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

// Export types
export * from './types';

// Export configuration
export * from './config';

// Export core components
export * from './core/base-handler';
export * from './core/registry';
export * from './core/ticket-service';

// Export categories
export * from './categories/issues';
export * from './categories/other';
export * from './categories/partnerships';
export * from './categories/recovery';
export * from './categories/transactions';
export * from './categories/transfers';

// Export manager
export * from './manager';

// Export singleton for backward compatibility
export { supportSystemManager as default } from './manager';