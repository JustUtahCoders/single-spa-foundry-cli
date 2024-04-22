import {
  createBaseplateFetch,
  createDirsSync,
  exitWithError,
} from "../../cli-utils";
import {
  EndpointCreateMicrofrontendReqBody,
  EndpointCreateMicrofrontendResBody,
  EndpointGetMyCustomerOrgResBody,
} from "@baseplate-sdk/web-app";
import { info, log, success, warning } from "../../cli-logger";
import {
  determineDirectory,
  determineFramework,
  determinePackageManager,
  runSingleSpaGenerator,
} from "../../singleSpaGenerator/singleSpaGenerator";
import { downloadCiConfig } from "./ci-config";
import path from "node:path";

export async function create(args: any & CreateArgs) {
  switch (args.resource) {
    case "mfe":
      await createMicrofrontend(args as CreateMicrofrontendArgs);
      break;
    case "webapp":
    case "env":
      exitWithError("not implemented");
      break;
    default:
      exitWithError(
        `Unknown resource "${args.resource}", ` +
          `valid resources are: ${warning(" mfe | webapp | env ")}`,
      );
  }
}

async function createMicrofrontend(args: CreateMicrofrontendArgs) {
  const baseplateFetch = createBaseplateFetch(args);
  const { id: customerOrgId, orgKey } =
    await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
  let scope = orgKey;
  if (!args.packageName.startsWith("@")) {
    scope = null;
  }

  if (scope && !args.packageName.startsWith(`@${scope}/`)) {
    scope = args.packageName.split("/")[0].replace("@", "");
  }

  const name = scope
    ? args.packageName.replace(`@${scope}/`, "")
    : args.packageName;
  const useCustomerOrgKeyAsScope = scope == orgKey;

  log(
    info(
      `Creating microfrontend ${info.inverse(name)}` +
        ` within ${info.inverse(useCustomerOrgKeyAsScope ? orgKey : scope)} scope`,
    ),
  );

  const res = await baseplateFetch<
    EndpointCreateMicrofrontendResBody,
    EndpointCreateMicrofrontendReqBody
  >(`/api/orgs/${customerOrgId}/microfrontends`, {
    body: {
      name,
      useCustomerOrgKeyAsScope,
      scope: useCustomerOrgKeyAsScope ? null : scope,
    },
    method: "post",
  });

  createDirsSync(path.resolve(`./${args.packageName}`, "../"));
  await runSingleSpaGenerator({
    dir: `./${determineDirectory(args.framework, args.packageName)}`,
    orgName: scope ?? orgKey,
    projectName: name,
    typescript: true,
    framework: determineFramework(args.framework),
    packageManager: determinePackageManager(args.packageManager),
    moduleType: "app-parcel",
  });

  await downloadCiConfig({
    baseplateToken: args.baseplateToken as string,
    microfrontendName: name as string,
    ciTool: args.ciTool,
    packageManager: args.packageManager,
    deployedBranch: args.deployedBranch,
    workingDir: `./${args.packageName}`,
  });

  log(success(`${args.packageName} Created Successfully!`));
  log("", 8);
  log(info(`INSTRUCTION TO START`));
  log(`1: cd ${args.packageName}`);
  log(`2: ${args.packageManager} install`);
  log(
    `3: visit ${
      args.ciTool == "github"
        ? "https://baseplate.cloud/docs/deployments/github-action"
        : args.ciTool == "azure"
          ? "https://baseplate.cloud/docs/deployments/azure-pipelines"
          : "https://baseplate.cloud/docs/deployments/ci-configuration"
    } to get more info on baseplate.cloud ci configuration`,
  );
}

export interface CreateArgs {
  baseplateToken: string;
  resource: "mfe" | "webapp" | "env";
}

export interface CreateMicrofrontendArgs extends CreateArgs {
  packageName: string;
  framework: string;
  ciTool: "github" | "azure";
  packageManager?: "npm" | "yarn" | "pnpm";
  deployedBranch?: string;
  uploadDir?: string;
  entryFile?: string;
  workingDir?: string;
}
