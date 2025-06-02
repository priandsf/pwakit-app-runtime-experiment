/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
// import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
// import {Route, Switch, useRouteMatch, Redirect} from 'react-router' // Next.js uses file-system routing
import {useRouter} from 'next/router' // Using Next.js router
import Head from 'next/head' // Using Next.js Head
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Stack,
    Text,
    Divider
} from '../../../app/components/shared/ui' // Adjusted path
// import Seo from '@salesforce/retail-react-app/app/components/seo'
// import Link from '@salesforce/retail-react-app/app/components/link'
import NextLink from 'next/link' // Using Next.js Link
import {
    ChevronDownIcon,
    ChevronUpIcon,
    SignoutIcon
} from '../../../app/components/icons' // Adjusted path
import AccountDetail from '../../../app/pages/account/profile' // Adjusted path
import AccountAddresses from '../../../app/pages/account/addresses' // Adjusted path
import AccountOrders from '../../../app/pages/account/orders' // Adjusted path
import AccountWishlist from './wishlist' // Adjusted to point to the new wishlist page location
// import {useLocation} from 'react-router-dom' // Replaced by useRouter

import {messages, navLinks} from '../../../app/pages/account/constant' // Adjusted path
import useNavigation from '../../../app/hooks/use-navigation' // Adjusted path
import LoadingSpinner from '../../../app/components/loading-spinner' // Adjusted path
import useMultiSite from '../../../app/hooks/use-multi-site' // Adjusted path
import useEinstein from '../../../app/hooks/use-einstein' // Adjusted path
import useDataCloud from '../../../app/hooks/use-datacloud' // Adjusted path
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react' // Assuming still valid
import {useCurrentCustomer} from '../../../app/hooks/use-current-customer' // Adjusted path
// import {isHydrated} from '@salesforce/retail-react-app/app/utils/utils' // Determine by typeof window

// const onClient = typeof window !== 'undefined' // Can be checked directly where needed

const LogoutButton = ({onClick}) => {
    const {formatMessage} = useIntl()
    return (
        <>
            <Divider colorScheme={'gray'} marginTop={3} />
            <Button
                fontWeight="500"
                onClick={onClick}
                padding={4}
                py={0}
                variant="unstyled"
                _hover={{background: 'gray.50'}}
                marginTop={1}
                borderRadius="4px"
                cursor={'pointer'}
                height={11}
            >
                <Flex justify={{base: 'center', lg: 'flex-start'}}>
                    <SignoutIcon boxSize={5} mr={2} aria-hidden={true} />
                    <Text as="span" fontSize={['md', 'md', 'md', 'sm']} fontWeight="normal">
                        {formatMessage({
                            defaultMessage: 'Log Out',
                            id: 'account.logout_button.button.log_out'
                        })}
                    </Text>
                </Flex>
            </Button>
        </>
    )
}

// LogoutButton.propTypes = { // PropTypes not typically used in Next.js pages
//     onClick: PropTypes.func.isRequired
// }

