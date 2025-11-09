import * as os from 'os';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type LogFormat = 'datadog' | 'elasticsearch';

interface LoggerConfig {
  serviceName: string;
  format?: LogFormat;
  includeSystemInfo?: boolean;
}

interface LogEntry {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private serviceName: string;
  private hostname: string;
  private format: LogFormat;
  private includeSystemInfo: boolean;

  constructor(config: LoggerConfig | string) {
    // Support both object config and simple string (serviceName) for pit of success
    if (typeof config === 'string') {
      this.serviceName = config;
      this.format = 'datadog'; // default format
      this.includeSystemInfo = true; // default to enabled
    } else {
      this.serviceName = config.serviceName;
      this.format = config.format || 'datadog';
      this.includeSystemInfo = config.includeSystemInfo !== undefined ? config.includeSystemInfo : true; // default to enabled
    }
    
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.hostname = os.hostname();
  }

  private formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private formatTimestampISO(): string {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours24 = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const nanoseconds = String(now.getMilliseconds() * 1000000).padStart(9, '0');
    return `${year}-${month}-${day}T${hours24}:${mins}:${secs}.${nanoseconds}${sign}${hours}:${minutes}`;
  }

  private formatTimestampISO8601(): string {
    return new Date().toISOString();
  }

  private getColorCode(level: LogLevel): string {
    const colors = {
      debug: '\x1b[90m',      // gray/dim
      info: '\x1b[34m',       // blue
      warn: '\x1b[33m',       // yellow
      error: '\x1b[31m',      // red
      fatal: '\x1b[91m',      // bright red
    };
    return colors[level];
  }

  private getBgColorCode(level: LogLevel): string {
    const bgColors = {
      debug: '\x1b[100m',     // gray background
      info: '\x1b[44m',       // blue background
      warn: '\x1b[43m',       // yellow background
      error: '\x1b[41m',      // red background
      fatal: '\x1b[101m',     // bright red background
    };
    return bgColors[level];
  }

  private resetColor(): string {
    return '\x1b[0m';
  }

  private cyan(): string {
    return '\x1b[36m';
  }

  private formatLevelBox(level: LogLevel): string {
    const bgColor = this.getBgColorCode(level);
    const whiteText = '\x1b[37m'; // white text
    const reset = this.resetColor();
    const levelUpper = level.toUpperCase().padEnd(5);
    return `${bgColor}${whiteText}${levelUpper}${reset}`;
  }

