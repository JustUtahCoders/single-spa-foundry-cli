#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { deploy } from "./js-api.js";

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
        .demandOption("entry");
    },
    (argv) => {
      if (!baseplateToken) {
        throw Error(
          `BASEPLATE_TOKEN environment variable is required to use Baseplate CLI.`
        );
      }
      deploy({
        baseplateToken,
        microfrontendName: argv.microfrontendName as string,
        environmentName: argv.environment as string,
        dir: argv.dir as string,
        entry: argv.entry as string,
      });
    }
  )
  .demandCommand(1)
  .scriptName("baseplate")
  .parse();
