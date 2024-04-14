import {createBaseplateFetch, exitWithError} from "../../cli-utils";
import {
  EndpointGetCustomerWebAppsResBody,
  EndpointGetEnvironmentsResBody,
  EndpointGetMicrofrontendsResBody,
  EndpointGetMyCustomerOrgResBody,
} from "@baseplate-sdk/web-app";
import {logTable, warning} from "../../cli-logger";

export async function list(args: ListArgs) {
  const baseplateFetch = createBaseplateFetch(args);
  const { id: customerOrgId, orgKey } =
    await baseplateFetch<EndpointGetMyCustomerOrgResBody>(`/api/orgs/me`);
  const resourceLister = new ResourceLister(orgKey, customerOrgId);
  await resourceLister.list(args);
}

export interface ListArgs {
  baseplateToken: string;
  resource: "mfe" | "webapp" | "env";
}

export class ResourceLister {
  constructor(
    private readonly orgKey: string,
    private readonly customerOrgId: string,
  ) {}

  async list(args: ListArgs) {
    switch (args.resource) {
      case "mfe":
        await this.listMicrofrontends(args);
        break;
      case "webapp":
        await this.listWebapps(args);
        break;
      case "env":
        await this.listEnvironments(args);
        break;
      default:
        exitWithError(
          `Unknown resource "${args.resource}", ` +
            `valid resources are: ${warning(" mfe | webapp | env ")}`,
        );
    }
  }

  async listMicrofrontends(args: ListArgs) {
    const { microfrontends } = await createBaseplateFetch(
      args,
    )<EndpointGetMicrofrontendsResBody>(
      `/api/orgs/${this.customerOrgId}/microfrontends`,
    );
    logTable(
      microfrontends.map((m) => MicrofrontendTableRow.parse(m, this.orgKey)),
    );
  }

  async listEnvironments(args: ListArgs) {
    const { environments } = await createBaseplateFetch(
      args,
    )<EndpointGetEnvironmentsResBody>(
      `/api/orgs/${this.customerOrgId}/environments`,
    );
    logTable(environments.map((m) => EnvironmentTableRow.parse(m)));
  }

  async listWebapps(args: ListArgs) {
    const { customerWebApps } = await createBaseplateFetch(
      args,
    )<EndpointGetCustomerWebAppsResBody>(
      `/api/orgs/${this.customerOrgId}/customer-web-apps`,
    );
    logTable(customerWebApps.map((m) => WebappTableRow.parse(m)));
  }
}

class MicrofrontendTableRow {
  id: string;
  name: string;
  packageName: string;
  deployedAt: Date;

  static parse(model, org): MicrofrontendTableRow {
    const row = new MicrofrontendTableRow();
    row.id = model?.id;
    row.name = model?.name;
    row.packageName =
      model?.scope && !model?.useCustomerOrgKeyAsScope
        ? `@${model.scope}/${model?.name}`
        : `@${org}/${model?.name}`;
    row.deployedAt = model?.deployedAt;
    return row;
  }
}

class EnvironmentTableRow {
  id: string;
  name: string;
  importMapUrl: string;
  isProd: boolean;
  deployedAt: Date;
  static parse(model): EnvironmentTableRow {
    const row = new EnvironmentTableRow();
    row.id = model?.id;
    row.name = model?.name;
    row.importMapUrl = model?.importMapUrl;
    row.isProd = model?.isProd;
    row.deployedAt = model?.deployedAt;
    return row;
  }
}

class WebappTableRow {
  id: string;
  name: string;
  filename: string;
  static parse(model): WebappTableRow {
    const row = new WebappTableRow();
    row.id = model?.id;
    row.name = model?.humanReadableName;
    row.filename = model?.filename;
    return row;
  }
}
