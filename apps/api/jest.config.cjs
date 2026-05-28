/** @type {import("jest").Config} */
const config = {
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  preset: "ts-jest/presets/default-esm",
  rootDir: ".",
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"]
};

module.exports = config;
