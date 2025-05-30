/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-var-requires */
// fetch polyfill can be removed when node 16 is no longer supported
require('cross-fetch/polyfill')
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
require('@testing-library/jest-dom/extend-expect')
const mockConfig = require('@salesforce/retail-react-app/config/mocks/default')
const {configure: configureTestingLibrary} = require('@testing-library/react')
const {Crypto} = require('@peculiar/webcrypto')
const {setupServer} = require('msw/node')
const {rest} = require('msw')
const {
    mockCategory,
    mockedRegisteredCustomer,
    exampleTokenReponse,
    mockCustomerBaskets
} = require('./app/mocks/mock-data')

// set jsdom in https context to allow read/write secure cookies
global.jsdom.reconfigure({url: 'https://www.domain.com'})

configureTestingLibrary({
    // Increase to: 6 x default timeout of 1 second
    ...(process.env.CI ? {asyncUtilTimeout: 6000} : {})
})

/**
 * Set up an API mocking server for testing purposes.
 * This mock server includes the basic oauth flow endpoints.
 */
export const setupMockServer = () => {
    return setupServer(
        rest.post('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.get('*/oauth2/authorize', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/oauth2/logout', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(exampleTokenReponse))
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        ),
        rest.get('*/shopper-context/:usid', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json({}))
        ),
        rest.get('*/shopper-experience/*', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json({}))
        ),
        rest.post('*/sessions', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    // FYI decoded token has this payload:
                    // {
                    // "sub": "cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5",
                    // "name": "John Doe",
                    // "exp": 2673911261,
                    // "iat": 2673909461,
                    // "isb": "uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx"
                    // }
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYy1zbGFzOjp6enJmXzAwMTo6c2NpZDpjOWM0NWJmZC0wZWQzLTRhYTIteHh4eC00MGY4ODk2MmI4MzY6OnVzaWQ6YjQ4NjUyMzMtZGU5Mi00MDM5LXh4eHgtYWEyZGZjOGMxZWE1IiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoyNjczOTExMjYxLCJpYXQiOjI2NzM5MDk0NjEsImlzYiI6InVpZG86ZWNvbTo6dXBuOkd1ZXN0fHx4eHhFbWFpbHh4eDo6dWlkbjpGaXJzdE5hbWUgTGFzdE5hbWU6OmdjaWQ6eHh4R3Vlc3RDdXN0b21lcklkeHh4OjpyY2lkOnh4eFJlZ2lzdGVyZWRDdXN0b21lcklkeHh4OjpjaGlkOnh4eFNpdGVJZHh4eCJ9.CQpejPFNav6NLc_csSImVcDxeY8GVzBHblE9lu7RtGM',

                    customer_id: 'customerid',
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        ),
        rest.get('*/categories/:categoryId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockCategory))
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/v3/activities/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json({}))
        }),
        rest.post('*/activities/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json({}))
        }),
        rest.post('*/v3/personalization/recs/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json({}))
        }),
        // Mock Data Cloud API
        rest.post('*.c360a.salesforce.com/web/events/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(204), ctx.json({}))
        })
    )
}

beforeAll(() => {
    global.server = setupMockServer()
    global.server.listen({
        onUnhandledRequest(req) {
            console.error('Found an unhandled %s request to %s', req.method, req.url.href)
        }
    })
})
afterEach(() => {
    global.server.resetHandlers()
})
afterAll(() => {
    global.server.close()
})

// Mock the application configuration to be used in all tests.
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})

// TextEncoder is a web API, need to import it
// from nodejs util in testing environment.
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// This file consists of global mocks for jsdom.
class StorageMock {
    constructor() {
        this.store = {}
    }
    clear() {
        this.store = {}
    }
    getItem(key) {
        return this.store[key] || null
    }
    setItem(key, value) {
        this.store[key] = value?.toString()
    }
    removeItem(key) {
        delete this.store[key]
    }
}

Object.defineProperty(window, 'crypto', {
    value: new Crypto()
})

Object.defineProperty(window, 'localStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'sessionStorage', {
    value: new StorageMock()
})

Object.defineProperty(window, 'scrollTo', {
    value: () => null
})

if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }))
    })
}

const prepareHandlers = (handlerConfig = []) => {
    return handlerConfig.map((config) => {
        return rest[config.method?.toLowerCase() || 'get'](config.path, (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(config.status || 200),
                config.res && ctx.json(config.res(req, res, ctx))
            )
        })
    })
}

/**
 * This util function allows developer to prepend handlers to the mock server by passing a config array of objects
 *
 * @param handlerConfig
 * @example
 * const handlers = [
 *  {
 *      path: "*\/products/"
 *      method: 'post',
 *      res: (req, res, ctx) => {
 *          return mockData
 *      }
 *  }
 * ]
 */
export const prependHandlersToServer = (handlerConfig) => {
    const handlers = prepareHandlers(handlerConfig)
    global.server.use(...handlers)
}
