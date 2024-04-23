import { EndpointGetMyCustomerOrgResBody } from "@baseplate-sdk/web-app";
import { createBaseplateFetch } from "../../cli-utils";
import { log, success } from "../../cli-logger";
import { storageProvider } from "../../cli-storage";

export async function login(args: LoginArgs) {
  const storage = await storageProvider();
  const baseplateFetch = createBaseplateFetch(args);
  const { id: customerOrgId, orgKey } =
    await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
  storage.set("baseplateToken", args.baseplateToken);
  log(success(`Successfully logged in organization: ${orgKey}`));
}

export interface LoginArgs {
  baseplateToken?: string;
}