  private formatDataForDev(data: any): string {
    if (data === undefined || data === null) {
      return '';
    }

    try {
      const jsonStr = JSON.stringify(data, this.getCircularReplacer(), 2);
      const cyan = this.cyan();
      const reset = this.resetColor();
      
      // Highlight values in cyan - match "key": value patterns
      const highlighted = jsonStr.replace(/"([^"]+)":\s*([^\n,}]+)/g, (match, key, value) => {
        // Trim whitespace from value
        const trimmedValue = value.trim();
        // Don't highlight if it's an opening brace or bracket (nested object/array)
        if (trimmedValue === '{' || trimmedValue === '[') {
          return match;
        }
        return `"${key}": ${cyan}${trimmedValue}${reset}`;
      });
      
      return ` ${highlighted}`;
    } catch (error) {
      return ` ${this.cyan()}[Unable to serialize data]${this.resetColor()}`;
    }
  }

  private getCircularReplacer(): (key: string, value: any) => any {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  private getInferredData(): any {
    try {
      const networkInterfaces = os.networkInterfaces();
      const ipAddresses: string[] = [];
      
      Object.keys(networkInterfaces).forEach((interfaceName) => {
        const interfaces = networkInterfaces[interfaceName];
        if (interfaces) {
          interfaces.forEach((iface) => {
            if (iface && iface.family === 'IPv4' && !iface.internal) {
              ipAddresses.push(iface.address);
            }
          });
        }
      });

      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model : 'unknown';
      
      const memoryUsage = process.memoryUsage();
      
      return {
        system: {
          platform: os.platform(),
          arch: os.arch(),
          type: os.type(),
          release: os.release(),
          hostname: this.hostname,
        },
        runtime: {
          nodeVersion: process.version,
          pid: process.pid,
          uptime: Math.floor(process.uptime()),
          memory: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss,
            arrayBuffers: memoryUsage.arrayBuffers,
          },
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'unknown',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: Intl.DateTimeFormat().resolvedOptions().locale,
        },
        hardware: {
          cpuCores: os.cpus().length,
          cpuModel: cpuModel,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
        },
        network: {
          ipAddresses: ipAddresses.length > 0 ? ipAddresses : ['none'],
          primaryIp: ipAddresses.length > 0 ? ipAddresses[0] : 'none',
        },
      };
    } catch (error) {
      return {
        error: 'Failed to gather system information',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatDevLog(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.formatTimestamp();
    const levelBox = this.formatLevelBox(level);
    const dataStr = this.formatDataForDev(data);
    
    return `[${timestamp}] ${levelBox} ${message}${dataStr}`;
  }

  private formatDatadogLog(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      '@timestamp': this.formatTimestampISO(),
      message,
      status: level.toUpperCase(),
      service: this.serviceName,
      hostname: this.hostname,
      ddsource: 'node',
    };

    if (this.includeSystemInfo) {
      entry.inferred = this.getInferredData();
    }

    // Merge data fields directly into the entry (not nested)
    if (data !== undefined && data !== null) {
      if (typeof data === 'object' && !Array.isArray(data)) {
        Object.assign(entry, data);
      } else {
        // If data is an array or primitive, add it as a 'data' field
        entry.data = data;
      }
    }

    try {
      return JSON.stringify(entry, this.getCircularReplacer());
    } catch (error) {
      const errorEntry: LogEntry = {
        '@timestamp': this.formatTimestampISO(),
        message: `${message} [Log serialization error]`,
        status: level.toUpperCase(),
        service: this.serviceName,
        hostname: this.hostname,
        ddsource: 'node',
      };
      if (this.includeSystemInfo) {
        errorEntry.inferred = this.getInferredData();
      }
      return JSON.stringify(errorEntry);
    }
  }

  private formatElasticsearchLog(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      '@timestamp': this.formatTimestampISO8601(),
      level: level.toUpperCase(),
      message,
      service: {
        name: this.serviceName,
      },
      host: {
        name: this.hostname,
      },
    };

    if (this.includeSystemInfo) {
      entry.inferred = this.getInferredData();
    }

    // Merge data fields directly into the entry (not nested)
    if (data !== undefined && data !== null) {
      if (typeof data === 'object' && !Array.isArray(data)) {
        Object.assign(entry, data);
      } else {
        // If data is an array or primitive, add it as a 'data' field
        entry.data = data;
      }
    }

    try {
      return JSON.stringify(entry, this.getCircularReplacer());
    } catch (error) {
      const errorEntry: LogEntry = {
        '@timestamp': this.formatTimestampISO8601(),
        level: level.toUpperCase(),
        message: `${message} [Log serialization error]`,
        service: {
          name: this.serviceName,
        },
        host: {
          name: this.hostname,
        },
      };
      if (this.includeSystemInfo) {
        errorEntry.inferred = this.getInferredData();
      }
      return JSON.stringify(errorEntry);
    }
  }

  private formatProdLog(level: LogLevel, message: string, data?: any): string {
    switch (this.format) {
      case 'datadog':
        return this.formatDatadogLog(level, message, data);
      case 'elasticsearch':
        return this.formatElasticsearchLog(level, message, data);
      default:
        return this.formatDatadogLog(level, message, data);
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const output = this.isDevelopment
      ? this.formatDevLog(level, message, data)
      : this.formatProdLog(level, message, data);
    
    console.log(output);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  fatal(message: string, data?: any): void {
    this.log('fatal', message, data);
  }
}

export default Logger;
export { Logger, LogLevel, LogFormat, LoggerConfig, LogEntry };
