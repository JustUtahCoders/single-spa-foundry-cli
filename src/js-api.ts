export async function deploy(args: DeployArgs) {
  // eslint-disable-next-line
  console.log(`Deploying ${args.microfrontendName}`);
}

interface DeployArgs {
  foundryToken: string;
  microfrontendName: string;
}
