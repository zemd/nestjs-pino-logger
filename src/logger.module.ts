import {
  type DynamicModule,
  Global,
  Module,
  type ModuleMetadata,
  type Provider,
} from "@nestjs/common";
import { Logger } from "./Logger";
import { PINO_LOGGER_INSTANCE, PINO_LOGGER_OPTIONS } from "./logger.constants";
import type { LoggerOptions } from "pino";
import pino from "pino";

export interface LoggerModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  inject?: any[];
  useFactory: (...args: any[]) => Promise<LoggerOptions> | LoggerOptions;
}

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerOptions): DynamicModule {
    const loggerModuleOptions = {
      provide: PINO_LOGGER_OPTIONS,
      useValue: options,
    };

    const pinoProvider: Provider = {
      provide: PINO_LOGGER_INSTANCE,
      useFactory: () => {
        return pino(options);
      },
    };

    return {
      module: LoggerModule,
      providers: [Logger, loggerModuleOptions, pinoProvider],
      exports: [Logger, loggerModuleOptions, pinoProvider],
    };
  }

  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: PINO_LOGGER_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const pinoProvider: Provider = {
      provide: PINO_LOGGER_INSTANCE,
      useFactory: (options: LoggerOptions) => {
        return pino(options);
      },
      inject: [PINO_LOGGER_OPTIONS],
    };

    return {
      module: LoggerModule,
      imports: options.imports ?? [],
      providers: [optionsProvider, pinoProvider, Logger],
      exports: [pinoProvider, Logger],
    };
  }
}
