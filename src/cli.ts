#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { deploy } from "./js-api";

const baseplateToken = process.env.BASEPLATE_TOKEN;

if (!baseplateToken) {
  throw Error(
    `BASEPLATE_TOKEN environment variable is required to use Baseplate CLI.`
  );
}

yargs(hideBin(process.argv))
  .command(
    "deploy <microfrontendName>",
    "deploy a microfrontend",
    (yargs) => {
      return yargs.positional("microfrontendName", {
        describe: "The name of the microfrontend you wish to deploy",
      });
    },
    (argv) => {
      deploy({
        baseplateToken,
        microfrontendName: argv.microfrontendName as string,
      });
    }
  )
  .demandCommand(1)
  .parse();
