# OpenTelemetry Monitoring Setup

This Discord bot includes OpenTelemetry (OTEL) auto-instrumentation for comprehensive monitoring of metrics, traces, and logs.

## Quick Start

### 1. Basic Setup
The bot is pre-configured with OpenTelemetry auto-instrumentation. No code changes are required.

### 2. Environment Configuration
Copy the example environment file and customize it:
```bash
cp .env.otel.example .env.otel
```

Edit `.env.otel` to configure your OpenTelemetry exporters and settings.

### 3. OTEL LGTM Stack (Recommended)
The easiest way to get started is with the OTEL LGTM Docker image which includes Grafana, Loki, Tempo, Mimir, and OpenTelemetry Collector.

#### Option A: Standalone OTEL LGTM
```bash
docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 grafana/otel-lgtm:latest
```

#### Option B: Using Docker Compose
Uncomment the `otel-lgtm` service in `docker-compose.yml` and run:
```bash
docker-compose up
```

### 4. Configure Bot to Send Data
Set these environment variables (in `.env` or `.env.otel`):
```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

### 5. Access Grafana
Open http://localhost:3000 in your browser to view metrics, traces, and logs.

## Advanced Configuration

### Custom OTEL Collector
You can configure the bot to send data to any OpenTelemetry-compatible collector by setting:
```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector-endpoint
OTEL_EXPORTER_OTLP_HEADERS=api-key=your-api-key
```

### Instrumentation Control
Control which instrumentations are enabled:
```env
OTEL_NODE_ENABLED_INSTRUMENTATIONS=http,express,mongodb
OTEL_NODE_DISABLED_INSTRUMENTATIONS=fs,dns
```

### Sampling Configuration
Configure trace sampling:
```env
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

## What's Instrumented

The auto-instrumentation automatically captures:
- **HTTP requests/responses** (incoming and outgoing)
- **Database operations** (MongoDB, PostgreSQL, etc.)
- **File system operations**
- **DNS lookups**
- **Express.js middleware** (if used)
- **Custom application metrics and traces**

## Troubleshooting

### Enable Debug Logging
```env
OTEL_LOG_LEVEL=debug
```

### Verify Configuration
The bot will log "OpenTelemetry instrumentation initialized successfully" on startup if configured correctly.

### Common Issues
1. **Network connectivity**: Ensure the OTEL collector is reachable
2. **Port conflicts**: OTEL LGTM uses ports 3000, 4317, 4318
3. **Resource limits**: Monitor memory usage with auto-instrumentation enabled

## Links
- [OpenTelemetry Auto-Instrumentation for Node.js](https://opentelemetry.io/docs/zero-code/js/)
- [OTEL LGTM Docker Image](https://hub.docker.com/r/grafana/otel-lgtm)
- [OpenTelemetry Environment Variables](https://opentelemetry.io/docs/concepts/sdk-configuration/)