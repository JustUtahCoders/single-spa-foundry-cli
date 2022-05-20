import { deploy } from "./js-api";
import {
  EndpointCreateDeploymentResBody,
  EndpointGetDeploymentCredentialsResBody,
  EndpointGetMicrofrontendsResBody,
  EndpointGetMyCustomerOrgResBody,
  EndpointGetStaticWebSettingsResBody,
} from "@baseplate-sdk/web-app";
// @ts-ignore
import { baseplateFetchMocks, exitWithError, log } from "./cli-utils";

describe(`deploy command`, () => {
  beforeEach(resetMocks);
  afterEach(resetMocks);

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
      "Step 1/4: Authenticate with baseplate API and retrieve organization settings",
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
});

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
    },
    {
      id: "settingsid",
      auditAccountId: "1",
      customerOrgId: defaultOrgId,
      name: "settings",
      useCustomerOrgKeyAsScope: true,
      scope: null,
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
};

const defaultMocks: Mocks = {
  customerOrg: defaultCustomerOrg,
  createdDeployment: defaultCreatedDeployment,
  deploymentCreds: defaultDeploymentCreds,
  microfrontendList: defaultMicrofrontendList,
  staticWebSettings: defaultStaticWebSettings,
};

function setMocks({
  customerOrg = defaultCustomerOrg,
  staticWebSettings = defaultStaticWebSettings,
  microfrontendList = defaultMicrofrontendList,
  deploymentCreds = defaultDeploymentCreds,
  createdDeployment = defaultCreatedDeployment,
}: Mocks = defaultMocks) {
  baseplateFetchMocks["/api/orgs/me"] = customerOrg;
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/static-web-settings`] =
    staticWebSettings;
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/microfrontends`] =
    microfrontendList;
  baseplateFetchMocks[
    `/api/orgs/${defaultOrgId}/environments/${defaultEnvId}/deployment-credentials`
  ] = deploymentCreds;
  baseplateFetchMocks[`/api/orgs/${defaultOrgId}/deployments`] =
    createdDeployment;
}

function resetMocks() {
  delete baseplateFetchMocks["/api/orgs/me"];
  delete baseplateFetchMocks[`/api/orgs/${defaultOrgId}/static-web-settings`];
  delete baseplateFetchMocks[`/api/orgs/${defaultOrgId}/microfrontends`];
  delete baseplateFetchMocks[
    `/api/orgs/${defaultOrgId}/environments/${defaultEnvId}/deployment-credentials`
  ];
  delete baseplateFetchMocks[`/api/orgs/${defaultOrgId}/deployments`];
}

interface Mocks {
  customerOrg: EndpointGetMyCustomerOrgResBody;
  staticWebSettings: EndpointGetStaticWebSettingsResBody;
  microfrontendList: EndpointGetMicrofrontendsResBody;
  deploymentCreds: EndpointGetDeploymentCredentialsResBody;
  createdDeployment: EndpointCreateDeploymentResBody;
  fileList: FileList;
}

interface FileList {
  topLevelDirExists: boolean;
  files: string[];
}
