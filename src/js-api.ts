export async function deploy(args: DeployArgs) {
  // eslint-disable-next-line
  console.log(`Deploying ${args.microfrontendName}`);

  // Step 1: Get Org Settings by using FOUNDRY_TOKEN

  // Step 2: Content Hashing

  // Step 3: If using foundry hosting, get temporary AWS credentials

  // Step 4: Use the AWS SDK to upload the files to s3
  // https://github.com/aws/aws-sdk-js-v3#getting-started
}

export async function getOrgSettings(foundryToken: string): OrgSettings {
  // @ts-ignore
  // TODO - implement
  return {};
}

interface DeployArgs {
  foundryToken: string;
  microfrontendName: string;
}

interface StaticFileSettings {
  microfrontendProxy: {
    environments: {
      [key: string]: StaticFileProxySettings;
    };
  };
}

export interface StaticFileProxySettings {
  useFoundryHosting: boolean;
  customHost: string;
}

export interface OrgSettings {
  staticFiles: StaticFileSettings;
  importMapCacheControl: string;
  cors: CORSSettings;
  orgExists: boolean;
}

export interface CORSSettings {
  allowOrigins: string[];
  exposeHeaders: string[];
  maxAge: number;
  allowCredentials: boolean;
  allowMethods: string[];
  allowHeaders: string[];
}
