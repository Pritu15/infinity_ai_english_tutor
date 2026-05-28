/** @type {import("jest").Config} */
const config = {
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  preset: "ts-jest/presets/default-esm",
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"]
};

module.exports = config;
