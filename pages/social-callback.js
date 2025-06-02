/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import Head from 'next/head' // Using Next.js Head
import {useRouter} from 'next/router' // Using Next.js router
import {
    Alert,
    Box,
    Container,
    Stack,
    Text,
    Spinner
} from '../../app/components/shared/ui' // Adjusted path
import {AlertIcon} from '../../app/components/icons' // Adjusted path

// Hooks
import useNavigation from '../../app/hooks/use-navigation' // Adjusted path
import {useAuthHelper, AuthHelpers, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react' // Assuming still valid
// import {useSearchParams} from '@salesforce/retail-react-app/app/hooks' // Replaced by router.query
import {useCurrentCustomer} from '../../app/hooks/use-current-customer' // Adjusted path
// import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config' // Config access might change
import {useAppOrigin} from '../../app/hooks/use-app-origin' // Adjusted path
import {
    getSessionJSONItem,
    clearSessionJSONItem,
    buildRedirectURI
} from '../../app/utils/utils' // Adjusted path
import {API_ERROR_MESSAGE} from '../../app/constants' // Adjusted path
// Seo component is replaced by Head if needed, but this page is a redirect handler

const SocialLoginRedirect = () => {
    const {formatMessage} = useIntl()
    const router = useRouter() // Using Next.js router
    // const navigate = useNavigation() // Replaced or adapted by router
    // const [searchParams] = useSearchParams() // Replaced by router.query
    const loginIDPUser = useAuthHelper(AuthHelpers.LoginIDPUser) // This hook needs to be Next.js compatible
    const {data: customer} = useCurrentCustomer() // Ensure this hook works
    // Build redirectURI from config values
    const appOrigin = useAppOrigin() // Ensure this hook is Next.js compatible
    // const redirectPath = getConfig().app.login.social?.redirectURI || '' // Config access needs review
    const redirectPath = process.env.NEXT_PUBLIC_SOCIAL_LOGIN_REDIRECT_URI || '/social-callback' // Example env var
    const redirectURI = buildRedirectURI(appOrigin, redirectPath)

    const locatedFrom = typeof window !== 'undefined' ? getSessionJSONItem('returnToPage') : null // Check for window
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const [error, setError] = useState('')

    // Adding Einstein and DataCloud hooks, assuming they are needed as in other pages
    // const einstein = useEinstein() // Assuming these hooks exist and are adapted
    // const dataCloud = useDataCloud() // Assuming these hooks exist and are adapted
    // useEffect(() => {
    //     einstein.sendViewPage(router.pathname)
    //     dataCloud.sendViewPage(router.pathname)
    // }, [router.pathname, einstein, dataCloud])

    // Runs after successful 3rd-party IDP authorization, processing query parameters
    useEffect(() => {
        const code = router.query.code as string; // Type assertion if using TypeScript
        const usid = router.query.usid as string;

        if (!code) {
            // setError(formatMessage({defaultMessage: "Missing authorization code.", id: "social_login_redirect.error.missing_code"}))
            return
        }
        const socialLogin = async () => {
            try {
                await loginIDPUser.mutateAsync({
                    code: code,
                    redirectURI: redirectURI,
                    ...(usid && {usid: usid})
                })
            } catch (error) {
                const message = formatMessage(API_ERROR_MESSAGE)
                setError(message)
            }
        }
        socialLogin()
    }, [router.query, loginIDPUser, redirectURI, formatMessage]) // Added dependencies

    // If customer is registered, push to secure account page
    useEffect(() => {
        if (!customer?.isRegistered) {
            return
        }
        if (typeof window !== 'undefined') clearSessionJSONItem('returnToPage') // Check for window
        mergeBasket.mutate({
            headers: {
                'Content-Type': 'application/json'
            },
            parameters: {
                createDestinationBasket: true
            }
        })
        if (locatedFrom) {
            router.replace(locatedFrom) // Using router.replace
        } else {
            router.replace('/account') // Using router.replace
        }
    }, [customer?.isRegistered, mergeBasket, locatedFrom, router]) // Added dependencies

    return (
        <>
            <Head>
                <title>{formatMessage({defaultMessage: "Social Login Processing...", id: "social_login_redirect.title"})}</title>
            </Head>
            <Box data-testid="login-redirect-page" bg="gray.50" py={[8, 16]}>
                <Container
                    paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                {error && (
                    <Alert status="error" marginBottom={8}>
                        <AlertIcon color="red.500" boxSize={4} />
                        <Text fontSize="sm" ml={3}>
                            {error}
                        </Text>
                    </Alert>
                )}
                <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                    <Spinner opacity={0.85} color="blue.600" animationDuration="0.8s" size="lg" />
                    <Text align="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage
                            id="social_login_redirect.message.authenticating"
                            defaultMessage="Authenticating..."
                        />
                    </Text>
                        <Text align="center" fontSize="m">
                            <FormattedMessage
                                id="social_login_redirect.message.redirect_link"
                                defaultMessage="If you are not automatically redirected, click <link>this link</link> to proceed."
                                values={{
                                    link: (chunks) => (
                                        <NextLink href="/account" passHref>
                                            <Text as="a" style={{color: '#0176D3', textDecoration: 'underline'}}>
                                                {chunks}
                                            </Text>
                                        </NextLink>
                                    )
                                }}
                            />
                        </Text>
                    </Stack>
                </Container>
            </Box>
        </>
    )
}

// SocialLoginRedirect.getTemplateName = () => 'social-login-redirect' // Removed PWA Kit specific

export default SocialLoginRedirect
