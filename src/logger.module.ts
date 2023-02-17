import {DynamicModule, Global, Module, ModuleMetadata, Provider} from "@nestjs/common";
import {Logger} from "./Logger";
import {PINO_LOGGER_INSTANCE, PINO_LOGGER_OPTIONS} from "./logger.constants";
import type {LoggerOptions} from "pino";
import pino from "pino";

export interface LoggerModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory?: (...args: any[]) => Promise<LoggerOptions> | LoggerOptions;
}

@Global()
@Module({})
export class LoggerModule {
  constructor() {
  }

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
      providers: [loggerModuleOptions, pinoProvider, Logger],
      exports: [loggerModuleOptions, pinoProvider, Logger]
    };
  }

  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      Logger
    ];

    const pinoProvider: Provider = {
      provide: PINO_LOGGER_INSTANCE,
      useFactory: async (options: LoggerOptions) => pino(options),
      inject: [PINO_LOGGER_OPTIONS],
    }
    providers.push(pinoProvider);

    if (options.useFactory) {
      providers.push({
        provide: PINO_LOGGER_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    }

    return {
      module: LoggerModule,
      imports: options.imports ?? [],
      providers,
      exports: [pinoProvider, Logger]
    };
  }
}
