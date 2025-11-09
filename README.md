# common-sense-logger

> A production-ready TypeScript logger with beautiful development output and configurable JSON formats for Datadog and Elasticsearch.

[![npm version](https://img.shields.io/npm/v/common-sense-logger.svg)](https://www.npmjs.com/package/common-sense-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

A lightweight, zero-dependency logger designed for modern Node.js applications. Automatically switches between human-readable colored output in development and structured JSON logs in production, with built-in support for Datadog and Elasticsearch formats.

## Features

- **Beautiful Development Output** - Colored, human-readable logs with timestamps and level indicators
- **Production-Ready JSON** - Structured logs compatible with Datadog and Elasticsearch
- **Automatic System Info** - Automatically captures system, runtime, hardware, and network information
- **Zero Dependencies** - Uses only Node.js built-in modules
- **TypeScript First** - Full TypeScript support with type definitions
- **Easy to Use** - Simple API with sensible defaults
- **Circular Reference Safe** - Handles circular references gracefully
- **Configurable** - Customize format, system info inclusion, and more

## Installation

```bash
npm install common-sense-logger
```

## Quick Start

```typescript
import Logger from 'common-sense-logger';

// Simple usage with string (defaults to Datadog format)
const logger = new Logger('my-service');

// Or with configuration object
const logger = new Logger({
  serviceName: 'my-service',
  format: 'datadog', // or 'elasticsearch'
  includeSystemInfo: true // default: true
});

// Start logging
logger.info('Application started');
logger.debug('Debug information', { userId: '123', action: 'login' });
logger.warn('Warning message', { threshold: 90, current: 95 });
logger.error('Error occurred', { error: new Error('Something went wrong') });
logger.fatal('Critical failure', { reason: 'Out of memory' });
```

## Development vs Production

The logger automatically detects your environment via `NODE_ENV`:

### Development Mode (`NODE_ENV=development`)

Beautiful, colored output optimized for terminal viewing:

```
[2024-11-08 17:52:48.730] INFO  Application started
[2024-11-08 17:52:48.731] DEBUG Database connection established {
  "host": "localhost",
  "port": 5432
}
```

### Production Mode (`NODE_ENV=production` or not set)

Structured JSON output for log aggregation systems:

```json
{"@timestamp":"2024-11-08T17:52:48.730Z","level":"INFO","message":"Application started","service":{"name":"my-service"},"host":{"name":"server-01"},"inferred":{...}}
```

## Log Formats

### Datadog Format (Default)

Optimized for Datadog log ingestion:

```typescript
const logger = new Logger({
  serviceName: 'authentication-service',
  format: 'datadog'
});

logger.warn('User login failed', {
  'usr.id': 101,
  'request.ip': '192.168.1.100',
  'dd.trace_id': '7488833333333333333'
});
```

**Output:**
```json
{
  "@timestamp": "2024-11-08T17:52:48.284934328+01:00",
  "message": "User login failed",
  "status": "WARN",
  "service": "authentication-service",
  "hostname": "web-server-1",
  "ddsource": "node",
  "usr.id": 101,
  "request.ip": "192.168.1.100",
  "dd.trace_id": "7488833333333333333",
  "inferred": { ... }
}
```

### Elasticsearch Format

Optimized for Elasticsearch/OpenSearch ingestion:

```typescript
const logger = new Logger({
  serviceName: 'api-service',
  format: 'elasticsearch'
});

logger.info('API request received', {
  method: 'POST',
  path: '/api/users',
  'http.request.id': 'req-12345'
});
```

**Output:**
```json
{
  "@timestamp": "2024-11-08T17:52:48.284Z",
  "level": "INFO",
  "message": "API request received",
  "service": {
    "name": "api-service"
  },
  "host": {
    "name": "web-server-1"
  },
  "method": "POST",
  "path": "/api/users",
  "http.request.id": "req-12345",
  "inferred": { ... }
}
```

## Automatic System Information

By default, the logger automatically includes an `inferred` field with comprehensive system information:

```json
{
  "inferred": {
    "system": {
      "platform": "darwin",
      "arch": "arm64",
      "type": "Darwin",
      "release": "25.0.0",
      "hostname": "server-01"
    },
    "runtime": {
      "nodeVersion": "v20.18.0",
      "pid": 12345,
      "uptime": 3600,
      "memory": {
        "heapUsed": 45678912,
        "heapTotal": 67108864,
        "external": 1234567,
        "rss": 36061184,
        "arrayBuffers": 10515
      }
    },
    "environment": {
      "nodeEnv": "production",
      "timezone": "America/Chicago",
      "locale": "en-US"
    },
    "hardware": {
      "cpuCores": 8,
      "cpuModel": "Apple M4",
      "totalMemory": 34359738368,
      "freeMemory": 1708949504
    },
    "network": {
      "ipAddresses": ["192.168.1.100"],
      "primaryIp": "192.168.1.100"
    }
  }
}
```

To disable system information collection:

```typescript
const logger = new Logger({
  serviceName: 'my-service',
  includeSystemInfo: false
});
```

## Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `debug` | Detailed debugging information | Development debugging, verbose tracing |
| `info` | General informational messages | Application flow, important events |
| `warn` | Warning messages | Deprecations, recoverable errors, rate limits |
| `error` | Error messages | Exceptions, failed operations |
| `fatal` | Critical failures | System crashes, unrecoverable errors |

## API Reference

### Constructor

```typescript
new Logger(config: LoggerConfig | string)
```

**Parameters:**

- `config` (string): Service name (uses defaults for all other options)
- `config` (LoggerConfig): Configuration object

**LoggerConfig Interface:**

```typescript
interface LoggerConfig {
  serviceName: string;           // Required: Service name for log entries
  format?: 'datadog' | 'elasticsearch';  // Optional: Output format (default: 'datadog')
  includeSystemInfo?: boolean;   // Optional: Include inferred system info (default: true)
}
```

### Methods

All log methods follow the same signature:

```typescript
logger.debug(message: string, data?: any): void
logger.info(message: string, data?: any): void
logger.warn(message: string, data?: any): void
logger.error(message: string, data?: any): void
logger.fatal(message: string, data?: any): void
```

**Parameters:**

- `message` (string): The log message
- `data` (optional): Additional context data (object, array, or primitive)

## Examples

### Basic Logging

```typescript
import Logger from 'common-sense-logger';

const logger = new Logger('my-service');

logger.info('Application started');
logger.debug('Processing request', { requestId: '123' });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.error('Database connection failed', { error: 'Connection timeout' });
logger.fatal('Out of memory', { heapUsed: 1073741824 });
```

### Logging with Complex Objects

```typescript
const logger = new Logger({
  serviceName: 'api-service',
  format: 'elasticsearch'
});

logger.info('User action', {
  userId: 'user-12345',
  action: 'profile_update',
  changes: {
    email: { old: 'old@example.com', new: 'new@example.com' },
    name: { old: 'John Doe', new: 'John Smith' }
  },
  metadata: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date().toISOString()
  }
});
```

### Error Handling

```typescript
const logger = new Logger('api-service');

try {
  await processRequest();
} catch (error) {
  logger.error('Request processing failed', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    requestId: req.id,
    userId: req.user?.id
  });
}
```

### Performance Metrics

```typescript
const logger = new Logger('api-service');

const startTime = Date.now();
await processRequest();
const duration = Date.now() - startTime;

logger.info('Request processed', {
  endpoint: '/api/users',
  method: 'GET',
  responseTime: duration,
  statusCode: 200,
  memoryUsage: process.memoryUsage()
});
```

### Disabling System Information

```typescript
const logger = new Logger({
  serviceName: 'my-service',
  includeSystemInfo: false // Reduces log size if system info not needed
});
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `development` for colored output, anything else for JSON output

### Format Comparison

| Feature | Datadog | Elasticsearch |
|---------|---------|---------------|
| Timestamp Format | ISO 8601 with nanoseconds + timezone | ISO 8601 UTC |
| Level Field | `status` | `level` |
| Service Field | Flat `service` string | Nested `service.name` |
| Host Field | Flat `hostname` string | Nested `host.name` |
| Special Fields | `ddsource: "node"` | None |

## Best Practices

1. **Use appropriate log levels**: Reserve `debug` for development, `info` for important events, `warn` for recoverable issues, `error` for exceptions, and `fatal` for critical failures.

2. **Include context**: Always provide relevant context in the `data` parameter:
   ```typescript
   logger.error('Payment failed', {
     userId: user.id,
     orderId: order.id,
     amount: order.amount,
     paymentMethod: order.paymentMethod
   });
   ```

3. **Structured data**: Use consistent field names across your application for easier log aggregation and searching.

4. **Don't log sensitive information**: Avoid logging passwords, tokens, credit card numbers, or other sensitive data.

5. **Use service names**: Always set a meaningful `serviceName` to identify logs from different services in a microservices architecture.

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import Logger, { LoggerConfig, LogLevel, LogFormat } from 'common-sense-logger';

const config: LoggerConfig = {
  serviceName: 'my-service',
  format: 'datadog',
  includeSystemInfo: true
};

const logger = new Logger(config);
```

## Testing

Run the example script to see the logger in action:

```bash
# Development mode (colored output)
npm run example

# Production mode (JSON output)
npm run example:prod
```

Run the test suite:

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Samir Patel](https://samirpatel.me)

---

Made in Austin
