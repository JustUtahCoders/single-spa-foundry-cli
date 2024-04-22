import { jest } from "@jest/globals";
import { DeployArgs } from "../src/js-api";

export function checkBaseplateToken(args: any): string {
  const baseplateToken = args.baseplateToken ?? process.env.BASEPLATE_TOKEN;
  if (!baseplateToken) {
    throw Error(
      `baseplate cli requires a baseplateToken to be passed via arguments or the BASEPLATE_TOKEN environment variable`,
    );
  }
  return baseplateToken;
}

export const exitWithError = jest.fn();
export const createDirsSync = jest.fn();

export let baseplateFetchMocks = {};
export let baseplateFetchHistory = {};
export function resetBaseplateFetch() {
  baseplateFetchMocks = {};
  baseplateFetchHistory = {};
}
export const createBaseplateFetch = (deployArgs: DeployArgs) => {
  return async function baseplateFetch(url, init): Promise<any> {
    const mock = baseplateFetchMocks[url];
    if (!mock) {
      throw Error(`baseplateFetch mock not set up for url '${url}'`);
    }

    delete baseplateFetchMocks[url];
    baseplateFetchHistory[url] = init;

    if (mock instanceof Error) {
      throw mock;
    } else if (typeof mock === "number") {
      throw Error(
        `Baseplate API for url '${url}' responded with HTTP status ${mock}`,
      );
    } else if (typeof mock === "object" && mock !== null) {
      return mock;
    } else {
      throw Error(`Invalid baseplateFetch mock - is type '${typeof mock}'`);
    }
  };
};
