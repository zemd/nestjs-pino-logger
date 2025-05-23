import { Inject, Injectable, type LoggerService } from "@nestjs/common";
import * as util from "node:util";
import type { Logger as PinoLogger } from "pino";
import crypto from "node:crypto";
import { PINO_LOGGER_INSTANCE, PinoMessageSymbol } from "./logger.constants";

@Injectable()
export class Logger implements LoggerService {
  private static cache = new Map<string, any>();
  private readonly pinoInstance: PinoLogger;

  constructor(@Inject(PINO_LOGGER_INSTANCE) pinoInstance: PinoLogger) {
    this.pinoInstance = pinoInstance;
  }

  debug(message: any, ...optionalParams: any[]): any {
    this.doLog("debug", message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]): any {
    this.doLog("error", message, ...optionalParams);
  }

  log(message: any, ...optionalParams: any[]): any {
    this.doLog("log", message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): any {
    this.doLog("verbose", message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): any {
    this.doLog("warn", message, ...optionalParams);
  }

  private doLog(level: string, message: any, ...optionalParams: any[]): any {
    const context = optionalParams.at(-1);
    const params = optionalParams.slice(0, -1).filter((p) => {
      return p !== undefined;
    });
    const inst = this.getPinoChildInst(context);

    // build output
    if (
      typeof message === "object" &&
      !Array.isArray(message) &&
      message[PinoMessageSymbol]
    ) {
      const formattedMsg = util.formatWithOptions(
        { colors: true },
        message.message,
        ...message.interpolationValues,
        ...params,
      );
      const msg = util.formatWithOptions(
        { colors: false },
        message.message,
        ...message.interpolationValues,
        ...params,
      );

      inst[level](
        Object.assign({}, message.mergingObject, { formattedMsg }),
        msg,
      );
    }
    if (message instanceof Error) {
      const msg =
        params.length > 0
          ? util.formatWithOptions({ colors: true }, ...params)
          : "";
      inst[level]({ err: message }, msg);
    } else {
      const formattedMsg = util.formatWithOptions(
        { colors: true },
        message,
        ...params,
      );
      const msg = util.formatWithOptions({ colors: false }, message, ...params);

      inst[level]({ formattedMsg }, msg);
    }
  }

  private getPinoChildInst(context?: string) {
    const ctx = context ?? crypto.randomUUID();
    let inst;
    if (Logger.cache.has(ctx)) {
      const instConfig = Logger.cache.get(ctx);
      clearTimeout(instConfig.timeout);
      inst = instConfig.inst;
    } else {
      inst = this.pinoInstance.child({ context: ctx });
    }
    const timeout = setTimeout(() => {
      Logger.cache.delete(ctx);
    }, 60_000);
    Logger.cache.set(ctx, { inst, timeout });
    return inst;
  }
}
