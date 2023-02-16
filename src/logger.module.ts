import {Global, Module, NestModule} from "@nestjs/common";
import {Logger} from "./Logger";

@Global()
@Module({
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule implements NestModule {
  configure(): any {
  }
}
