/** @type {import("jest").Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: "src",
    testRegex: "\.spec\.ts$",
    moduleFileExtensions: ["js", "json", "ts"],
    transform: {
        "^.+\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.test.json" }],
    },
    collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!**/index.ts"],
    coverageDirectory: "../coverage",
};