const Account = () => {
    // const {path} = useRouteMatch() // Not used in Next.js like this
    const router = useRouter()
    const {pathname, query} = router // Get current path and query
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer() // Ensure this hook works in Next.js
    // const {isRegistered, customerType} = customer || {} // Add default empty object for customer
    const isRegistered = customer?.isRegistered
    const customerType = customer?.customerType


    const logout = useAuthHelper(AuthHelpers.Logout)
    // const location = useLocation() // Replaced by router
    const navigate = useNavigation() // May need adaptation

    const [mobileNavIndex, setMobileNavIndex] = useState(-1)
    const [showLoading, setShowLoading] = useState(false)

    const einstein = useEinstein()
    const dataCloud = useDataCloud()

    const {buildUrl} = useMultiSite() // Ensure this hook is Next.js compatible
    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [pathname, einstein, dataCloud]) // Added dependencies

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
    }

    useEffect(() => {
        // If we have customer data and they are not registered, push to login page
        if (typeof window !== 'undefined' && customerType !== null && !isRegistered) {
            const loginPath = buildUrl('/login')
            router.push({pathname: loginPath, query: {redirectUrl: '/account'}}) // Use router.push for redirection
        }
    }, [customerType, isRegistered, buildUrl, router])


    // Render loading or placeholder if customer data is not yet available
    if (typeof window !== 'undefined' && customerType === null) {
        return <LoadingSpinner />
    }
    // Do not render the page if the user is not registered and redirection is about to happen or customer data is not loaded
    if (typeof window !== 'undefined' && !isRegistered) {
         return <LoadingSpinner /> // Or some other placeholder
    }


    return (
        <Box
            data-testid={isRegistered && typeof window !== 'undefined' ? 'account-page' : 'account-page-skeleton'} // Adjusted condition
            layerStyle="page"
            paddingTop={[4, 4, 12, 12, 16]}
        >
            {/* <Seo title="My Account" description="Customer Account Page" /> */}
            <Head>
                <title>{formatMessage({defaultMessage: "My Account", id: "account.seo.title"})}</title>
                <meta name="description" content={formatMessage({defaultMessage: "Customer Account Page", id: "account.seo.description"})} />
            </Head>
            <Grid templateColumns={{base: '1fr', lg: '320px 1fr'}} gap={{base: 10, lg: 24}}>
                {/* small screen nav accordion */}
                <Accordion
                    display={{base: 'block', lg: 'none'}}
                    allowToggle={true}
                    reduceMotion={true}
                    index={mobileNavIndex}
                    onChange={setMobileNavIndex}
                >
                    <AccordionItem border="none" background="gray.50" borderRadius="base">
                        {({isExpanded}) => (
                            <>
                                <AccordionButton
                                    as={Button}
                                    height={16}
                                    paddingLeft={8}
                                    variant="ghost"
                                    color="black"
                                    _active={{background: 'gray.100'}}
                                    _expanded={{background: 'transparent'}}
                                >
                                    <Flex align="center" justify="center">
                                        <Heading as="h2" fontSize="16px">
                                            <FormattedMessage
                                                defaultMessage="My Account"
                                                id="account.accordion.button.my_account"
                                            />
                                        </Heading>
                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </Flex>
                                </AccordionButton>
                                <AccordionPanel px={4} paddingBottom={4}>
                                    <Flex as="nav" spacing={0} direction="column">
                                        <Stack spacing={0} as="ul" data-testid="account-nav">
                                            {navLinks.map((link) => (
                                                <Box
                                                    align="center"
                                                    key={link.name}
                                                    as="li"
                                                    listStyleType="none"
                                                >
                                                    <NextLink href={`/account${link.path}`} passHref>
                                                        <Button
                                                            as="a" // Render as an anchor tag
                                                            variant="menu-link-mobile"
                                                            justifyContent="center"
                                                            fontSize="md"
                                                            fontWeight="normal"
                                                            width="100%"
                                                            onClick={() => setMobileNavIndex(-1)}
                                                            isActive={pathname === `/account${link.path}`} // Example active state
                                                        >
                                                            {formatMessage(messages[link.name])}
                                                        </Button>
                                                    </NextLink>
                                                </Box>
                                            ))}

                                            <LogoutButton
                                                justify="center"
                                                onClick={onSignoutClick}
                                            />
                                        </Stack>
                                    </Flex>
                                </AccordionPanel>
                            </>
                        )}
                    </AccordionItem>
                </Accordion>

                {/* large screen nav sidebar */}
                <Stack display={{base: 'none', lg: 'flex'}} spacing={4}>
                    {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

                    <Heading as="h2" fontSize="18px">
                        <FormattedMessage
                            defaultMessage="My Account"
                            id="account.heading.my_account"
                        />
                    </Heading>

                    <Flex spacing={0} as="nav" data-testid="account-detail-nav" direction="column">
                        {navLinks.map((link) => {
                            const LinkIcon = link.icon
                            return (
                                <NextLink key={link.name} href={`/account${link.path}`} passHref>
                                    <Button
                                        as="a" // Render as an anchor tag
                                        variant="menu-link"
                                        leftIcon={<LinkIcon boxSize={5} />}
                                        isActive={pathname === `/account${link.path}`} // Example active state
                                    >
                                        {formatMessage(messages[link.name])}
                                    </Button>
                                </NextLink>
                            )
                        })}
                        <LogoutButton onClick={onSignoutClick} />
                    </Flex>
                </Stack>

                {/* Content based on current route - Next.js handles this via file structure */}
                {/* For example, if router.pathname is '/account', show AccountDetail */}
                {/* If router.pathname is '/account/wishlist', show AccountWishlist, etc. */}
                {/* This logic will be simplified by Next.js file-based routing. */}
                {/* The sub-pages (AccountDetail, AccountWishlist, etc.) will be separate files. */}
                {/* For now, we render based on the `query` or `pathname` for simplicity if needed, but ideally these are separate pages */}
                {/* This component will primarily be the layout for /account, and sub-routes will have their own files */}
                {(!query || Object.keys(query).length === 0 && pathname === '/account') && <AccountDetail />}
                {pathname === '/account/wishlist' && <AccountWishlist />}
                {pathname === '/account/addresses' && <AccountAddresses />}
                {pathname === '/account/orders' && <AccountOrders />}

            </Grid>
        </Box>
    )
}

// Account.getTemplateName = () => 'account' // Removed PWA Kit specific

// Account.propTypes = { // PropTypes not typically used in Next.js pages
//     match: PropTypes.object
// }

export default Account
