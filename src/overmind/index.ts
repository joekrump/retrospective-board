import { createOvermind, IConfig } from "overmind";
import { createHook } from "overmind-react";
import { config } from "./config";

export const useOvermind = createHook<typeof config>();

export const overmind = createOvermind(config);

declare module "overmind" {
  interface Config extends IConfig<typeof config> {}
}
