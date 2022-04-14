import { OrgSettings, mergeDefaultOrgSettings } from "@baseplate-sdk/utils";

export async function deploy(args: DeployArgs) {
  // eslint-disable-next-line
  console.log(`Deploying ${args.microfrontendName}`);

  // Step 1: Get Org Settings by using BASEPLATE_TOKEN
  const partialOrgSettings = await getOrgSettings(args.baseplateToken);

  if (!partialOrgSettings) {
    throw Error(`Invalid or expired BASEPLATE_TOKEN`);
  }

  const orgSettings: OrgSettings = mergeDefaultOrgSettings(partialOrgSettings);

  // eslint-disable-next-line no-console
  console.log(orgSettings);

  // Step 2: Content Hashing

  // Step 3: If using Baseplate hosting, get temporary AWS credentials

  // Step 4: Use the AWS SDK to upload the files to s3
  // https://github.com/aws/aws-sdk-js-v3#getting-started
}

export async function getOrgSettings(
  baseplateToken: string
): Promise<RecursivePartial<OrgSettings>> {
  return {
    orgExists: true,
  };
}

interface DeployArgs {
  baseplateToken: string;
  microfrontendName: string;
}

// https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};
