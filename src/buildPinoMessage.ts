import {PinoMessageSymbol} from "./PinoMessageSymbol";

export const buildPinoMessage = (
  message: string,
  mergingObject?: Record<string, any>,
  ...interpolationValues: any[]
) => {
  return {
    [PinoMessageSymbol]: true,
    mergingObject,
    message,
    interpolationValues,
  };
}
