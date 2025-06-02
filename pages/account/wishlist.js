/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useRef} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import Head from 'next/head' // Using Next.js Head
import {useRouter} from 'next/router' // Using Next.js router
import {
    Box,
    Flex,
    Skeleton,
    Stack,
    Heading
} from '../../../app/components/shared/ui' // Adjusted path
import {useProducts, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react' // Assuming still valid

import useNavigation from '../../../app/hooks/use-navigation' // Adjusted path
import {useToast} from '../../../app/hooks/use-toast' // Adjusted path
import {useWishList} from '../../../app/hooks/use-wish-list' // Adjusted path

import PageActionPlaceHolder from '../../../app/components/page-action-placeholder' // Adjusted path
import {HeartIcon} from '../../../app/components/icons' // Adjusted path
import ProductItem from '../../../app/components/product-item' // Adjusted path
import WishlistPrimaryAction from '../../../app/pages/account/wishlist/partials/wishlist-primary-action' // Adjusted path
import WishlistSecondaryButtonGroup from '../../../app/pages/account/wishlist/partials/wishlist-secondary-button-group' // Adjusted path

import {API_ERROR_MESSAGE} from '../../../app/constants' // Adjusted path
import {useCurrentCustomer} from '../../../app/hooks/use-current-customer' // Adjusted path
import UnavailableProductConfirmationModal from '../../../app/components/unavailable-product-confirmation-modal' // Adjusted path
// Seo component is replaced by Head

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const router = useRouter() // Using Next.js router instead of useNavigation for page changes
    const navigate = useNavigation() // Keep for other navigation actions if any, or adapt
    const {formatMessage} = useIntl()
    const toast = useToast()

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Wishlist' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    // Adding Einstein and DataCloud hooks, assuming they are needed as in other pages
    // const einstein = useEinstein() // Assuming these hooks exist and are adapted
    // const dataCloud = useDataCloud() // Assuming these hooks exist and are adapted
    // useEffect(() => {
    //     einstein.sendViewPage(router.pathname)
    //     dataCloud.sendViewPage(router.pathname)
    // }, [router.pathname, einstein, dataCloud])

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [isWishlistItemLoading, setWishlistItemLoading] = useState(false)

    const {data: wishListData, isLoading: isWishListLoading} = useWishList()
    const productIds = wishListData?.customerProductListItems?.map((item) => item.productId)

    const {data: productsData, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds?.join(','),
                allImages: true,
                perPricebook: true
            }
        },
        {enabled: productIds?.length > 0}
    )

    // If a product is added to the wishlist many times, it gets collapased into 1 line item
    const wishListItems = wishListData?.customerProductListItems?.reduce((itemsData, item) => {
        const productData = productsData?.data?.find((product) => product.id === item.productId)
        return {...itemsData, [item.productId]: {...item, product: productData}}
    }, {})

    const updateCustomerProductListItem = useShopperCustomersMutation(
        'updateCustomerProductListItem'
    )
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const {data: customer} = useCurrentCustomer()

    const handleSecondaryAction = async (itemId, promise) => {
        setWishlistItemLoading(true)
        setSelectedItem(itemId)

        try {
            await promise
            // No need to handle error here, as the inner component will take care of it
        } finally {
            setWishlistItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleUnavailableProducts = async (unavailableProductIds) => {
        if (!unavailableProductIds.length) return
        await Promise.all(
            unavailableProductIds.map(async (id) => {
                const item = wishListItems?.find((item) => {
                    return item.productId.toString() === id.toString()
                })
                const parameters = {
                    customerId: customer.customerId,
                    itemId: item?.id,
                    listId: wishListData?.id
                }
                await deleteCustomerProductListItem.mutateAsync({parameters})
            })
        )
    }

    const handleItemQuantityChanged = async (quantity, item) => {
        let isValidChange = false
        setSelectedItem(item.productId)

        const body = {
            ...item,
            quantity: parseInt(quantity)
        }
        // To meet expected schema, remove the custom `product` we added
        delete body.product

        const parameters = {
            customerId: customer.customerId,
            itemId: item.id,
            listId: wishListData?.id
        }

        const mutation =
            parseInt(quantity) > 0
                ? updateCustomerProductListItem.mutateAsync({body, parameters})
                : deleteCustomerProductListItem.mutateAsync({parameters})

        try {
            await mutation
            isValidChange = true
            setSelectedItem(undefined)
        } catch (err) {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }

        // If true, the quantity picker would immediately update its number
        // without waiting for the invalidated lists data to finish refetching
        return isValidChange
    }

    const hasWishlistItems = Object.keys(wishListItems ?? {}).length > 0
    const isPageLoading = hasWishlistItems ? isProductsLoading : isWishListLoading

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl" tabIndex="0" ref={headingRef}>
                <FormattedMessage defaultMessage="Wishlist" id="account_wishlist.title.wishlist" />
            </Heading>

            {isPageLoading && (
                <Box data-testid="sf-wishlist-skeleton">
                    {new Array(numberOfSkeletonItems).fill(0).map((i, idx) => (
                        <Box
                            key={idx}
                            p={[4, 6]}
                            my={4}
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="base"
                        >
                            <Flex width="full" align="flex-start">
                                <Skeleton boxSize={['88px', 36]} mr={4} />

                                <Stack spacing={2}>
                                    <Skeleton h="20px" w="112px" />
                                    <Skeleton h="20px" w="84px" />
                                    <Skeleton h="20px" w="140px" />
                                </Stack>
                            </Flex>
                        </Box>
                    ))}
                </Box>
            )}

            {!isPageLoading && !hasWishlistItems && (
                <PageActionPlaceHolder
                    data-testid="empty-wishlist"
                    icon={<HeartIcon boxSize={8} />}
                    heading={formatMessage({
                        defaultMessage: 'No Wishlist Items',
                        id: 'account_wishlist.heading.no_wishlist'
                    })}
                    text={formatMessage({
                        defaultMessage: 'Continue shopping and add items to your wishlist.',
                        id: 'account_wishlist.description.continue_shopping'
                    })}
                    buttonText={formatMessage({
                        defaultMessage: 'Continue Shopping',
                        id: 'account_wishlist.button.continue_shopping'
                    })}
                    buttonProps={{leftIcon: undefined}}
                    onButtonClick={() => router.push('/')} // Using router.push
                />
            )}

            {!isPageLoading &&
                wishListItems && Object.keys(wishListItems).length > 0 && // Ensure wishListItems is not empty before mapping
                Object.keys(wishListItems).map((key) => {
                    const item = wishListItems[key]
                    return (
                        <ProductItem
                            key={item.id}
                            product={{
                                ...item.product,
                                quantity: item.quantity
                            }}
                            showLoading={
                                (updateCustomerProductListItem.isLoading ||
                                    deleteCustomerProductListItem.isLoading ||
                                    isWishlistItemLoading) &&
                                selectedItem === item.productId
                            }
                            primaryAction={<WishlistPrimaryAction />}
                            onItemQuantityChange={(quantity) =>
                                handleItemQuantityChanged(quantity, item)
                            }
                            secondaryActions={
                                <WishlistSecondaryButtonGroup
                                    productListItemId={item.id}
                                    productName={item.product.name}
                                    // Focus to 'Wishlist' header after remove for accessibility
                                    focusElementOnRemove={headingRef}
                                    onClick={handleSecondaryAction}
                                />
                            }
                        />
                    )
                })}

            <UnavailableProductConfirmationModal
                productItems={wishListData?.customerProductListItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </Stack>
    )
}

// AccountWishlist.getTemplateName = () => 'account-wishlist' // Removed PWA Kit specific
// No PropTypes for Next.js pages typically

export default AccountWishlist
