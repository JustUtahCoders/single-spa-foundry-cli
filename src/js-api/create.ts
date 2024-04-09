import {createBaseplateFetch, exitWithError} from "../cli-utils";
import {
    EndpointCreateMicrofrontendReqBody,
    EndpointCreateMicrofrontendResBody,
    EndpointGetMyCustomerOrgResBody
} from "@baseplate-sdk/web-app";
import {info, log, warning} from "../cli-logger";
import {
    determineFramework,
    determinePackageManager,
    runSingleSpaGenerator
} from "../singleSpaGenerator/singleSpaGenerator"

export async function create(args: any & CreateArgs) {
    const baseplateFetch = createBaseplateFetch(args);
    const { id: customerOrgId, orgKey } =
        await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
    const resourceLister = new ResourceCreator(orgKey, customerOrgId);
    await resourceLister.create(args);
}

export class ResourceCreator {
    constructor(
        private readonly orgKey: string,
        private readonly customerOrgId: string,
    ) {}

    async create(args: CreateArgs) {
        switch (args.resource) {
            case "mfe":
                await this.createMicrofrontend(args as CreateMicrofrontendArgs);
                break;
            case "webapp":
                await this.createWebapp(args);
                break;
            case "env":
                await this.createEnvironment(args);
                break;
            default:
                exitWithError(
                    `Unknown resource "${args.resource}", ` +
                    `valid resources are: ${warning(" mfe | webapp | env ")}`,
                );
        }
    }

    async createMicrofrontend(args: CreateMicrofrontendArgs) {
        let scope = this.orgKey;
        if(!args.packageName.startsWith("@")){
            scope = null;
        }

        if(scope && !args.packageName.startsWith(`@${scope}/`)){
            scope = args.packageName.split("/")[0].replace("@","");
        }

        const name = scope ? args.packageName.replace(`@${scope}/`,"") : args.packageName;
        const useCustomerOrgKeyAsScope = scope == this.orgKey;

        log(info(`Creating microfrontend ${info.inverse(name)}`+
            ` within ${info.inverse(useCustomerOrgKeyAsScope ? this.orgKey : scope)} scope`));

        const res = await createBaseplateFetch(
            args,
        )<EndpointCreateMicrofrontendResBody, EndpointCreateMicrofrontendReqBody>(
            `/api/orgs/${this.customerOrgId}/microfrontends`,
            {body:{name, useCustomerOrgKeyAsScope, scope: useCustomerOrgKeyAsScope ? null : scope}, method: "post"}
        );

        runSingleSpaGenerator({
            dir: `./${args.packageName}`,
            orgName: scope ?? this.orgKey,
            projectName: name,
            typescript: true,
            framework: determineFramework(args.framework),
            packageManager: determinePackageManager(args.packageManager),
            moduleType: "app-parcel",
        });
    }


    async createWebapp(args: CreateArgs) {
      exitWithError("not implemented");
    }

    async createEnvironment(args: CreateArgs) {
        exitWithError("not implemented");
    }
}

export interface CreateArgs {
    baseplateToken: string;
    resource: "mfe" | "webapp" | "env";
}

export interface CreateMicrofrontendArgs extends CreateArgs {
    packageName: string;
    framework: string;
    packageManager: string;
}