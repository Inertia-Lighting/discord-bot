// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

// Export types
export * from './types/index.js'
;

// Export configuration
export * from './config/index.js'
;

// Export core components
export * from './core/base-handler.js'
;
export * from './core/registry.js'
;
export * from './core/ticket-service.js'
;

// Export categories
export * from './categories/issues.js'
;
export * from './categories/other.js'
;
export * from './categories/partnerships.js'
;
export * from './categories/recovery.js'
;
export * from './categories/transactions.js'
;
export * from './categories/transfers.js'
;

// Export manager
export * from './manager.js'
;

// Export singleton for backward compatibility
export { supportSystemManager as default } from './manager.js'
;