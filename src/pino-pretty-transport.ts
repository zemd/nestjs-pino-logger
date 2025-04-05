import pinoPretty from "pino-pretty";
import ms from "ms";
// NOTE: [14.02.23] latest versions of `clean-stack` packages are built on top of ES Modules,
//  but nest.js is not supporting ESM yet. So I had to downgrade the package version and
//  it should be switched to the newer version, once everything works correctly.
//  also see https://stackoverflow.com/questions/74830166/unable-to-import-esm-module-in-nestjs
import cleanStack from "clean-stack";
import type { LogDescriptor } from "pino";

const contextColors = [
  20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68,
  69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134,
  135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
  172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204,
  205, 206, 207, 208, 209, 214, 215, 220, 221,
];

function selectContextColor(context: string): number {
  let hash = 0;

  for (let i = 0; i < context.length; i += 1) {
    // @ts-expect-error ..........
    hash = (hash << 5) - hash + (context.codePointAt(i) | 0);
    hash |= 0; // Convert to 32bit integer
  }

  return contextColors[Math.abs(hash) % contextColors.length] as number;
}

const levelsMap: Record<number, string> = {
  50: "error",
  40: "warn",
  30: "log",
  20: "debug",
  10: "verbose",
};

type ColorMapItemType = {
  start: string;
  end: string;
};
type ColorMapType = Record<string, ColorMapItemType>;
const colorsMap: ColorMapType = {
  red: {
    start: "\x1B[31m",
    end: "\x1B[39m",
  },
  yellow: {
    start: "\x1B[33m",
    end: "\x1B[39m",
  },
  green: {
    start: "\x1B[32m",
    end: "\x1B[39m",
  },
  magenta: {
    start: "\x1B[35m",
    end: "\x1B[39m",
  },
  blue: {
    start: "\x1B[34m",
    end: "\x1B[39m",
  },
  dim: {
    start: "\x1B[2m",
    end: "\x1B[22m",
  },
  bold: {
    start: "\x1B[1m",
    end: "\x1B[22m",
  },
  gray: {
    start: "\x1B[90m",
    end: "\x1B[39m",
  },
};

const levelsColors: Record<string, ColorMapItemType | undefined> = {
  error: colorsMap["red"],
  warn: colorsMap["yellow"],
  log: colorsMap["green"],
  debug: colorsMap["magenta"],
  verbose: colorsMap["blue"],
};

function formatMsg(msg: string, prefix: string): string {
  return msg.split("\n").join(`\n${prefix}`);
}

function formatStack(title: string, stack: string): string {
  const formattedStack = cleanStack(stack, {
    pretty: true,
    basePath: process.cwd(),
  });
  const realTitle = title ? `Error: ${title}` : "";
  return `${colorsMap["red"]?.start}${colorsMap["bold"]?.start}${
    realTitle
  }${colorsMap["bold"]?.end} ${colorsMap["dim"]?.start}${formattedStack.slice(
    realTitle.length,
  )}${colorsMap["dim"]?.end}${colorsMap["red"]?.end}`;
}

export default (opts: any) => {
  let lastTimestampAt = 0;
  return pinoPretty({
    ...opts,
    messageFormat: (log: LogDescriptor): string => {
      try {
        const context = (log["context"] as string | undefined) ?? "unknown";
        const time = log["time"] as number;
        const msg = log["msg"] as string;
        const formattedMsg = (log["formattedMsg"] as string | undefined) ?? msg;
        const logLevel = log["level"] as number;
        const levelLabel = levelsMap[logLevel];
        const err = log["err"] as
          | {
              type: "Error";
              stack: string;
              message: string;
            }
          | undefined;

        const diff = time - (lastTimestampAt || time);

        const color = selectContextColor(context);
        const colorCode = `\u001B[3${color < 8 ? color : `8;5;${color}`}`; // eslint-disable-line sonarjs/no-nested-template-literals
        const levelColor = levelsColors[levelLabel?.toLowerCase() ?? 0];
        const levelStr = `.${levelColor?.start}${levelLabel?.toLowerCase()}${levelColor?.end} › `;
        const prefix =
          [
            `${colorsMap["gray"]?.start}${new Date(time).toISOString()}${colorsMap["gray"]?.end}`,
            `${colorCode};1m${context}\u001B[0m`,
          ].join(" ") + levelStr;
        const duration = `${colorCode}m+${ms(diff)}\u001B[0m`;

        const output: string[] = [];

        if (log["req"] && log["res"]) {
          const responseTime = log["responseTime"] as number;
          const { req, res } = log;
          const { method, url, id: reqId } = req;
          const { statusCode } = res;

          const formattedReqId = `${colorsMap["dim"]?.start}${reqId}${colorsMap["dim"]?.end} ›`;
          const formattedMethod = `${colorsMap["green"]?.start}${colorsMap["bold"]?.start}${method}${colorsMap["bold"]?.end}${colorsMap["green"]?.end}`;
          const formattedResponseTime = `(⮂ ${colorsMap["green"]?.start}${ms(
            responseTime,
          )}${colorsMap["green"]?.end})`;
          const formattedStatusCode = `${colorsMap["blue"]?.start}${statusCode}${colorsMap["blue"]?.end}`;

          output.push(
            `${formattedReqId} ${formattedMethod} ${url} ${formattedStatusCode} ${formattedResponseTime}`,
          );
        } else if (formattedMsg) {
          output.push(
            formatMsg(
              cleanStack(formattedMsg, {
                pretty: false,
                basePath: process.cwd(),
              }),
              prefix,
            ),
          );
        }

        if (err) {
          output.push(
            `${formatStack(err.message, err.stack)}${msg ? `\n${prefix} ${formatMsg(msg, prefix)}` : ""}`, // eslint-disable-line sonarjs/no-nested-template-literals
          );
        }

        lastTimestampAt = time;
        return `${prefix}${output.join(`\n${prefix}`)} ${duration}`; // eslint-disable-line sonarjs/no-nested-template-literals
      } catch (error) {
        console.error(error);
        return "";
      }
    },
  });
};
