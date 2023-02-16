# Nestjs-Pino-Logger

## Motivation

The motivation of this package is to provide a pino logger for nestjs framework with near identical behaviour of the standard nestjs logger and to provide a good defaults for the logger. This also means that pino logger can be customized as needed without need to configure the Logger service, that makes the package flexible and lightweight. 

## Installation

at first make sure you have access to the github, and update your `.npmrc` file:

```
//npm.pkg.github.com/:_authToken=${GITHUB_AUTH_TOKEN}
@zemd:registry=https://npm.pkg.github.com
always-auth=true
```

```bash
npm install --save @zemd/nestjs-pino-logger
```

## Usage

let's say you are defining AppModule:
```typescript
// app.module.ts
import { LoggerModule } from '@zemd/nestjs-pino-logger';
import {ConfigModule} from "@nestjs/config";
import pinoConfig from "./config/pino.config";
import pinoHttpConfig from "./config/pino-http.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [pinoConfig, pinoHttpConfig],
            // ... any other configuration options you want to use
        }),
        LoggerModule
    ]
})
class AppModule {}
```

then you should inject `Logger` into your main app:

```typescript
// main.ts
import { Logger } from '@zemd/nestjs-pino-logger';
import pinoHttp from "pino-http";
import type { Options } from 'pino-http';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));

// if you want to use pino-http ↓
app.use(pinoHttp({
    ...configService.get<Options>('pino-http'),
    logger: app.get(Logger).getPinoInstance(),
}));
```

now let's look closer at the `pino.config.ts` and `pino-http.config.ts` files:

```typescript
// pino.config.ts
import {registerAs} from "@nestjs/config";
import pino from "pino";
import {customLevels} from "@zemd/nestjs-pino-logger";

// the nestjs-pino-logger requires that configuration service returns a configuration object with a `pino` key
export default registerAs('pino', (): Partial<LoggerOptions> => {
    const targets: pino.TransportTargetOptions<Record<string, any>>[] = [];
    
    if (process.env.NODE_ENV !== "production") {
        // you don't need to use this transport in production, usually you would want to send logs as json object to the observability service
        targets.push({
            target: "@zemd/nestjs-pino-logger/pino-pretty-transport.js", //path.resolve(__dirname, './pino-pretty-transport.js'),
            level: process.env.NODE_ENV === "development" ? "verbose" : "error",
            options: {
                colorize: false,
                translateTime: true,
                include: '',
                singleLine: false,
                hideObject: true,
            },
        });
    }

    const transport = targets.length ? {targets} : undefined;

    return {
        customLevels,
        useOnlyCustomLevels: true, // this is required! and you should use this config explicitly to avoid any unexpected behaviour
        transport,
    };
});
```

that's basically it, if you want to use pino logger in your nestjs application, you can use any kind on configuration, but at the same time you can use default nestjs logger.

```typescript
// pino-http.config.ts
import {registerAs} from "@nestjs/config";
import {Options} from "pino-http";
import * as crypto from "node:crypto";

export default registerAs('pino-http', (): Partial<Options> => {
    return {
        level: process.env.LOG_LEVEL ?? "verbose",
        genReqId: (req, res) => {
            // this is not required 
            if (req.id) {
                return req.id;
            }
            return crypto.randomUUID();
        },
        customProps: () => ({
            // by default there is no "context" provided inside the middleware, so we need to add it manually
            context: 'http',
        }),
        // pino-http types don't accept custom log levels, so we need to use ts-ignore here,
        // if you want to use one log level for all requests, just use `useLevel` option.
        // @ts-ignore 
        customLogLevel: function (req, res, err) {
            if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn'
            } else if (res.statusCode >= 500 || err) {
                return 'error'
            } else if (res.statusCode >= 300 && res.statusCode < 400) {
                return 'verbose'
            }
            return 'log'
        },
    };
});
```

## License

`@zemd/nestjs-pino-logger` released under the [LGPL-3.0 License](https://www.gnu.org/licenses/lgpl-3.0.html).

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/static/v1?label=UNITED24&message=support%20Ukraine&color=blue)](https://u24.gov.ua/)
