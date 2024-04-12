#!/usr/bin/env node
import yargs, {Argv} from "yargs";
import { hideBin } from "yargs/helpers";
import {create, deploy, downloadCiConfig, list, login} from "./js-api/js-api";
import { DownloadCiConfigArgs } from "./js-api/ci-config";
import packageJson from "../package.json" with { type: "json" };

const defaultArgs = (yargs: Argv<any>) => yargs.option("baseplateToken", {
        describe: "Service account token",
        type: "string"
});

yargs(hideBin(process.argv))
    .command(
        "create mfe <packageName>",
        "create mfe resource",
        (yargs) => {
            return defaultArgs(yargs).positional("packageName", {
                describe: "The package name including scope",
            }).option("framework", {
                default: "react",
            }).option("packageManager", {
                default: "npm",
            });
        },
        (argv) =>
            create({
                baseplateToken: argv.baseplateToken,
                resource: "mfe",
                packageName: argv.packageName,
                framework: argv.framework,
            }),
    )
  .command(
    "ls <resource>",
    "list resource",
    (yargs) => {
      return defaultArgs(yargs).positional("resource", {
        default: 'mfe',
        describe: "The type of the resource you wish to list [mfe | webapp | env]",
      });
    },
    (argv) =>
      list({
        baseplateToken: argv.baseplateToken,
        resource: argv.resource as "mfe" | "webapp" | "env",
      }),
  )
    .command(
        "login <baseplateToken>",
        "login to baseplate console using baseplate token",
        (yargs) => {
            return yargs.positional("baseplateToken", {
                describe: "Service account token generated through console",
                type: "string"
            });
        },
        (argv) =>
            login({
                baseplateToken: argv.baseplateToken,
            }),
    )
  .command(
    "deploy <microfrontendName>",
    "deploy a microfrontend",
    (yargs) => {
      return defaultArgs(yargs)
        .positional("microfrontendName", {
          describe: "The name of the microfrontend you wish to deploy",
        })
        .option("environment", {})
        .demandOption("environment")
        .option("dir", {
          default: "dist",
        })
        .demandOption("dir")
        .option("entry", {})
        .demandOption("entry")
        .option("autoVersion", {
          type: "boolean",
        });
    },
    (argv) => {
      deploy({
        baseplateToken: argv.baseplateToken,
        microfrontendName: argv.microfrontendName as string,
        environmentName: argv.environment as string,
        dir: argv.dir as string,
        entry: argv.entry as string,
        autoVersion: argv.autoVersion,
      });
    },
  )
  .command(
    "ci-config <microfrontendName>",
    "download ci config file for a microfrontend",
    (yargs) => {
      return (
          defaultArgs(yargs)
          .positional("microfrontendName", {
            describe:
              "The name of the microfrontend to download a CI config file for",
          })
          .option("ciTool", {})
          // Necessary for metadata api call
          .demandOption("ciTool")
          .option("packageManager", {
            type: "string",
            choices: ["npm", "yarn", "pnpm"],
          })
          .option("deployedBranch", {
            type: "string",
          })
          .option("uploadDir", {
            type: "string",
          })
          .option("entryFile", {
            type: "string",
          })
      );
    },
    (argv) => {
      downloadCiConfig({
        baseplateToken:argv.baseplateToken,
        microfrontendName:
          argv.microfrontendName as DownloadCiConfigArgs["microfrontendName"],
        ciTool: argv.ciTool as DownloadCiConfigArgs["ciTool"],
        packageManager:
          argv.packageManager as DownloadCiConfigArgs["packageManager"],
        deployedBranch:
          argv.deployedBranch as DownloadCiConfigArgs["deployedBranch"],
        uploadDir: argv.uploadDir as DownloadCiConfigArgs["uploadDir"],
        entryFile: argv.entryFile as DownloadCiConfigArgs["entryFile"],
      });
    },
  )
  .version(packageJson.version)
  .demandCommand(1)
  .scriptName("baseplate")
  .parse();
