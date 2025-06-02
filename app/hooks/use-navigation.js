/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
// import {useHistory} from 'react-router' // Replaced with next/router
import {useRouter} from 'next/router'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site' // Assuming this hook is or will be Next.js compatible
import {removeSiteLocaleFromPath} from '@salesforce/retail-react-app/app/utils/url'

/**
 * A convenience hook for programmatic navigation uses history's `push` or `replace`. The proper locale
 * is automatically prepended to the provided path. Additional args are passed through to `router`.
 * @returns {function} - Returns a navigate function that passes args to router methods.
 */
const useNavigation = () => {
    const router = useRouter() // Using Next.js router

    const {site, locale: localeShortCode, buildUrl} = useMultiSite() // Assuming this hook is or will be Next.js compatible

    return useCallback(
        /**
         *
         * @param {string} path - path to navigate to
         * @param {('push'|'replace')} action - which history method to use
         * @param  {...any} args - additional args passed to `.push` or `.replace`
         */
        (path, action = 'push', ...args) => {
            const updatedHref = buildUrl(removeSiteLocaleFromPath(path))
            // history[action](path === '/' ? '/' : updatedHref, ...args)
            if (action === 'replace') {
                router.replace(path === '/' ? '/' : updatedHref, ...args)
            } else {
                router.push(path === '/' ? '/' : updatedHref, ...args)
            }
        },
        [localeShortCode, site, buildUrl, router] // Added router and buildUrl to dependencies
    )
}

export default useNavigation
