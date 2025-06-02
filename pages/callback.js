/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {useEffect} from 'react' // Import useEffect
import {useRouter} from 'next/router' // Import useRouter
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react' // Assuming still valid
import {useCurrentCustomer} from '../../app/hooks/use-current-customer' // Adjusted path
import {useCurrentBasket} from '../../app/hooks/use-current-basket' // Adjusted path
import {API_ERROR_MESSAGE} from '../../app/constants' // Adjusted path
import {useToast} from '../../app/hooks/use-toast' // Adjusted path
import {useIntl} from 'react-intl' // Import useIntl
import LoadingSpinner from '../../app/components/loading-spinner' // Adjusted path

const LoginRedirect = () => {
    const router = useRouter()
    const {login} = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C) // This hook needs to be Next.js compatible
    const {data: customer} = useCurrentCustomer() // Ensure this hook works
    const {data: basket} = useCurrentBasket() // Ensure this hook works
    const toast = useToast()
    const {formatMessage} = useIntl()

    useEffect(() => {
        const params = new URLSearchParams(router.asPath.split('?')[1] || '')
        const code = params.get('code')
        const usid = params.get('usid')
        const redirectUrl = params.get('redirectUrl') || '/'


        const loginGuest = async () => {
            try {
                await login({
                    parameters: {
                        usid,
                        code,
                        // Ensure this redirectUri matches your SLAS configuration for the callback
                        redirectUri: `${window.location.origin}/callback`
                    }
                })
                router.replace(redirectUrl)
            } catch (error) {
                toast({
                    title: formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
                router.replace('/')
            }
        }

        // Only attempt login if it's a guest user and there's a basket.
        // Otherwise, redirect away as this page is only for guest->registered transition via SLAS.
        if (customer?.isGuest && basket?.basketId) {
            if (code && usid) { // Ensure code and usid are present
                loginGuest()
            } else {
                // If code or usid is missing, it's an invalid callback, redirect to home.
                toast({
                    title: formatMessage({defaultMessage: "Invalid callback parameters.", id: "login_redirect.error.invalid_callback"}),
                    status: 'error'
                })
                router.replace('/')
            }
        } else if (customer && !customer.isGuest) {
            // If the user is already registered, redirect them.
            router.replace(redirectUrl)
        } else if (!customer && !basket) {
            // If there's no customer or basket data (still loading perhaps, or an error state),
            // it might be too early to act, or it's an unexpected state.
            // For now, let's redirect to home to avoid getting stuck.
             router.replace('/')
        }
        // Dependencies for the useEffect hook
    }, [router, customer, basket, login, toast, formatMessage])


    return <LoadingSpinner /> // Show a loading spinner while processing
}

// LoginRedirect.getTemplateName = () => 'login-redirect' // Removed PWA Kit specific

export default LoginRedirect
