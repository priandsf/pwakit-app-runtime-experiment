/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
// import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Container} from '../../app/components/shared/ui' // Adjusted path
import Head from 'next/head' // Using next/head
import {useRouter} from 'next/router' // Using next/router
import {AuthHelpers, useAuthHelper, useCustomerType} from '@salesforce/commerce-sdk-react' // Assuming still valid
import {useForm} from 'react-hook-form'
// import {useLocation} from 'react-router-dom' // Replaced by useRouter
// import Seo from '@salesforce/retail-react-app/app/components/seo'
import RegisterForm from '../../app/components/register' // Adjusted path
import useNavigation from '../../app/hooks/use-navigation' // Adjusted path
import useEinstein from '../../app/hooks/use-einstein' // Adjusted path
import useDataCloud from '../../app/hooks/use-datacloud' // Adjusted path
import {API_ERROR_MESSAGE} from '../../app/constants' // Adjusted path

const Registration = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation() // This hook might need adaptation for Next.js navigation
    const {isRegistered} = useCustomerType()
    const form = useForm()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const router = useRouter() // Using Next.js router
    const {pathname} = router // Using pathname from router
    const register = useAuthHelper(AuthHelpers.Register)

    const submitForm = async (data) => {
        const body = {
            customer: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                login: data.email
            },
            password: data.password
        }

        try {
            await register.mutateAsync(body, {})
        } catch (e) {
            form.setError('global', {type: 'manual', message: formatMessage(API_ERROR_MESSAGE)})
        }
    }

    useEffect(() => {
        if (isRegistered) {
            navigate('/account')
        }
    }, [isRegistered])

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [pathname, einstein, dataCloud]) // Added dependencies

    return (
        <Box data-testid="registration-page" bg="gray.50" py={[8, 16]}>
            {/* <Seo title="Registration" description="Customer sign up" /> */}
            <Head>
                <title>{formatMessage({defaultMessage: "Registration", id: "registration.title.registration"})}</title>
                <meta name="description" content={formatMessage({defaultMessage: "Customer sign up", id: "registration.description.customer_sign_up"})} />
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
                <RegisterForm
                    submitForm={submitForm}
                    form={form}
                    clickSignIn={() => navigate('/login')}
                />
            </Container>
        </Box>
    )
}

// Registration.getTemplateName = () => 'registration' // Removed PWA Kit specific method

// Registration.propTypes = { // PropTypes are not typically used in Next.js pages
//     match: PropTypes.object
// }

export default Registration
