#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { deploy, downloadCiConfig } from "./js-api/js-api";
import { DownloadCiConfigArgs } from "./js-api/ci-config";
import packageJson from "../package.json" with { type: "json" };

const baseplateToken = process.env.BASEPLATE_TOKEN;

yargs(hideBin(process.argv))
  .command(
    "deploy <microfrontendName>",
    "deploy a microfrontend",
    (yargs) => {
      return yargs
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
      if (!baseplateToken) {
        throw Error(
          `BASEPLATE_TOKEN environment variable is required to use Baseplate CLI.`,
        );
      }
      deploy({
        baseplateToken,
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
        yargs
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
      if (!baseplateToken) {
        throw Error(
          `BASEPLATE_TOKEN environment variable is required to use Baseplate CLI.`,
        );
      }
      downloadCiConfig({
        baseplateToken,
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
