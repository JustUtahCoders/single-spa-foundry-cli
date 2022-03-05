import { deploy } from "./js-api";

describe(`deploy command`, () => {
  it(`doesn't throw an error`, async () => {
    await deploy({
      foundryToken: "sample",
      microfrontendName: "navbar",
    });
  });
});
