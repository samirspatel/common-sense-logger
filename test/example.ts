import Logger from '../src/index';

// Example with Datadog format (default)
const logger = new Logger({ serviceName: 'authentication-service', format: 'datadog' });

// Uncomment to test Elasticsearch format:
// const logger = new Logger({ serviceName: 'authentication-service', format: 'elasticsearch' });

// Simulate realistic application logging scenarios

logger.info('Application started', {
  version: '2.4.1',
  environment: process.env.NODE_ENV,
  port: 3000,
  host: '0.0.0.0'
});

logger.debug('Database connection pool initialized', {
  poolSize: 10,
  maxConnections: 50,
  idleTimeout: 30000,
  connectionString: 'postgresql://user:pass@localhost:5432/mydb'
});

logger.info('API request received', {
  method: 'POST',
  path: '/api/v1/users',
  headers: {
    'content-type': 'application/json',
    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'x-request-id': 'req-12345-abcde'
  },
  queryParams: {
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc'
  },
  ip: '192.168.1.100'
});

logger.info('Database query executed', {
  query: 'SELECT * FROM users WHERE status = $1 AND created_at > $2 LIMIT $3',
  params: ['active', '2024-01-01', 20],
  executionTime: 45.23,
  rowsReturned: 15,
  queryId: 'query-67890'
});

logger.info('User action logged', {
  userId: 'user-12345',
  action: 'profile_update',
  changes: {
    email: {
      old: 'old@example.com',
      new: 'new@example.com'
    },
    name: {
      old: 'John Doe',
      new: 'John Smith'
    }
  },
  metadata: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date().toISOString()
  }
});

logger.info('Cache operation', {
  operation: 'SET',
  key: 'user:12345:profile',
  ttl: 3600,
  size: 2048,
  cacheType: 'redis',
  cluster: 'cache-cluster-1'
});

logger.info('Performance metrics', {
  endpoint: '/api/v1/users',
  method: 'GET',
  responseTime: 125.5,
  statusCode: 200,
  memoryUsage: {
    heapUsed: 45678912,
    heapTotal: 67108864,
    external: 1234567
  },
  cpuUsage: 12.5,
  requestSize: 1024,
  responseSize: 8192
});

logger.warn('User login attempt failed: Invalid password', {
  'usr.id': 101,
  'request.ip': '192.168.1.100',
  'dd.trace_id': '7488833333333333333',
  'dd.span_id': '1234567890123456789'
});

logger.warn('Rate limit approaching', {
  userId: 'user-12345',
  endpoint: '/api/v1/search',
  currentRequests: 95,
  limit: 100,
  window: '1m',
  resetAt: new Date(Date.now() + 30000).toISOString()
});

logger.warn('Database connection pool nearly exhausted', {
  activeConnections: 48,
  maxConnections: 50,
  idleConnections: 2,
  waitQueueLength: 5,
  recommendation: 'Consider increasing pool size'
});

logger.error('API request failed', {
  method: 'POST',
  path: '/api/v1/orders',
  statusCode: 500,
  error: {
    name: 'DatabaseError',
    message: 'Connection timeout',
    code: 'ETIMEDOUT',
    stack: 'Error: Connection timeout\n    at Connection.query (/app/db.js:45:12)\n    at OrderService.create (/app/services/order.js:23:8)'
  },
  requestId: 'req-99999',
  userId: 'user-12345',
  timestamp: new Date().toISOString()
});

logger.error('External API call failed', {
  service: 'payment-gateway',
  endpoint: 'https://api.payment.com/v1/charge',
  method: 'POST',
  statusCode: 503,
  responseTime: 5000,
  retries: 3,
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    details: {
      region: 'us-east-1',
      availabilityZone: 'us-east-1a'
    }
  }
});

logger.fatal('Application crash imminent', {
  reason: 'Out of memory',
  memoryUsage: {
    heapUsed: 1073741824,
    heapTotal: 1073741824,
    external: 52428800,
    rss: 2147483648
  },
  lastActions: [
    'Processing large batch job',
    'Loading 1M records into memory',
    'Generating report'
  ],
  stackTrace: 'FATAL ERROR: Reached heap limit\n    at process.memoryUsage (node:internal/process/memory.js:123:12)\n    at BatchProcessor.run (/app/processors/batch.js:456:78)',
  timestamp: new Date().toISOString()
});

logger.debug('Complex nested object example', {
  user: {
    id: 'user-12345',
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          sms: true
        },
        language: 'en-US'
      },
      addresses: [
        {
          type: 'home',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        },
        {
          type: 'work',
          street: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          zip: '10002',
          country: 'USA'
        }
      ]
    },
    roles: ['user', 'premium'],
    metadata: {
      createdAt: '2024-01-15T10:30:00Z',
      lastLogin: '2024-11-08T17:52:48Z',
      loginCount: 1423
    }
  },
  session: {
    id: 'session-abc123',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ipAddress: '192.168.1.100'
  }
});

logger.info('Batch processing completed', {
  batchId: 'batch-78901',
  totalItems: 10000,
  processed: 10000,
  failed: 3,
  duration: 125000,
  itemsPerSecond: 80,
  errors: [
    {
      itemId: 'item-123',
      error: 'Validation failed',
      reason: 'Missing required field: email'
    },
    {
      itemId: 'item-456',
      error: 'Database constraint violation',
      reason: 'Duplicate key'
    }
  ]
});

// Contiguous log messages with different levels but no data
logger.debug('Starting health check');
logger.info('Health check in progress');
logger.warn('Health check taking longer than expected');
logger.error('Health check failed');
logger.fatal('System health critical');

