import { createOvermind, IConfig } from "overmind";
import { createHook } from "overmind-react";
import { config } from "./config";

export const useOvermind = createHook<typeof config>();

export const overmind = createOvermind(config, {
  devtools: false,
});

declare module "overmind" {
  interface Config extends IConfig<typeof config> {}
}
