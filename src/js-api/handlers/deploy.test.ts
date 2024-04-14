import { deploy } from "../js-api";
import {
  EndpointCreateDeploymentResBody,
  EndpointGetDeploymentCredentialsResBody,
  EndpointGetMicrofrontendsResBody,
  EndpointGetMyCustomerOrgResBody,
  EndpointGetStaticWebSettingsResBody,
} from "@baseplate-sdk/web-app";
// @ts-ignore jest mocks
import {
  baseplateFetchMocks,
  resetBaseplateFetch,
  baseplateFetchHistory,
  exitWithError,
} from "../../cli-utils";
import {
  log
} from "../../cli-logger";
// @ts-ignore jest mocks
import { testGuid } from "uuid";
import { resetS3Mocks, s3ObjectsPut } from "../../../__mocks__/client-s3";
import { cloneDeep } from "lodash-es";

describe(`deploy command`, () => {
  beforeEach(resetMocks);

  it(`doesn't throw an error`, async () => {
    setMocks();

    await deploy({
      baseplateToken: "sample",
      microfrontendName: "navbar",
      environmentName: "prod",
      dir: "fixtures/simple",
      entry: "navbar.js",
    });

    expect(exitWithError).not.toHaveBeenCalled();
    const logs = [
      "Deploying navbar to environment prod",
      "Step 1/4: Authenticate with Baseplate API and retrieve organization settings",
      "Step 2/4: Determine microfrontend entrypoint and find all assets to upload.",
      "Found 2 files to upload",
      "navbar.css",
      "navbar.js",
      "Step 3/4: Upload static web assets to cloud storage.",
      "Uploading navbar.css to navbar/navbar.css",
      "Uploading navbar.js to navbar/navbar.js",
      "Completed uploading files",
      "Step 4/4: Update Import Map to use new javascript entrypoint for navbar.",
    ];

    for (let i = 0; i < logs.length; i++) {
      expect((log as jest.Mock).mock.calls[i][0]).toEqual(logs[i]);
    }
  });

  it(`requires env vars when deploying to self hosted buckets`, async () => {
    setMocks({
      staticWebSettings(settings) {
        const newSettings = cloneDeep(settings);
        newSettings.staticFiles!.microfrontendProxy!.environments!.prod!.useBaseplateHosting =
          false;
        return newSettings;
      },
    });

    // Env Vars not set
    await deploy({
      baseplateToken: "sample",
      microfrontendName: "navbar",
      environmentName: "prod",
      dir: "fixtures/simple",
      entry: "navbar.js",
    });

    expect(exitWithError).toHaveBeenCalledWith(
      `Environment variables AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY required to deploy to self-hosted environment at url s3://prod`,
    );
  });

  it(`works with proper env variables, when deploying to self hosted buckets`, async () => {
    setMocks({
      staticWebSettings(settings) {
        const newSettings = cloneDeep(settings);
        newSettings.staticFiles!.microfrontendProxy!.environments!.prod!.useBaseplateHosting =
          false;
        return newSettings;
      },
    });

    process.env.AWS_REGION = "us-west-1";
    process.env.AWS_ACCESS_KEY_ID = "879sfyd";
    process.env.AWS_SECRET_ACCESS_KEY = "987sdf7sdf";

    // Env Vars not set
    await deploy({
      baseplateToken: "sample",
      microfrontendName: "navbar",
      environmentName: "prod",
      dir: "fixtures/simple",
      entry: "navbar.js",
    });

    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const entryUrl = `/navbar.js`;
    const s3Key = `navbar/navbar.js`;
    const deployApiReqInit =
      baseplateFetchHistory[`/api/orgs/${defaultOrgId}/deployments`];
    expect(deployApiReqInit.body.changedMicrofrontends[0].entryUrl).toEqual(
      entryUrl,
    );
    expect(s3ObjectsPut[s3Key]).toBeTruthy();

    expect(exitWithError).not.toHaveBeenCalled();
  });

  it(`throws an error without baseplateToken deploy arg`, async () => {
    delete process.env["BASEPLATE_TOKEN"];

    setMocks({
      staticWebSettings(settings) {
        const newSettings = cloneDeep(settings);
        newSettings!.staticFiles!.microfrontendProxy!.environments!.prod!.useBaseplateHosting =
          false;
        return newSettings;
      },
    });

    try {
      // @ts-ignore
      await deploy({
        microfrontendName: "navbar",
        environmentName: "prod",
        dir: "fixtures/simple",
        entry: "navbar.js",
      });
    } catch (err) {
      expect(err.message).toMatch(/baseplate cli requires a baseplateToken/);
      return;
    }

    throw Error("error expected when deployToken is missing");
  });

  it(`supports the autoVersion option`, async () => {
    setMocks();

    await deploy({
      baseplateToken: "sample",
      microfrontendName: "navbar",
      environmentName: "prod",
      dir: "fixtures/simple",
      entry: "navbar.js",
      autoVersion: true,
    });

    const entryUrl = `/${testGuid}/navbar.js`;
    const s3Key = `navbar/${testGuid}/navbar.js`;
    const deployApiReqInit =
      baseplateFetchHistory[`/api/orgs/${defaultOrgId}/deployments`];
    expect(deployApiReqInit.body.changedMicrofrontends[0].entryUrl).toEqual(
      entryUrl,
    );
    expect(s3ObjectsPut[s3Key]).toBeTruthy();
    for (let key in s3ObjectsPut) {
      expect(key.startsWith(`navbar/${testGuid}/`));
    }
  });
});

