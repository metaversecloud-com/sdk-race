import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/"],
  testMatch: ["**/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
  restoreMocks: true,

  moduleNameMapper: {
    "^@rtsdk/topia$": "<rootDir>/mocks/@rtsdk/topia.ts",
    "^@rtsdk/topia/(.*)$": "<rootDir>/mocks/@rtsdk/topia.ts",

    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
