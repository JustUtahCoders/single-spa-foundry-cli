import {
  EndpointGetCIConfigMetadataResBody,
  EndpointGetMicrofrontendsResBody,
  EndpointGetMyCustomerOrgResBody,
} from "@baseplate-sdk/web-app";
import {checkBaseplateToken, createBaseplateFetch, createDirs, exitWithError} from "../../cli-utils";
import fsP from "node:fs/promises";
import path from "node:path";


import { log } from "../../cli-logger";

export async function downloadCiConfig(args: DownloadCiConfigArgs) {
  const baseplateToken = checkBaseplateToken(args);


  log(
    `Downloading CI Configuration file for microfrontend '${args.microfrontendName}'`,
  );

  const baseplateFetch = createBaseplateFetch(args);

  log(
    `Step 1/4: Authenticate with Baseplate API and retrieve customer org object`,
  );
  const { id: customerOrgId } =
    await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);

  log(`Step 2/4: Retrieve microfrontend id`);

  const { microfrontends } =
    await baseplateFetch<EndpointGetMicrofrontendsResBody>(
      `/api/orgs/${customerOrgId}/microfrontends`,
    );
  const microfrontend = microfrontends.find(
    (m) => m.name === args.microfrontendName,
  );

  if (!microfrontend) {
    return exitWithError(
      `Could not find microfrontend with name '${args.microfrontendName}'`,
    );
  }

  log(`Step 3/4: Retrieve file path for ci config file`);
  const metadata = await baseplateFetch<EndpointGetCIConfigMetadataResBody>(
    `/api/orgs/${customerOrgId}/ci-config-metadata/${args.ciTool}`,
  );

  log(`Step 4/4: Download CI Config file to correct file path`);
  const queryParams = new URLSearchParams();
  if (args.ciTool) {
    queryParams.append("ciTool", args.ciTool);
  }
  if (args.packageManager) {
    queryParams.append("packageManager", args.packageManager);
  }
  if (args.deployedBranch) {
    queryParams.append("deployedBranch", args.deployedBranch);
  }
  if (args.uploadDir) {
    queryParams.append("uploadDir", args.uploadDir);
  }
  if (args.entryFile) {
    queryParams.append("entryFile", args.entryFile);
  }
  const requestUrl = `/api/orgs/${customerOrgId}/microfrontends/${microfrontend.id}/ci-configs?${queryParams.toString()}`;
  const response = await baseplateFetch<Response>(requestUrl);

  const blob = await response.blob();
  const fileContents = await blob.text();
  const prefix = args.workingDir ?? './';
  const filePath =path.normalize(path.resolve(prefix , metadata.ciConfigFilePath));
  createDirs(path.resolve(filePath, "../"));
  await fsP.writeFile(filePath, fileContents, "utf-8");

  log(`CI Config file written to ${filePath}!`);
}

export interface DownloadCiConfigArgs {
  baseplateToken: string;
  microfrontendName: string;
  ciTool: "github" | "azure";
  packageManager?: "npm" | "yarn" | "pnpm";
  deployedBranch?: string;
  uploadDir?: string;
  entryFile?: string;
  workingDir?: string;
}

