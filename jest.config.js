/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')

module.exports = {
    // Removed PWA Kit base: ...base,
    testEnvironment: 'jest-environment-jsdom',
    clearMocks: true,
    moduleDirectories: ['node_modules', '<rootDir>/'],
    moduleNameMapper: {
        // Removed PWA Kit base.moduleNameMapper
        // Removed '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js',
        // Removed '^@salesforce/retail-react-app(.*)$': '<rootDir>$1',
        // Kept react alias for now, though often not needed with Next.js if using consistent React versions
        '^react$': '<rootDir>/node_modules/react/index.js', 
        '^@tanstack/react-query$':
            '<rootDir>/node_modules/@tanstack/react-query/build/lib/index.js',
        '^is-what$': '<rootDir>/node_modules/is-what/dist/cjs/index.cjs',
        '^copy-anything$': '<rootDir>/node_modules/copy-anything/dist/cjs/index.cjs',
        "^@salesforce/cc-datacloud-typescript$": "<rootDir>/node_modules/@salesforce/cc-datacloud-typescript/dist/index.js",
        
        // Added mocks for static assets and CSS
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",

        // Optional: Add Next.js path aliases if you configure them in jsconfig.json/tsconfig.json
        // Example: '^@/components/(.*)$': '<rootDir>/components/$1',
    },
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { "presets": ["next/babel"] }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!@salesforce/cc-datacloud-typescript)', // Kept existing, might need review with Next.js
        '^.+\\.module\\.(css|sass|scss)$',
    ],
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    collectCoverageFrom: [
        'pages/**/*.{js,jsx}',
        'app/components/**/*.{js,jsx}',
        'app/hooks/**/*.{js,jsx}',
        'app/utils/**/*.{js,jsx}',
        'pages/api/**/*.{js,jsx}',
        // 'non-pwa/**/*.{js,jsx}', // Review if this directory is still relevant
        // 'worker/**/*.{js,jsx}', // Service worker logic changed with next-pwa
        'scripts/generator/*.{js,jsx}',
        '!app/pages/test-container/**/*.{js,jsx}', // This path might need update if test-container is kept
        '!app/utils/test-utils.js', // This path might need update
        '!app/mocks/*.js', // This path might need update
        '!public/**',
        '!app/theme/**',
        '!node_modules/**',
        // Removed PWA Kit specific ignores: '!app/main.jsx', '!app/loader.js', '!app/ssr.js',
    ],
    //@TODO: Revert this threshold back to original numbers stattements: 80, branches: 72, functions: 78, lines: 83
    coverageThreshold: {
        global: {
            statements: 73,
            branches: 60,
            functions: 65,
            lines: 74
        }
    },
    // Increase to: 6 x default timeout of 5 seconds
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
