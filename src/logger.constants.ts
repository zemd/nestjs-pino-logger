export const PinoMessageSymbol = Symbol('__PinoMessageSymbol');
export const PINO_LOGGER_OPTIONS = 'PinoLoggerOptions';
export const PINO_LOGGER_INSTANCE = 'PinoLoggerInstance';
export const customLevels = {
  error: 50,
  warn: 40,
  log: 30,
  debug: 20,
  verbose: 10,
} as const;
