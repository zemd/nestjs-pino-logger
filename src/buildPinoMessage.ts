import { PinoMessageSymbol } from "./logger.constants";

export type PinoMessageType = {
  message: string;
  mergingObject?: Record<string, any>;
  interpolationValues?: any[];
};

export const buildPinoMessage = (
  message: PinoMessageType,
): PinoMessageType & { [PinoMessageSymbol]: boolean } => {
  return Object.assign(message, { [PinoMessageSymbol]: true });
};
