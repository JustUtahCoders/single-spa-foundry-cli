export function exitWithError(err: string) {
  console.error(err);
  process.exit(1);
}

export function log(str: string, indentationLevel = 0) {
  let prefix = "";
  for (let i = 0; i < indentationLevel; i++) {
    prefix += "--";
  }
  if (prefix) {
    prefix += "> ";
  }

  // eslint-disable-next-line no-console
  console.log(prefix + str);
}

export async function baseplateFetch<Res = any, ReqBody = any>(
  url: string,
  options: BaseplateRequestInit<ReqBody> = {}
): Promise<Res> {
  if (!options.headers) {
    options.headers = {};
  }

  if (options.body && typeof options.body === "object") {
    options.body = JSON.stringify(options.body);
    options.headers["content-type"] = "application/json";
  }

  options.headers["Authorization"] = `token ${process.env.BASEPLATE_TOKEN}`;

  const baseUrl = process.env.BASEPLATE_API || "https://baseplate.cloud";

  let response;

  try {
    response = await fetch(baseUrl + url, options as RequestInit);
  } catch (err) {
    console.error(err.message);
    exitWithError(
      `Did not receive valid HTTP response from Baseplate API for url ${url}`
    );
  }

  if (response.ok) {
    return response.json() as Promise<Res>;
  } else {
    console.error(await response.text());
    exitWithError(
      `While calling ${url}, Baseplate API responded with status ${response.status}`
    );
  }
}

type BaseplateRequestInit<RequestBody = object> = Omit<RequestInit, "body"> & {
  body?: undefined | string | RequestBody;
};
