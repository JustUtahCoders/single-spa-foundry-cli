/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
const config = {
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
  extensionsToTreatAsEsm: [".ts"],
};

export default config;
