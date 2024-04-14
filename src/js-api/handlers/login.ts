import {EndpointGetMyCustomerOrgResBody} from "@baseplate-sdk/web-app";
import {createBaseplateFetch} from "../../cli-utils";
import {log, success} from "../../cli-logger";
import {storageProvider} from "../../cli-storage";

const storage = await storageProvider();

export async function login(args: LoginArgs) {
    storage.set("baseplateToken", args.baseplateToken);
    const baseplateFetch = createBaseplateFetch(args);
    const { id: customerOrgId, orgKey } =
        await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
    log(success(`Successfully logged in organization: ${orgKey}`))

}

export interface LoginArgs {
    baseplateToken?: string;
}