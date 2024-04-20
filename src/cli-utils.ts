// Regrettably, many CI providers don't yet support NodeJS 18.
// Otherwise, we'd use NodeJS' native fetch implementation
import fetch, { RequestInit } from "node-fetch";
import { error, log, secondary } from "./cli-logger";
import { storageProvider } from "./cli-storage";

const storage = await storageProvider();

export function exitWithError(err: string) {
  error(err);
  process.exit(1);
}

export function checkBaseplateToken(args: BaseplateTokenArgs): string {
  let baseplateToken =
    args.baseplateToken ??
    process.env.BASEPLATE_TOKEN ??
    storage.get("baseplateToken");

  if (!baseplateToken) {
    exitWithError(
      `baseplate cli requires a baseplateToken to be passed via arguments or the BASEPLATE_TOKEN environment variable`,
    );
  }
  return baseplateToken as string;
}

export function createBaseplateFetch(deployArgs: BaseplateTokenArgs) {
  return async function baseplateFetch<Res = any, ReqBody = any>(
    url: string,
    options: BaseplateRequestInit<ReqBody> = {},
  ): Promise<Res> {
    if (!options.headers) {
      options.headers = {};
    }

    if (options.body && typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
      options.headers["content-type"] = "application/json";
    }

    const baseplateToken = checkBaseplateToken(deployArgs);
    options.headers["Authorization"] = `token ${baseplateToken}`;

    const baseUrl = process.env.BASEPLATE_API || "https://baseplate.cloud";

    let response;

    try {
      response = await fetch(baseUrl + url, options as RequestInit);
    } catch (err) {
      log(secondary(err.message), 1);
      exitWithError(
        `Did not receive valid HTTP response from Baseplate API for url ${url}`,
      );
    }

    const contentType = response.headers.get("content-type");

    if (response.ok) {
      if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<Res>;
      } else {
        return response;
      }
    } else {
      log(secondary(await response.text()), 1);
      exitWithError(
        `While calling ${url}, Baseplate API responded with status ${response.status}`,
      );
    }
  };
}

interface BaseplateTokenArgs {
  baseplateToken?: string;
}

type BaseplateRequestInit<RequestBody = object> = Omit<RequestInit, "body"> & {
  body?: undefined | string | RequestBody;
};
