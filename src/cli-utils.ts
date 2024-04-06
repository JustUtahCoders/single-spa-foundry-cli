// Regrettably, many CI providers don't yet support NodeJS 18.
// Otherwise, we'd use NodeJS' native fetch implementation
import fetch, { RequestInit } from "node-fetch";
import { error } from "./cli-logger";

export function exitWithError(err: string) {
  error(err);
  process.exit(1);
}

export function checkBaseplateToken(args: BaseplateTokenArgs): string {
  const baseplateToken = args.baseplateToken ?? process.env.BASEPLATE_TOKEN;

  if (!baseplateToken) {
    exitWithError(
      `baseplate cli requires a baseplateToken to be passed via arguments or the BASEPLATE_TOKEN environment variable`,
    );
  }
  return baseplateToken;
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
      console.error(err.message);
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
      console.error(await response.text());
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
