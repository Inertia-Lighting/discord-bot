// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Initialize the OpenTelemetry Node SDK with automatic instrumentation
const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
});

// Initialize the SDK and register with the OpenTelemetry API
sdk.start();

console.info('OpenTelemetry instrumentation initialized successfully');

// Gracefully shutdown the SDK on process exit
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.info('OpenTelemetry terminated'))
        .catch((error) => console.error('Error terminating OpenTelemetry', error))
        .finally(() => process.exit(0));
});