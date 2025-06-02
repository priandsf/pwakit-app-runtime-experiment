/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
// import PropTypes from 'prop-types'
import {Box, Container} from '../../app/components/shared/ui' // Adjusted path
import Head from 'next/head' // Using next/head
import {useRouter} from 'next/router' // Using next/router
import {useForm} from 'react-hook-form'
// import Seo from '@salesforce/retail-react-app/app/components/seo'
import ResetPasswordForm from '../../app/components/reset-password' // Adjusted path
import ResetPasswordLanding from '../../app/pages/reset-password/reset-password-landing' // Adjusted path
import useNavigation from '../../app/hooks/use-navigation' // Adjusted path
import useEinstein from '../../app/hooks/use-einstein' // Adjusted path
import useDataCloud from '../../app/hooks/use-datacloud' // Adjusted path
// import {useLocation} from 'react-router-dom' // Replaced by useRouter
// import {useRouteMatch} from 'react-router' // path logic will change
import {usePasswordReset} from '../../app/hooks/use-password-reset' // Adjusted path
import {
    RESET_PASSWORD_LANDING_PATH, // This will likely be a separate page or handled by dynamic routing
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE
} from '../../app/constants' // Adjusted path

const ResetPassword = () => {
    const {formatMessage} = useIntl()
    const form = useForm()
    const navigate = useNavigation() // This hook might need adaptation for Next.js navigation
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const router = useRouter() // Using Next.js router
    const {pathname} = router // Using pathname from router
    // const {path} = useRouteMatch() // path from router can be used for conditional rendering if needed
    const {getPasswordResetToken} = usePasswordReset()

    const submitForm = async ({email}) => {
        try {
            await getPasswordResetToken(email)
        } catch (e) {
            const message =
                e.response?.status === 400
                    ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                    : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [pathname, einstein, dataCloud]) // Added dependencies

    // Determine if the current path is for the landing page.
    // In Next.js, this would typically be handled by having a separate file like `pages/reset-password/token.js`
    // For now, we'll simulate this with a query parameter or a specific path segment.
    // Let's assume if there's a 'token' query param, it's the landing/confirmation part.
    const isLandingPage = !!router.query.token || pathname.includes('/reset-password/confirm');


    return (
        <Box data-testid="reset-password-page" bg="gray.50" py={[8, 16]}>
            {/* <Seo title="Reset password" description="Reset customer password" /> */}
            <Head>
                <title>{formatMessage({defaultMessage: "Reset Password", id: "reset_password.title.main"})}</title>
                <meta name="description" content={formatMessage({defaultMessage: "Reset customer password", id: "reset_password.description.main"})} />
            </Head>
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                {isLandingPage ? (
                    <ResetPasswordLanding />
                ) : (
                    <ResetPasswordForm
                        form={form}
                        submitForm={submitForm}
                        clickSignIn={() => router.push('/login')} // Using router.push
                    />
                )}
            </Container>
        </Box>
    )
}

// ResetPassword.getTemplateName = () => 'reset-password' // Removed PWA Kit specific method

// ResetPassword.propTypes = { // PropTypes are not typically used in Next.js pages
//     match: PropTypes.object
// }

export default ResetPassword
