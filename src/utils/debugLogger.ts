type LogCategory =
  | 'GAME_INIT'
  | 'API'
  | 'DECRYPTION'
  | 'VALIDATION'
  | 'STATE'
  | 'PERSISTENCE'
  | 'PHASE'
  | 'SCORING'
  | 'ERROR';

interface LoggerConfig {
  enabled: boolean;
  categories: Record<LogCategory, boolean>;
  useGroups: boolean;
  includeTimestamps: boolean;
}

const EMOJI_PREFIX: Record<LogCategory, string> = {
  GAME_INIT: '🎮',
  API: '🌐',
  DECRYPTION: '🔐',
  VALIDATION: '✅',
  STATE: '📊',
  PERSISTENCE: '💾',
  PHASE: '🎯',
  SCORING: '🏆',
  ERROR: '🔥',
};

const SEPARATOR = '═'.repeat(60);

class DebugLogger {
  private config: LoggerConfig;
  private stats: Record<LogCategory, number>;
  private activeGroups: number = 0;

  constructor() {
    this.stats = {
      GAME_INIT: 0,
      API: 0,
      DECRYPTION: 0,
      VALIDATION: 0,
      STATE: 0,
      PERSISTENCE: 0,
      PHASE: 0,
      SCORING: 0,
      ERROR: 0,
    };

    this.config = this.loadConfig();
  }

  private loadConfig(): LoggerConfig {
    if (typeof window === 'undefined') {
      return this.getDefaultConfig();
    }

    try {
      const saved = localStorage.getItem('debug-logger-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultConfig(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load debug logger config:', error);
    }

    return this.getDefaultConfig();
  }

  private getDefaultConfig(): LoggerConfig {
    return {
      enabled: process.env.NODE_ENV === 'development',
      categories: {
        GAME_INIT: true,
        API: true,
        DECRYPTION: true,
        VALIDATION: true,
        STATE: true,
        PERSISTENCE: true,
        PHASE: true,
        SCORING: true,
        ERROR: true,
      },
      useGroups: true,
      includeTimestamps: false,
    };
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('debug-logger-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save debug logger config:', error);
    }
  }

  private shouldLog(category: LogCategory): boolean {
    return this.config.enabled && this.config.categories[category];
  }

  private log(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(category)) return;

    this.stats[category]++;

    const emoji = EMOJI_PREFIX[category];
    const indent = '  '.repeat(this.activeGroups);
    const timestamp = this.config.includeTimestamps
      ? `[${new Date().toISOString().split('T')[1].slice(0, -1)}] `
      : '';

    if (data !== undefined) {
      console.log(`${indent}${emoji} ${timestamp}${message}`);
      console.log(`${indent}   `, data);
    } else {
      console.log(`${indent}${emoji} ${timestamp}${message}`);
    }
  }

  group(category: LogCategory, title: string): void {
    if (!this.shouldLog(category)) return;

    const emoji = EMOJI_PREFIX[category];

    if (this.config.useGroups) {
      console.log(`${emoji} ${SEPARATOR}`);
      console.log(`${emoji} ${title}`);
      console.log(`${emoji} ${SEPARATOR}`);
      this.activeGroups++;
    } else {
      console.log(`${emoji} ========== ${title} ==========`);
    }
  }

  groupEnd(): void {
    if (this.activeGroups > 0) {
      this.activeGroups--;
    }
  }

  gameInit(message: string, data?: any): void {
    this.log('GAME_INIT', message, data);
  }

  api(message: string, data?: any): void {
    this.log('API', message, data);
  }

  decryption(message: string, data?: any): void {
    this.log('DECRYPTION', message, data);
  }

  validation(message: string, data?: any): void {
    this.log('VALIDATION', message, data);
  }

  state(message: string, data?: any): void {
    this.log('STATE', message, data);
  }

  persistence(message: string, data?: any): void {
    this.log('PERSISTENCE', message, data);
  }

  phase(message: string, data?: any): void {
    this.log('PHASE', message, data);
  }

  scoring(message: string, data?: any): void {
    this.log('SCORING', message, data);
  }

  error(message: string, error?: any): void {
    if (!this.config.enabled) return;

    this.stats.ERROR++;

    const indent = '  '.repeat(this.activeGroups);
    console.error(`${indent}🔥 ${message}`);

    if (error !== undefined) {
      if (error instanceof Error) {
        console.error(`${indent}   `, error.message);
        if (error.stack) {
          console.error(`${indent}   Stack:`, error.stack);
        }
      } else {
        console.error(`${indent}   `, error);
      }
    }
  }

  enable(): void {
    this.config.enabled = true;
    this.saveConfig();
    console.log('🎮 Debug logger enabled');
  }

  disable(): void {
    this.config.enabled = false;
    this.saveConfig();
    console.log('🎮 Debug logger disabled');
  }

  setCategory(category: LogCategory, enabled: boolean): void {
    this.config.categories[category] = enabled;
    this.saveConfig();
    console.log(`${EMOJI_PREFIX[category]} ${category} ${enabled ? 'enabled' : 'disabled'}`);
  }

  getStats(): Record<LogCategory, number> {
    return { ...this.stats };
  }

  clear(): void {
    this.stats = {
      GAME_INIT: 0,
      API: 0,
      DECRYPTION: 0,
      VALIDATION: 0,
      STATE: 0,
      PERSISTENCE: 0,
      PHASE: 0,
      SCORING: 0,
      ERROR: 0,
    };
    console.clear();
    console.log('🎮 Debug logger stats cleared');
  }
}

const debugLogger = new DebugLogger();

if (typeof window !== 'undefined') {
  (window as any).debugLogger = {
    enable: () => debugLogger.enable(),
    disable: () => debugLogger.disable(),
    setCategory: (category: LogCategory, enabled: boolean) =>
      debugLogger.setCategory(category, enabled),
    getStats: () => debugLogger.getStats(),
    clear: () => debugLogger.clear(),
  };
}

export default debugLogger;
