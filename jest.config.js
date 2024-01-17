/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
const config = {
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "./cli-utils": "<rootDir>/__mocks__/cli-utils.ts",
    "@aws-sdk/client-s3": "<rootDir>/__mocks__/client-s3.ts",
    uuid: "<rootDir>/__mocks__/uuid.ts",
  },
};

export default config;
