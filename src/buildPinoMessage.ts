import {PinoMessageSymbol} from "./logger.constants";

export type PinoMessageType = {
  message: string;
  mergingObject?: Record<string, any>;
  interpolationValues?: any[];
};

export const buildPinoMessage = (message: PinoMessageType) => {
  return {
    [PinoMessageSymbol]: true,
    mergingObject: message.mergingObject,
    message: message.message,
    interpolationValues: message.interpolationValues
  };
}
