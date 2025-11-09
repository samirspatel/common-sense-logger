import Logger from '../src/index';

describe('Datadog Format Tests', () => {
  let consoleLogSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Basic Logging', () => {
    it('should format info log with Datadog structure', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput).toHaveProperty('@timestamp');
      expect(logOutput).toHaveProperty('status', 'INFO');
      expect(logOutput).toHaveProperty('message', 'Test message');
      expect(logOutput).toHaveProperty('service', 'test-service');
      expect(logOutput).toHaveProperty('hostname');
      expect(logOutput).toHaveProperty('ddsource', 'node');
      expect(logOutput['@timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}[+-]\d{2}:\d{2}$/);
    });

    it('should format debug log with correct status', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.debug('Debug message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.status).toBe('DEBUG');
      expect(logOutput.message).toBe('Debug message');
    });

    it('should format warn log with correct status', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.warn('Warning message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.status).toBe('WARN');
      expect(logOutput.message).toBe('Warning message');
    });

    it('should format error log with correct status', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.error('Error message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.status).toBe('ERROR');
      expect(logOutput.message).toBe('Error message');
    });

    it('should format fatal log with correct status', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.fatal('Fatal message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.status).toBe('FATAL');
      expect(logOutput.message).toBe('Fatal message');
    });
  });

  describe('Timestamp Format', () => {
    it('should use custom ISO format with timezone offset', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const timestamp = logOutput['@timestamp'];
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}[+-]\d{2}:\d{2}$/);
    });

    it('should include nanoseconds in timestamp', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const timestamp = logOutput['@timestamp'];
      const nanosecondsMatch = timestamp.match(/\.(\d{9})/);
      
      expect(nanosecondsMatch).not.toBeNull();
      expect(nanosecondsMatch![1].length).toBe(9);
    });
  });

  describe('Service and Host Fields', () => {
    it('should include service as flat field', () => {
      const logger = new Logger({ serviceName: 'my-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.service).toBe('my-service');
      expect(typeof logOutput.service).toBe('string');
    });

    it('should include hostname as flat field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).toHaveProperty('hostname');
      expect(typeof logOutput.hostname).toBe('string');
      expect(logOutput.hostname.length).toBeGreaterThan(0);
    });

    it('should include ddsource field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.ddsource).toBe('node');
    });
  });

  describe('Data Merging', () => {
    it('should merge object data into log entry', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test message', { userId: '123', action: 'login' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.userId).toBe('123');
      expect(logOutput.action).toBe('login');
      expect(logOutput.message).toBe('Test message');
      expect(logOutput.service).toBe('test-service');
    });

    it('should handle nested objects in data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', { user: { id: '123', name: 'John' } });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user).toEqual({ id: '123', name: 'John' });
    });

    it('should handle arrays in data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', { tags: ['tag1', 'tag2', 'tag3'] });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should add primitive data as data field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', 'primitive string');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.data).toBe('primitive string');
    });

    it('should add array data as data field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', [1, 2, 3]);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.data).toEqual([1, 2, 3]);
    });

    it('should handle null data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', null);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).not.toHaveProperty('data');
    });

    it('should handle undefined data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', undefined);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).not.toHaveProperty('data');
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle deeply nested objects', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      const complexData = {
        user: {
          profile: {
            preferences: {
              theme: 'dark',
              notifications: { email: true }
            }
          }
        }
      };
      logger.info('Test', complexData);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user.profile.preferences.theme).toBe('dark');
      expect(logOutput.user.profile.preferences.notifications.email).toBe(true);
    });

    it('should handle arrays of objects', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test', {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.items).toHaveLength(2);
      expect(logOutput.items[0].id).toBe(1);
      expect(logOutput.items[1].name).toBe('Item 2');
    });

    it('should handle dates in data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      const testDate = new Date('2024-01-01T00:00:00Z');
      logger.info('Test', { createdAt: testDate });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.createdAt).toBe(testDate.toISOString());
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle circular references in data', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      const circular: any = { name: 'test' };
      circular.self = circular;

      logger.info('Test', circular);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.name).toBe('test');
      expect(logOutput.self).toHaveProperty('name', 'test');
      expect(logOutput.self).toHaveProperty('self', '[Circular]');
      expect(logOutput.self.self).toBe('[Circular]');
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON serialization errors gracefully', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      
      const problematicData = {
        toJSON() {
          throw new Error('Cannot serialize');
        }
      };

      logger.info('Test', problematicData);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).toHaveProperty('@timestamp');
      expect(logOutput).toHaveProperty('status', 'INFO');
      expect(logOutput.message).toContain('Test');
      expect(logOutput.service).toBe('test-service');
    });
  });

  describe('Multiple Log Calls', () => {
    it('should format multiple logs independently', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      
      logger.info('First message');
      logger.warn('Second message');
      logger.error('Third message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      
      const firstLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const secondLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      const thirdLog = JSON.parse(consoleLogSpy.mock.calls[2][0]);

      expect(firstLog.status).toBe('INFO');
      expect(firstLog.message).toBe('First message');
      expect(secondLog.status).toBe('WARN');
      expect(secondLog.message).toBe('Second message');
      expect(thirdLog.status).toBe('ERROR');
      expect(thirdLog.message).toBe('Third message');
    });
  });

  describe('Field Override Behavior', () => {
    it('should allow data to override fields (Object.assign behavior)', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      
      logger.info('Test', {
        status: 'OVERRIDDEN',
        message: 'overridden message',
        customField: 'custom value'
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput.status).toBe('OVERRIDDEN');
      expect(logOutput.message).toBe('overridden message');
      expect(logOutput.customField).toBe('custom value');
      expect(logOutput.service).toBe('test-service');
      expect(logOutput.ddsource).toBe('node');
    });
  });

  describe('Default Format', () => {
    it('should default to datadog format when format is not specified', () => {
      const logger = new Logger({ serviceName: 'test-service' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).toHaveProperty('status');
      expect(logOutput).toHaveProperty('ddsource', 'node');
      expect(logOutput.service).toBe('test-service');
    });

    it('should default to datadog format when using string constructor', () => {
      const logger = new Logger('test-service');
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput).toHaveProperty('status');
      expect(logOutput).toHaveProperty('ddsource', 'node');
      expect(logOutput.service).toBe('test-service');
    });
  });

  describe('Inferred System Information', () => {
    it('should include inferred field with system information by default', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput).toHaveProperty('inferred');
      expect(logOutput.inferred).toHaveProperty('system');
      expect(logOutput.inferred).toHaveProperty('runtime');
      expect(logOutput.inferred).toHaveProperty('environment');
      expect(logOutput.inferred).toHaveProperty('hardware');
      expect(logOutput.inferred).toHaveProperty('network');
    });

    it('should include inferred field when includeSystemInfo is explicitly true', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog', includeSystemInfo: true });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput).toHaveProperty('inferred');
    });

    it('should not include inferred field when includeSystemInfo is false', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog', includeSystemInfo: false });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput).not.toHaveProperty('inferred');
    });

    it('should include inferred field by default when using string constructor', () => {
      const logger = new Logger('test-service');
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput).toHaveProperty('inferred');
    });

    it('should include system information in inferred field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const inferred = logOutput.inferred;

      expect(inferred.system).toHaveProperty('platform');
      expect(inferred.system).toHaveProperty('arch');
      expect(inferred.system).toHaveProperty('type');
      expect(inferred.system).toHaveProperty('release');
      expect(inferred.system).toHaveProperty('hostname');
      expect(typeof inferred.system.platform).toBe('string');
      expect(typeof inferred.system.arch).toBe('string');
    });

    it('should include runtime information in inferred field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const inferred = logOutput.inferred;

      expect(inferred.runtime).toHaveProperty('nodeVersion');
      expect(inferred.runtime).toHaveProperty('pid');
      expect(inferred.runtime).toHaveProperty('uptime');
      expect(inferred.runtime).toHaveProperty('memory');
      expect(typeof inferred.runtime.nodeVersion).toBe('string');
      expect(typeof inferred.runtime.pid).toBe('number');
      expect(typeof inferred.runtime.uptime).toBe('number');
      expect(inferred.runtime.memory).toHaveProperty('heapUsed');
      expect(inferred.runtime.memory).toHaveProperty('heapTotal');
    });

    it('should include environment information in inferred field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const inferred = logOutput.inferred;

      expect(inferred.environment).toHaveProperty('nodeEnv');
      expect(inferred.environment).toHaveProperty('timezone');
      expect(inferred.environment).toHaveProperty('locale');
      expect(typeof inferred.environment.nodeEnv).toBe('string');
      expect(typeof inferred.environment.timezone).toBe('string');
      expect(typeof inferred.environment.locale).toBe('string');
    });

    it('should include hardware information in inferred field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const inferred = logOutput.inferred;

      expect(inferred.hardware).toHaveProperty('cpuCores');
      expect(inferred.hardware).toHaveProperty('cpuModel');
      expect(inferred.hardware).toHaveProperty('totalMemory');
      expect(inferred.hardware).toHaveProperty('freeMemory');
      expect(typeof inferred.hardware.cpuCores).toBe('number');
      expect(typeof inferred.hardware.cpuModel).toBe('string');
      expect(typeof inferred.hardware.totalMemory).toBe('number');
      expect(typeof inferred.hardware.freeMemory).toBe('number');
    });

    it('should include network information in inferred field', () => {
      const logger = new Logger({ serviceName: 'test-service', format: 'datadog' });
      logger.info('Test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const inferred = logOutput.inferred;

      expect(inferred.network).toHaveProperty('ipAddresses');
      expect(inferred.network).toHaveProperty('primaryIp');
      expect(Array.isArray(inferred.network.ipAddresses)).toBe(true);
      expect(typeof inferred.network.primaryIp).toBe('string');
    });
  });
});

