/*
 * Copyright (c) 2021, salesforce.com, inc.
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
    AlertIcon,
    Box,
    Button,
    Container,
    Grid,
    GridItem,
    Stack
} from '../../app/components/shared/ui' // Adjusted path
import useNavigation from '../../app/hooks/use-navigation' // Adjusted path
import {
    CheckoutProvider, // This will need to be available in the Next.js context if still used
    useCheckout
} from '../../app/pages/checkout/util/checkout-context' // Adjusted path
import ContactInfo from '../../app/pages/checkout/partials/contact-info' // Adjusted path
import ShippingAddress from '../../app/pages/checkout/partials/shipping-address' // Adjusted path
import ShippingOptions from '../../app/pages/checkout/partials/shipping-options' // Adjusted path
import Payment from '../../app/pages/checkout/partials/payment' // Adjusted path
import OrderSummary from '../../app/components/order-summary' // Adjusted path
import {useCurrentCustomer} from '../../app/hooks/use-current-customer' // Adjusted path
import {useCurrentBasket} from '../../app/hooks/use-current-basket' // Adjusted path
import CheckoutSkeleton from '../../app/pages/checkout/partials/checkout-skeleton' // Adjusted path
import {useShopperOrdersMutation, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react' // Assuming still valid
import UnavailableProductConfirmationModal from '../../app/components/unavailable-product-confirmation-modal' // Adjusted path
import {
    API_ERROR_MESSAGE,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART
} from '../../app/constants' // Adjusted path
import {useToast} from '../../app/hooks/use-toast' // Adjusted path
import LoadingSpinner from '../../app/components/loading-spinner' // Adjusted path
// import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config' // Config access might change
// Seo component is replaced by Head

const Checkout = () => {
    const {formatMessage} = useIntl()
    const router = useRouter() // Using Next.js router
    // const navigate = useNavigation() // Replaced by router for main navigation
    const {step} = useCheckout() // This context hook needs to work in Next.js
    const [error, setError] = useState()
    const {data: basket} = useCurrentBasket() // Ensure this hook works
    const [isLoading, setIsLoading] = useState(false)
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    // const {passwordless = {}, social = {}} = getConfig().app.login || {} // Config access needs review
    const isSocialEnabled = process.env.NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED === 'true' // Example env var
    const isPasswordlessEnabled = process.env.NEXT_PUBLIC_PASSWORDLESS_ENABLED === 'true' // Example env var
    const idps = process.env.NEXT_PUBLIC_IDPS // Example env var, might be JSON string

    useEffect(() => {
        if (error || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [error, step])

    const submitOrder = async () => {
        setIsLoading(true)
        try {
            const order = await createOrder({
                body: {basketId: basket.basketId}
            })
            router.push(`/checkout/confirmation/${order.orderNo}`) // Using router.push
        } catch (error) {
            const message = formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            })
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    // Add Head component for SEO
    return (
        <>
            <Head>
                <title>{formatMessage({id: 'checkout.title', defaultMessage: 'Checkout'})}</title>
                {/* Add other meta tags as needed */}
            </Head>
            <Box background="gray.50" flex="1">
                <Container
                    data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 8}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <ContactInfo
                                isSocialEnabled={isSocialEnabled}
                                isPasswordlessEnabled={isPasswordlessEnabled}
                                idps={idps}
                            />
                            <ShippingAddress />
                            <ShippingOptions />
                            <Payment />

                            {step === 4 && (
                                <Box pt={3} display={{base: 'none', lg: 'block'}}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={submitOrder}
                                            isLoading={isLoading}
                                            data-testid="sf-checkout-place-order-btn"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Place Order"
                                                id="checkout.button.place_order"
                                            />
                                        </Button>
                                    </Container>
                                </Box>
                            )}
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary
                            basket={basket}
                            showTaxEstimationForm={false}
                            showCartItems={true}
                        />

                        {step === 4 && (
                            <Box display={{base: 'none', lg: 'block'}} pt={2}>
                                <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                                    <FormattedMessage
                                        defaultMessage="Place Order"
                                        id="checkout.button.place_order"
                                    />
                                </Button>
                            </Box>
                        )}
                        </GridItem>
                    </Grid>
                </Container>

                {step === 4 && (
                    <Box
                        display={{lg: 'none'}}
                        position="sticky"
                        bottom="0"
                        px={4}
                        pt={6}
                        pb={11}
                        background="white"
                        borderTop="1px solid"
                        borderColor="gray.100"
                    >
                        <Container variant="form">
                            <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                                <FormattedMessage
                                    defaultMessage="Place Order"
                                    id="checkout.button.place_order"
                                />
                            </Button>
                        </Container>
                    </Box>
                )}
            </Box>
        </>
    )
}

// The CheckoutContainer logic, especially data fetching and context provision,
// would typically be handled differently in Next.js.
// For now, we'll keep it, but it might need refactoring for idiomatic Next.js.
const CheckoutPage = () => { // Renamed to avoid conflict if we export default Checkout
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const toast = useToast()
    const [isDeletingUnavailableItem, setIsDeletingUnavailableItem] = useState(false)

    const handleRemoveItem = async (product) => {
        await removeItemFromBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                }
            }
        )
    }
    const handleUnavailableProducts = async (unavailableProductIds) => {
        setIsDeletingUnavailableItem(true)
        const productItems = basket?.productItems?.filter((item) =>
            unavailableProductIds?.includes(item.productId)
        )
        for (let item of productItems) {
            await handleRemoveItem(item)
        }
        setIsDeletingUnavailableItem(false)
    }

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider> {/* Ensure CheckoutProvider is Next.js compatible */}
            {isDeletingUnavailableItem && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

            <Checkout />
            <UnavailableProductConfirmationModal
                productItems={basket?.productItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </CheckoutProvider>
    )
}

// getProps and getTemplateName are PWA Kit specific and should be removed.
// Data fetching (like getProps) should be handled by getServerSideProps or getStaticProps in Next.js.

export default CheckoutPage // Exporting the wrapper component
