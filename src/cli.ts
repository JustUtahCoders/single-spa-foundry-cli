#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { deploy } from "./js-api";

const foundryToken = process.env.FOUNDRY_TOKEN;

if (!foundryToken) {
  throw Error(
    `FOUNDRY_TOKEN environment variable is required to use single-spa-foundry-cli.`
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
        foundryToken,
        microfrontendName: argv.microfrontendName as string,
      });
    }
  )
  .demandCommand(1)
  .parse();
