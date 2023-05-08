import {
  OrgSettings,
  mergeDefaultOrgSettings,
  StaticFileProxySettings,
} from "@baseplate-sdk/utils";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import fsP from "fs/promises";
import {
  EndpointCreateDeploymentResBody,
  EndpointCreateDeploymentReqBody,
  EndpointGetDeploymentCredentialsResBody,
  EndpointGetMicrofrontendsResBody,
  EndpointGetStaticWebSettingsResBody,
  EndpointGetMyCustomerOrgResBody,
} from "@baseplate-sdk/web-app";
import { log, exitWithError, createBaseplateFetch } from "./cli-utils.js";

export async function deploy(args: DeployArgs) {
  log(
    `Deploying ${args.microfrontendName} to environment ${args.environmentName}`
  );

  log(
    `Step 1/4: Authenticate with baseplate API and retrieve organization settings`
  );
  const baseplateFetch = createBaseplateFetch(args);

  const customerOrgResponse =
    await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
  const { id: customerOrgId, orgKey } = customerOrgResponse;

  const partialOrgSettings =
    await baseplateFetch<EndpointGetStaticWebSettingsResBody>(
      `/api/orgs/${customerOrgId}/static-web-settings`
    );

  const orgSettings: OrgSettings = mergeDefaultOrgSettings(partialOrgSettings);

  const proxySettings: StaticFileProxySettings =
    orgSettings.staticFiles.microfrontendProxy.environments[
      args.environmentName
    ];

  if (!proxySettings) {
    return exitWithError(
      `Could not find environment '${args.environmentName}'`
    );
  }

  const { microfrontends } =
    await baseplateFetch<EndpointGetMicrofrontendsResBody>(
      `/api/orgs/${customerOrgId}/microfrontends`
    );

  const microfrontend = microfrontends.find(
    (m) => m.name === args.microfrontendName
  );

  if (!microfrontend) {
    return exitWithError(
      `Could not find microfrontend with name '${args.microfrontendName}'`
    );
  }

  log(
    `Step 2/4: Determine microfrontend entrypoint and find all assets to upload.`
  );
  const files = [];

  let topLevelDirIsDir: boolean;
  try {
    topLevelDirIsDir = (await fsP.stat(args.dir)).isDirectory();
  } catch {
    return exitWithError(
      `Directory '${args.dir}' does not exist, but is expected for uploading static assets.`
    );
  }

  if (!topLevelDirIsDir) {
    return exitWithError(
      `File '${args.dir}' should be a directory rather than a normal file.`
    );
  }

  await recurseDir(files, args.dir, false);

  if (files.length === 0) {
    return exitWithError(
      `Directory '${args.dir}' is empty. At least one javascript entry file is expected to be uploaded.`
    );
  }

  log(`Found ${files.length} files to upload`, 1);
  files.forEach((file) => log(file, 2));

  log(`Step 3/4: Upload static web assets to cloud storage.`);
  let s3Client: S3Client, Bucket: string;

  if (proxySettings.useBaseplateHosting) {
    const deploymentCredentials =
      await baseplateFetch<EndpointGetDeploymentCredentialsResBody>(
        `/api/orgs/${customerOrgId}/environments/${proxySettings.environmentId}/deployment-credentials`
      );
    s3Client = new S3Client({
      region: deploymentCredentials.aws.region,
      credentials: deploymentCredentials.aws.credentials,
    });
    Bucket = deploymentCredentials.aws.bucket;
  } else if (proxySettings.host.startsWith("s3://")) {
    Bucket = proxySettings.host.slice("s3://".length);
    const requiredEnvVars = [
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ];
    const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingEnvVars.length > 0) {
      return exitWithError(
        `Environment variable${
          missingEnvVars.length === 1 ? "" : "s"
        } ${missingEnvVars.join(
          ", "
        )} required to deploy to self-hosted environment at url ${
          proxySettings.host
        }`
      );
    }

    // AWS SDK reads the env vars for us
    s3Client = new S3Client({});
  } else {
    return exitWithError(
      `baseplate-cli doesn't yet support deploying to anything except s3 buckets. Bucket URL: ${proxySettings.host}`
    );
  }

  for (let file of files) {
    const Key = args.microfrontendName + "/" + file;
    log(`Uploading ${file} to ${Key}`, 1);
    await s3Client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: fs.createReadStream(path.join(args.dir, file)),
      })
    );
  }

  log("Completed uploading files", 1);

  log(
    `Step 4/4: Update Import Map to use new javascript entrypoint for ${args.microfrontendName}.`
  );
  const trailingSlashUrl = `/`;
  const entryUrl = trailingSlashUrl + args.entry;

  const deploymentResponse = await baseplateFetch<
    EndpointCreateDeploymentResBody,
    EndpointCreateDeploymentReqBody
  >(`/api/orgs/${customerOrgId}/deployments`, {
    method: "POST",
    body: {
      environmentId: proxySettings.environmentId,
      // @ts-ignore
      cause: "deploymentCLI",
      changedMicrofrontends: [
        {
          microfrontendId: microfrontend.id,
          entryUrl,
          trailingSlashUrl,
        },
      ],
    },
  });

  if (deploymentResponse.deployment.status === "failure") {
    return exitWithError(
      `Deployment failed. For more details, see deployment ${deploymentResponse.deployment.id}`
    );
  } else {
    log("Deployment Successful!");
  }
}

async function recurseDir(
  allFiles: string[],
  dir: string,
  includeParentDirInPath: boolean
): Promise<void> {
  const files = await fsP.readdir(dir);
  for (let file of files) {
    const pathWithParentDir = path.join(dir, file);
    if ((await fsP.stat(pathWithParentDir)).isDirectory()) {
      recurseDir(allFiles, pathWithParentDir, true);
    } else {
      allFiles.push(includeParentDirInPath ? pathWithParentDir : file);
    }
  }
}

export interface DeployArgs {
  baseplateToken: string;
  microfrontendName: string;
  environmentName: string;
  dir: string;
  entry: string;
}
