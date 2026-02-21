/** @type {import('jest').Config} */
const config = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(t|j)sx?$": ["babel-jest", { presets: ["next/babel"] }],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    testPathIgnorePatterns: ["/node_modules/", "/.next/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/app/layout.tsx",
    ],
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
    },
};

module.exports = config;
