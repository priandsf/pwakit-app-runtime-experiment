/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Route, Switch, useRouteMatch, Redirect} from 'react-router'
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
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import Link from '@salesforce/retail-react-app/app/components/link'
import {
    ChevronDownIcon,
    ChevronUpIcon,
    SignoutIcon
} from '@salesforce/retail-react-app/app/components/icons'
import AccountDetail from '@salesforce/retail-react-app/app/pages/account/profile'
import AccountAddresses from '@salesforce/retail-react-app/app/pages/account/addresses'
import AccountOrders from '@salesforce/retail-react-app/app/pages/account/orders'
import AccountWishlist from '@salesforce/retail-react-app/app/pages/account/wishlist/index'
import {useLocation} from 'react-router-dom'

import {messages, navLinks} from '@salesforce/retail-react-app/app/pages/account/constant'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {isHydrated} from '@salesforce/retail-react-app/app/utils/utils'

const onClient = typeof window !== 'undefined'
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

LogoutButton.propTypes = {
    onClick: PropTypes.func.isRequired
}
const Account = () => {
    const {path} = useRouteMatch()
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer

    const logout = useAuthHelper(AuthHelpers.Logout)
    const location = useLocation()
    const navigate = useNavigation()

    const [mobileNavIndex, setMobileNavIndex] = useState(-1)
    const [showLoading, setShowLoading] = useState(false)

    const einstein = useEinstein()
    const dataCloud = useDataCloud()

    const {buildUrl} = useMultiSite()
    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(location.pathname)
        dataCloud.sendViewPage(location.pathname)
    }, [location])

    const onSignoutClick = async () => {
        setShowLoading(true)
        await logout.mutateAsync()
        navigate('/login')
    }

    // If we have customer data and they are not registered, push to login page
    // Using Redirect allows us to store the directed page to location
    // so we can direct users back after they are successfully log in
    if (customerType !== null && !isRegistered && onClient) {
        const path = buildUrl('/login')
        return <Redirect to={{pathname: path, state: {directedFrom: '/account'}}} />
    }

    return (
        <Box
            data-testid={isRegistered && isHydrated() ? 'account-page' : 'account-page-skeleton'}
            layerStyle="page"
            paddingTop={[4, 4, 12, 12, 16]}
        >
            <Seo title="My Account" description="Customer Account Page" />
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
                                                    <Button
                                                        as={Link}
                                                        to={`/account${link.path}`}
                                                        useNavLink={true}
                                                        variant="menu-link-mobile"
                                                        justifyContent="center"
                                                        fontSize="md"
                                                        fontWeight="normal"
                                                        width="100%"
                                                        onClick={() => setMobileNavIndex(-1)}
                                                    >
                                                        {formatMessage(messages[link.name])}
                                                    </Button>
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
                                <Button
                                    key={link.name}
                                    as={Link}
                                    to={`/account${link.path}`}
                                    useNavLink={true}
                                    variant="menu-link"
                                    leftIcon={<LinkIcon boxSize={5} />}
                                >
                                    {formatMessage(messages[link.name])}
                                </Button>
                            )
                        })}
                        <LogoutButton onClick={onSignoutClick} />
                    </Flex>
                </Stack>

                <Switch>
                    <Route exact path={path}>
                        <AccountDetail />
                    </Route>
                    <Route exact path={`${path}/wishlist`}>
                        <AccountWishlist />
                    </Route>
                    <Route exact path={`${path}/addresses`}>
                        <AccountAddresses />
                    </Route>
                    <Route path={`${path}/orders`}>
                        <AccountOrders />
                    </Route>
                </Switch>
            </Grid>
        </Box>
    )
}

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account