function printLogs() {
  // eslint-disable-next-line no-console
  console.log((log as jest.Mock).mock.calls);
}

const defaultOrgId = "orgId",
  defaultEnvId = "envId";

const defaultCustomerOrg: EndpointGetMyCustomerOrgResBody = {
  id: defaultOrgId,
  name: "Convex Cooperative",
  accountEnabled: true,
  auditAccountId: "1",
  billingUserId: "1",
  orgKey: "convex",
};

const defaultStaticWebSettings: EndpointGetStaticWebSettingsResBody = {
  orgExists: true,
  cors: {},
  importMapCacheControl: "public, max-age=500",
  staticFiles: {
    cacheControl: "public, max-age=500000",
    microfrontendProxy: {
      environments: {
        prod: {
          useBaseplateHosting: true,
          host: "s3://prod",
          environmentId: defaultEnvId,
        },
      },
    },
  },
};

const defaultMicrofrontendList: EndpointGetMicrofrontendsResBody = {
  microfrontends: [
    {
      id: "navbarId",
      auditAccountId: "1",
      customerOrgId: defaultOrgId,
      name: "navbar",
      useCustomerOrgKeyAsScope: true,
      scope: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deployedAt: new Date(),
    },
    {
      id: "settingsid",
      auditAccountId: "1",
      customerOrgId: defaultOrgId,
      name: "settings",
      useCustomerOrgKeyAsScope: true,
      scope: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deployedAt: new Date(),
    },
  ],
};

const defaultDeploymentCreds: EndpointGetDeploymentCredentialsResBody = {
  storageProvider: "aws",
  aws: {
    bucket: "prod",
    credentials: {
      accessKeyId: "accessKeyId",
      secretAccessKey: "secretAccessKey",
      sessionToken: "sessionToken",
    },
    region: "us-east-1",
  },
};

const defaultCreatedDeployment: EndpointCreateDeploymentResBody = {
  deployment: {
    id: "deploymentId",
    accountId: "1",
    auditAccountId: "1",
    // @ts-ignore
    cause: "deploymentCLI",
    environmentId: defaultEnvId,
    // @ts-ignore
    status: "success",
  },
  // @ts-ignore this can be removed once https://github.com/ConvexCooperative/baseplate-web-app/pull/441 is merged and published
  importMap: {},
  // @ts-ignore this can be removed once https://github.com/ConvexCooperative/baseplate-web-app/pull/441 is merged and published
  importMapUrl: "https://dev-cdn.baseplate.cloud/convex/systemjs.import",
  // @ts-ignore this can be removed once https://github.com/ConvexCooperative/baseplate-web-app/pull/441 is merged and published
  changedMicrofrontendEntryUrls: [
    "https://dev-cdn.baseplate.cloud/convex/apps/navbar/GUID/navbar.js",
  ],
};

const defaultMocks: Mocks = {
  customerOrg: () => defaultCustomerOrg,
  createdDeployment: () => defaultCreatedDeployment,
  deploymentCreds: () => defaultDeploymentCreds,
  microfrontendList: () => defaultMicrofrontendList,
  staticWebSettings: () => defaultStaticWebSettings,
  fileList: () => ({
    topLevelDirExists: true,
    files: [],
  }),
};

function setMocks({
  customerOrg = () => defaultCustomerOrg,
  staticWebSettings = () => defaultStaticWebSettings,
  microfrontendList = () => defaultMicrofrontendList,
  deploymentCreds = () => defaultDeploymentCreds,
  createdDeployment = () => defaultCreatedDeployment,
}: Mocks = defaultMocks) {
  baseplateFetchMocks["/api/orgs/me"] = customerOrg(defaultCustomerOrg);
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/static-web-settings`] =
    staticWebSettings(defaultStaticWebSettings);
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/microfrontends`] =
    microfrontendList(defaultMicrofrontendList);
  baseplateFetchMocks[
    `/api/orgs/${defaultOrgId}/environments/${defaultEnvId}/deployment-credentials`
  ] = deploymentCreds(defaultDeploymentCreds);
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/deployments`] =
    createdDeployment(defaultCreatedDeployment);
}

function resetMocks() {
  // @ts-ignore
  log.mockClear();
  // @ts-ignore
  exitWithError.mockClear();
  resetBaseplateFetch();
  resetS3Mocks();
}

interface Mocks {
  customerOrg?(
    defaultValue: EndpointGetMyCustomerOrgResBody,
  ): EndpointGetMyCustomerOrgResBody;
  staticWebSettings?(
    defaultValue: EndpointGetStaticWebSettingsResBody,
  ): EndpointGetStaticWebSettingsResBody;
  microfrontendList?(
    defaultValue: EndpointGetMicrofrontendsResBody,
  ): EndpointGetMicrofrontendsResBody;
  deploymentCreds?(
    defaultValue: EndpointGetDeploymentCredentialsResBody,
  ): EndpointGetDeploymentCredentialsResBody;
  createdDeployment?(
    defaultValue: EndpointCreateDeploymentResBody,
  ): EndpointCreateDeploymentResBody;
  fileList?(defaultValue: FileList): FileList;
}

interface FileList {
  topLevelDirExists: boolean;
  files: string[];
}
