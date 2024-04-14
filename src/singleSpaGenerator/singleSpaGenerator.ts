import FullEnvironment from "yeoman-environment";
import { log, secondary } from "../cli-logger";
import p from "node:path";

const env = new FullEnvironment();
export const runSingleSpaGenerator = async (args: CreateSingleSpaArgument) => {
  let arg = " ";
  arg += `--dir ${args.dir} `;
  arg += `--framework ${args.framework} `;
  arg += `--orgName ${args.orgName} `;
  arg += `--projectName ${args.projectName} `;
  arg += `--moduleType ${args.moduleType} `;
  arg += `--packageManager ${args.packageManager} `;

  if (args.framework == "react") {
    arg += `--typescript ${args.typescript} `;
  }

  log(secondary.inverse("RUNNING") + secondary(` create-single-spa ${arg}`));

  const generator = await import("generator-single-spa");
  // @ts-ignore
  env.registerStub(generator.default, "generator-single-spa");
  // @ts-ignore
  await env.run(`generator-single-spa ${arg} --skipInstall`, "");
};

export interface CreateSingleSpaArgument {
  dir: string;
  orgName: string;
  projectName: string;
  typescript: boolean;
  framework: "none" | "react" | "vue" | "angular" | "svelte";
  moduleType: "app-parcel" | "util-module" | "root-config";
  packageManager: "yarn" | "npm" | "pnpm";
}
export function determineDirectory(frameworkArg: string, dir: string): string {
  //generator-single-spa dir for angular work different
  if (determineFramework(frameworkArg) == "angular") {
    return p.dirname(dir);
  } else {
    return dir;
  }
}
export function determineFramework(
  frameworkArg: string,
): "none" | "react" | "vue" | "angular" | "svelte" {
  if (!frameworkArg) {
    return "react";
  }
  switch (frameworkArg.toLowerCase()) {
    case "none":
      return "none";
    case "ng":
    case "angular":
    case "ang":
      return "angular";
    case "vue":
    case "v":
      return "vue";
    case "svelte":
      return "svelte";
    case "react":
    case "reactjs":
    default:
      return "react";
  }
}
export function determinePackageManager(
  packageManager: string,
): "yarn" | "npm" | "pnpm" {
  if (!packageManager) {
    return "npm";
  }
  switch (packageManager.toLowerCase()) {
    case "yarn":
      return "yarn";
    case "pnpm":
      return "pnpm";
    default:
      return "npm";
  }
}
