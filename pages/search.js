/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
// import PropTypes from 'prop-types'
// import {useHistory, useLocation, useParams} from 'react-router-dom' // Replaced by useRouter
import {useRouter} from 'next/router'
import {FormattedMessage, useIntl} from 'react-intl'
// import {Helmet} from 'react-helmet' // Replaced by Head
import Head from 'next/head'
import {
    // useCategory, // Removed
    useCustomerId,
    // useProductSearch, // Removed
    useShopperCustomersMutation,
    usePromotions // Added usePromotions from previous version
} from '@salesforce/commerce-sdk-react' // Assuming still valid
// import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks' // PWA Kit specific

// Components
import {
    Box,
    Flex,
    SimpleGrid,
    Grid,
    Select,
    Heading,
    Text,
    FormControl,
    Stack,
    useDisclosure,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalContent,
    ModalCloseButton,
    ModalOverlay,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton
} from '../../app/components/shared/ui' // Adjusted path

// Project Components
import Pagination from '../../app/components/pagination' // Adjusted path
import ProductTile, {
    Skeleton as ProductTileSkeleton
} from '../../app/components/product-tile' // Adjusted path
import {HideOnDesktop} from '../../app/components/responsive' // Adjusted path
import Refinements from '../../app/pages/product-list/partials/refinements' // Adjusted path
import CategoryLinks from '../../app/pages/product-list/partials/category-links' // Adjusted path
import SelectedRefinements from '../../app/pages/product-list/partials/selected-refinements' // Adjusted path
import EmptySearchResults from '../../app/pages/product-list/partials/empty-results' // Adjusted path
import PageHeader from '../../app/pages/product-list/partials/page-header' // Adjusted path
import AbovePageHeader from '../../app/pages/product-list/partials/above-page-header' // Adjusted path
import PageDesignerPromotionalBanner from '../../app/pages/product-list/partials/page-designer-promotional-banner' // Adjusted path

// Icons
import {FilterIcon, ChevronDownIcon} from '../../app/components/icons' // Adjusted path

// Hooks
import {
    useLimitUrls,
    usePageUrls,
    useSortUrls,
    useSearchParams as usePageSearchParams // Renamed to avoid conflict with Next.js
} from '../../app/hooks' // Adjusted path
import {useToast} from '../../app/hooks/use-toast' // Adjusted path
import useEinstein from '../../app/hooks/use-einstein' // Adjusted path
import useDataCloud from '../../app/hooks/use-datacloud' // Adjusted path
import useActiveData from '../../app/hooks/use-active-data' // Adjusted path
import {useCurrentCustomer} from '../../app/hooks/use-current-customer' // Added
import {useCurrentBasket} from '../../app/hooks/use-current-basket' // Added

// Others
// import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors' // Error handling might change
import logger from '../../app/utils/logger-instance' // Adjusted path

// Constants
import {
    DEFAULT_LIMIT_VALUES,
    API_ERROR_MESSAGE,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST,
    STALE_WHILE_REVALIDATE,
    PRODUCT_LIST_IMAGE_VIEW_TYPE,
    PRODUCT_LIST_SELECTABLE_ATTRIBUTE_ID
} from '../../app/constants' // Adjusted path
import useNavigation from '../../app/hooks/use-navigation' // Adjusted path
import LoadingSpinner from '../../app/components/loading-spinner' // Adjusted path
import {useWishList} from '../../app/hooks/use-wish-list' // Adjusted path
// import {isHydrated} from '@salesforce/retail-react-app/app/utils/utils' // isHydrated might not be needed
import {isError} from '../../app/utils/utils' // Adjusted path
import {getFilters, getPageTitle, PLP_SKELETON_CONFIGS} from '../../app/pages/product-list/utils' // getPageUrl removed
import {usePrevious} from '../../app/hooks/use-previous' // usePrevious might not be needed
// import {normalizeProductSearch} from '../../app/utils/product-search-utils' // May use in getServerSideProps

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const SearchPage = ({ productSearchResult: initialProductSearchResult, searchQuery: initialSearchQuery, error: ssrError, ...rest }) => { // Renamed and accept props
    // Using destructuring to omit properties; we must rename `isLoading` because we use a different
    // `isLoading` later in this function.
    // eslint-disable-next-line react/prop-types, @typescript-eslint/no-unused-vars
    const {isLoading: _unusedIsLoading, staticContext} = {} // props are now from getServerSideProps
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const router = useRouter()
    // const navigate = useNavigation() // Not used directly, router is used
    // const history = useHistory() // Replaced by router
    // const params = useParams() // Replaced by router.query
    const toast = useToast()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()
    // const {res} = useServerContext() // PWA Kit specific
    const customerId = useCustomerId()
    const [searchParams, {stringify: stringifySearchParams}] = usePageSearchParams()
    const {data: currentCustomer} = useCurrentCustomer() // Added current customer
    const {data: wishlist, isLoading: isWishlistLoading} = useWishList() // Added wishlist
    const {isLoading: isBasketLoading} = useCurrentBasket() // Added basket loading
    const prevCategoryId = usePrevious(router.query.categoryId) // Added prevCategoryId

    /**************** Page State ****************/
    const [filtersLoading, setFiltersLoading] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState([])
    const [sortOpen, setSortOpen] = useState(false)

    // const urlParams = new URLSearchParams(router.asPath.split('?')[1] || ''); // Use router.asPath
    const currentSearchQuery = initialSearchQuery || router.query.q || ''; // Use prop first, then router query
    const isSearch = !!currentSearchQuery; // This should always be true for a search page

    // For a general search page, categoryId is usually not a direct route param.
    // It might be part of refinements if searching within a category.
    // const categoryId = router.query.categoryId as string;
    // If category context is needed from refinements, it should be extracted from productSearchResult.selectedRefinements.cgid
    const categoryId = initialProductSearchResult?.selectedRefinements?.cgid || null;

    /**************** Mutation Actions ****************/
    const {mutateAsync: createCustomerProductListItem} = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const {mutateAsync: deleteCustomerProductListItem} = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    /**************** Query Actions ****************/
    // _refine is an invalid param for useProductSearch, we don't want to pass it to API call
    const {_refine, ...restOfParams} = searchParams

    // Product search results are passed via props.
    const productSearchResult = initialProductSearchResult;
    //isLoading and error are primarily determined by getServerSideProps results
    const isLoading = !productSearchResult && !ssrError;
    const isRefetching = false; // Placeholder for client-side updates, as full data is fetched by SSR for now
    const isFetched = !!productSearchResult; // True if data is passed
    const currentError = ssrError;

    // Category data is not fetched directly for a general search page
    const category = null; // Or derive from productSearchResult.selectedRefinements if needed
    // const { // Removed useCategory
    //     error, data: category
    // } = useCategory(
    //     {
    //         parameters: {
    //             id: categoryId
    //         }
    //     },
    //     {
    //         enabled: !isSearch && !!categoryId
    //     }
    // )

    // Remove useProductSearch hook as data is passed via props
    // const {
    //     isLoading,
    //     isFetched,
    //     isRefetching,
    //     data: productSearchResult
    // } = useProductSearch(
    //     {
    //         parameters: {
    //             ...restOfParams,
                perPricebook: true,
                allVariationProperties: true,
                allImages: true,
                expand: [
                    'promotions',
                    'variations',
                    'prices',
                    'images',
                    'page_meta_tags',
                    'custom_properties'
                ],
                refine: _refine
            }
        },
        {
            keepPreviousData: true
        }
    )

    const {data: promotions} = usePromotions({ // Added promotions hook from original file
        parameters: {
            promotionType: 'product'
        }
    })

    // Apply disallow list to refinements.
    if (productSearchResult?.refinements) {
        productSearchResult.refinements = productSearchResult.refinements.filter(
            ({attributeId}) => !REFINEMENT_DISALLOW_LIST.includes(attributeId)
        )
    }

    /**************** Error Handling ****************/
    // const errorStatus = error?.response?.status // Error handling adapted
    // switch (errorStatus) {
    //     case undefined:
    //         // No Error.
    //         break
    //     case 404:
    //         // throw new HTTPNotFound('Category Not Found.') // Handled by getServerSideProps
    //         break
    //     default:
    //         // throw new HTTPError(errorStatus, `HTTP Error ${errorStatus} occurred.`) // Handled by getServerSideProps
    // }

    /**************** Response Handling ****************/
    // Cache control is handled in getServerSideProps
    // if (res) {
    //     res.set(
    //         'Cache-Control',
    //         `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
    //     )
    // }

    // Reset scroll position when `isRefetching` becomes `true`.
    useEffect(() => {
        isRefetching && window.scrollTo(0, 0)
        setFiltersLoading(isRefetching)
    }, [isRefetching])

    /**************** Render Variables ****************/
    const basePath = router.asPath
    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits
    const {total, sortingOptions} = productSearchResult || {}
    const selectedSortingOptionLabel =
        sortingOptions?.find(
            (option) => option.id === productSearchResult?.selectedSortingOption
        ) ?? sortingOptions?.[0]

    // Get urls to be used for pagination, page size changes, and sorting.
    const pageUrls = usePageUrls({total})
    const sortUrls = useSortUrls({options: sortingOptions})
    const limitUrls = useLimitUrls()

    /**************** Action Handlers ****************/
    const {data: wishlist} = useWishList()
    const addItemToWishlist = async (product) => {
        setWishlistLoading([...wishlistLoading, product.productId])

        // TODO: This wishlist object is from an old API, we need to replace it with the new one.
        const listId = wishlist.id
        await createCustomerProductListItem(
            {
                parameters: {customerId, listId},
                body: {
                    quantity: 1,
                    public: false,
                    priority: 1,
                    type: 'product',
                    productId: product.productId
                }
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                        status: 'success',
                        action: (
                            // it would be better if we could use <Button as={Link}>
                            // but unfortunately the Link component is not compatible
                            // with Chakra Toast, since the ToastManager is rendered via portal
                            // and the toast doesn't have access to intl provider, which is a
                            // requirement of the Link component.
                        <Button variant="link" onClick={() => router.push('/account/wishlist')}>
                                {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                            </Button>
                        )
                    })
                },
                onSettled: () => {
                    setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
                }
            }
        )
    }

    const removeItemFromWishlist = async (product) => {
        setWishlistLoading([...wishlistLoading, product.productId])

        const listId = wishlist.id
        const itemId = wishlist.customerProductListItems.find(
            (i) => i.productId === product.productId
        ).id

        await deleteCustomerProductListItem(
            {
                body: {},
                parameters: {customerId, listId, itemId}
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                        status: 'success'
                    })
                },
                onSettled: () => {
                    setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
                }
            }
        )
    }

    // Toggles filter on and off
    const toggleFilter = (value, attributeId, selected, allowMultiple = true) => {
        const searchParamsCopy = {...searchParams}

        // Remove the `offset` search param if present.
        delete searchParamsCopy.offset

        // If we aren't allowing for multiple selections, simply clear any value set for the
        // attribute, and apply a new one if required.
        if (!allowMultiple) {
            const previousValue = searchParamsCopy.refine[attributeId]
            delete searchParamsCopy.refine[attributeId]

            // Note the loose comparison, for "string != number" checks.
            if (!selected && value.value != previousValue) {
                searchParamsCopy.refine[attributeId] = value.value
            }
        } else {
            // Get the attibute value as an array.
            let attributeValue = searchParamsCopy.refine[attributeId] || []

            // Ensure that the value is still converted into an array if it's a `string` or `number`.
            if (typeof attributeValue === 'string') {
                attributeValue = attributeValue.split('|')
            } else if (typeof attributeValue === 'number') {
                attributeValue = [attributeValue]
            }

            // Either set the value, or filter the value out.
            if (!selected) {
                attributeValue.push(value.value)
            } else {
                // Note the loose comparison, for "string != number" checks.
                attributeValue = attributeValue?.filter((v) => v != value.value)
            }

            // Update the attribute value in the new search params.
            searchParamsCopy.refine[attributeId] = attributeValue

            // If the update value is an empty array, remove the current attribute key.
            if (searchParamsCopy.refine[attributeId].length === 0) {
                delete searchParamsCopy.refine[attributeId]
            }
        }

        // Always navigate to /search for search page
        // if (isSearch) { // This condition is always true on search page
        router.push(`/search?${stringifySearchParams(searchParamsCopy)}`)
        // } else { // This branch should not be hit on search.js
        //     router.push(`/category/${categoryId}?${stringifySearchParams(searchParamsCopy)}`)
        // }
    }

    // Clears all filters
    const resetFilters = () => {
        const newSearchParams = {
            ...searchParams,
            refine: []
        }
        const newPath = `/search?${stringifySearchParams(newSearchParams)}`
        // const newPath = isSearch // This condition is always true
        //     ? `/search?${stringifySearchParams(newSearchParams)}`
        //     : `/category/${categoryId}?${stringifySearchParams(newSearchParams)}` // This path is not for search page

        router.push(newPath)
    }

    /**************** Einstein ****************/
    useEffect(() => {
        if (productSearchResult) {
            if (isSearch) { // This is always true on search page
                try {
                    einstein.sendViewSearch(currentSearchQuery, productSearchResult)
                } catch (err) {
                    logger.error('Einstein sendViewSearch error', {
                        namespace: 'ProductList.useEffect',
                        additionalProperties: {error: err, searchQuery: currentSearchQuery}
                    })
                }
                dataCloud.sendViewSearchResults(router.query, productSearchResult) // Use router.query
                activeData.sendViewSearch(router.query, productSearchResult) // Use router.query
            }
            // Removed category specific Einstein calls for a general search page
            // else {
            //     try {
            //         einstein.sendViewCategory(category, productSearchResult)
            //     } catch (err) {
            //         logger.error('Einstein sendViewCategory error', {
            //             namespace: 'ProductList.useEffect',
            //             additionalProperties: {error: err, category}
            //         })
            //     }
            //     dataCloud.sendViewCategory(router.query, category, productSearchResult)
            //     activeData.sendViewCategory(router.query, category, productSearchResult)
            // }
        }
    }, [productSearchResult, currentSearchQuery, router.query, einstein, dataCloud, activeData]) // Adjusted dependencies

    return (
        <Box
            className="sf-product-list-page"
            data-testid="sf-product-list-page"
            layerStyle="page"
            paddingTop={{base: 6, lg: 8}}
            {...rest}
        >
            <Head>
                <title>{productSearchResult?.pageTitle ?? currentSearchQuery ?? formatMessage({defaultMessage: "Search Results"})}</title>
                <meta name="description" content={productSearchResult?.pageDescription ?? `Search results for ${currentSearchQuery}`} />
                <meta name="keywords" content={productSearchResult?.pageKeywords} />
                {productSearchResult?.pageMetaTags?.map(({id, value}) => {
                    return <meta name={id} content={value} key={id} />
                })}
            </Head>
            {showNoResults ? (
                <EmptySearchResults searchQuery={currentSearchQuery} category={category} />
            ) : (
                <>
                    <AbovePageHeader />
                    <PageDesignerPromotionalBanner />

                    {/* Header */}
                    <Stack
                        display={{base: 'none', lg: 'flex'}}
                        direction="row"
                        justify="flex-start"
                        align="flex-start"
                        spacing={4}
                        marginBottom={6}
                    >
                        <Flex align="left" width="287px">
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                        </Flex>

                        <Box flex={1} paddingTop={'45px'}>
                            <SelectedRefinements
                                filters={productSearchResult?.refinements}
                                toggleFilter={toggleFilter}
                                handleReset={resetFilters}
                                selectedFilterValues={productSearchResult?.selectedRefinements}
                            />
                        </Box>
                        <Box paddingTop={'45px'}>
                            <Sort
                                sortUrls={sortUrls}
                                productSearchResult={productSearchResult}
                                basePath={basePath}
                            />
                        </Box>
                    </Stack>

                    {/* Filter Button for Mobile */}
                    <HideOnDesktop>
                        <Stack spacing={6}>
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                            <Stack
                                display={{base: 'flex', md: 'none'}}
                                direction="row"
                                justify="flex-start"
                                align="center"
                                spacing={1}
                                height={12}
                                borderColor="gray.100"
                            >
                                <Flex align="center">
                                    <Button
                                        fontSize="sm"
                                        colorScheme="black"
                                        variant="outline"
                                        marginRight={2}
                                        display="inline-flex"
                                        leftIcon={<FilterIcon boxSize={5} />}
                                        onClick={onOpen}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Filter"
                                            id="product_list.button.filter"
                                        />
                                    </Button>
                                </Flex>
                                <Flex align="center">
                                    <Button
                                        maxWidth="245px"
                                        fontSize="sm"
                                        marginRight={2}
                                        colorScheme="black"
                                        variant="outline"
                                        display="inline-flex"
                                        rightIcon={<ChevronDownIcon boxSize={5} />}
                                        onClick={() => setSortOpen(true)}
                                    >
                                        {formatMessage(
                                            {
                                                id: 'product_list.button.sort_by',
                                                defaultMessage: 'Sort By: {sortOption}'
                                            },
                                            {
                                                sortOption: selectedSortingOptionLabel?.label
                                            }
                                        )}
                                    </Button>
                                </Flex>
                            </Stack>
                        </Stack>
                        <Box marginBottom={4}>
                            <SelectedRefinements
                                filters={productSearchResult?.refinements}
                                toggleFilter={toggleFilter}
                                handleReset={resetFilters}
                                selectedFilterValues={productSearchResult?.selectedRefinements}
                            />
                        </Box>
                    </HideOnDesktop>

                    {/* Body  */}
                    <Grid templateColumns={{base: '1fr', md: '280px 1fr'}} columnGap={6}>
                        <Stack display={{base: 'none', md: 'flex'}}>
                            <Refinements
                                itemsBefore={
                                    category?.categories
                                        ? [<CategoryLinks key="itemsBefore" category={category} />]
                                        : undefined
                                }
                                isLoading={filtersLoading}
                                toggleFilter={toggleFilter}
                                filters={productSearchResult?.refinements}
                                excludedFilters={['cgid']}
                                selectedFilters={searchParams.refine}
                            />
                        </Stack>
                        <Box>
                            <SimpleGrid
                                columns={[2, 2, 3, 3]}
                                spacingX={4}
                                spacingY={{base: 12, lg: 16}}
                            >
                                typeof window !== 'undefined' && // Adjusted isHydrated check
                                ((isRefetching && !isFetched) || !productSearchResult)
                                    ? new Array(searchParams.limit ? parseInt(searchParams.limit as string) : DEFAULT_LIMIT_VALUES[0]) // Use DEFAULT_LIMIT_VALUES
                                          .fill(0)
                                          .map((value, index) => (
                                              <ProductTileSkeleton key={index} />
                                          ))
                                    : productSearchResult?.hits?.map((productSearchItem) => {
                                          const productId = productSearchItem.productId
                                          const isInWishlist =
                                              !!wishlist?.customerProductListItems?.find(
                                                  (item) => item.productId === productId
                                              )

                                          return (
                                              <ProductTile
                                                  data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                                  key={productSearchItem.productId}
                                                  product={productSearchItem}
                                                  enableFavourite={true}
                                                  isFavourite={isInWishlist}
                                                  isRefreshingData={isRefetching && isFetched}
                                                  imageViewType={PRODUCT_LIST_IMAGE_VIEW_TYPE}
                                                  selectableAttributeId={
                                                      PRODUCT_LIST_SELECTABLE_ATTRIBUTE_ID
                                                  }
                                                  onClick={() => {
                                                      if (searchQuery) {
                                                          einstein.sendClickSearch(
                                                              searchQuery,
                                                              productSearchItem
                                                          )
                                                      } else if (category) {
                                                          einstein.sendClickCategory(
                                                              category,
                                                              productSearchItem
                                                          )
                                                      }
                                                  }}
                                                  onFavouriteToggle={(toBeFavourite) => {
                                                      const action = toBeFavourite
                                                          ? addItemToWishlist
                                                          : removeItemFromWishlist
                                                      return action(productSearchItem)
                                                  }}
                                                  dynamicImageProps={{
                                                      widths: [
                                                          '50vw',
                                                          '50vw',
                                                          '20vw',
                                                          '20vw',
                                                          '25vw'
                                                      ]
                                                  }}
                                              />
                                          )
                                      })}
                            </SimpleGrid>
                            {/* Footer */}
                            <Flex
                                justifyContent={['center', 'center', 'flex-start']}
                                paddingTop={8}
                            >
                                <Pagination currentURL={basePath} urls={pageUrls} />

                                {/*
                            Our design doesn't call for a page size select. Show this element if you want
                            to add one to your design.
                        */}
                                <Select
                                    display="none"
                                    value={basePath}
                                    onChange={({target}) => {
                                            router.push(target.value) // Use router.push
                                    }}
                                >
                                    {limitUrls.map((href, index) => (
                                        <option key={href} value={href}>
                                            {DEFAULT_LIMIT_VALUES[index]}
                                        </option>
                                    ))}
                                </Select>
                            </Flex>
                        </Box>
                    </Grid>
                </>
            )}
            {/* Modal for filter options on mobile */}
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="full"
                motionPreset="slideInBottom"
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent top={0} marginTop={0}>
                    <ModalHeader>
                        <Heading as="h1" fontWeight="bold" fontSize="2xl">
                            <FormattedMessage
                                defaultMessage="Filter"
                                id="product_list.modal.title.filter"
                            />
                        </Heading>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        {filtersLoading && <LoadingSpinner />}
                        <Refinements
                            toggleFilter={toggleFilter}
                            filters={productSearchResult?.refinements}
                                selectedFilters={searchParams.refine as string[]}
                            itemsBefore={
                                    category?.categories // category is null on search page, this might need adjustment or be removed
                                    ? [
                                          <CategoryLinks
                                              key="itemsBefore"
                                              category={category}
                                              onSelect={onClose}
                                          />
                                      ]
                                    : undefined
                            }
                                excludedFilters={['cgid']} // cgid might be relevant if searching within a category
                        />
                    </ModalBody>

                    <ModalFooter
                        // justify="space-between"
                        display="block"
                        width="full"
                        borderTop="1px solid"
                        borderColor="gray.100"
                        paddingBottom={10}
                    >
                        <Stack>
                            <Button width="full" onClick={onClose}>
                                {formatMessage(
                                    {
                                        id: 'product_list.modal.button.view_items',
                                        defaultMessage: 'View {prroductCount} items'
                                    },
                                    {
                                        prroductCount: productSearchResult?.total
                                    }
                                )}
                            </Button>
                            <Button width="full" variant="outline" onClick={resetFilters}>
                                <FormattedMessage
                                    defaultMessage="Clear Filters"
                                    id="product_list.modal.button.clear_filters"
                                />
                            </Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Drawer
                placement="bottom"
                isOpen={sortOpen}
                onClose={() => setSortOpen(false)}
                size="sm"
                motionPreset="slideInBottom"
                scrollBehavior="inside"
                isFullHeight={false}
                height="50%"
            >
                <DrawerOverlay />
                <DrawerContent marginTop={0}>
                    <DrawerHeader boxShadow="none">
                        <Text fontWeight="bold" fontSize="2xl">
                            <FormattedMessage
                                defaultMessage="Sort By"
                                id="product_list.drawer.title.sort_by"
                            />
                        </Text>
                    </DrawerHeader>
                    <DrawerCloseButton />
                    <DrawerBody>
                        {sortUrls.map((href, idx) => (
                            <Button
                                width="full"
                                onClick={() => {
                                    setSortOpen(false)
                                        router.push(href) // Use router.push
                                }}
                                fontSize={'md'}
                                key={idx}
                                marginTop={0}
                                variant="menu-link"
                            >
                                <Text
                                    as={
                                        selectedSortingOptionLabel?.label ===
                                            productSearchResult?.sortingOptions[idx]?.label && 'u'
                                    }
                                >
                                    {productSearchResult?.sortingOptions[idx]?.label}
                                </Text>
                            </Button>
                        ))}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    )
}

// ProductList.getTemplateName = () => 'product-list' // Removed PWA Kit specific

// ProductList.propTypes = { // PropTypes not typically used in Next.js pages
//     onAddToWishlistClick: PropTypes.func,
//     onRemoveWishlistClick: PropTypes.func,
//     category: PropTypes.object
// }

export async function getServerSideProps(context) {
    const { q, ...otherQueryParams } = context.query; // Extract search query 'q' and other params
    const searchQuery = q || null;

    // Set cache control headers
    context.res.setHeader(
        'Cache-Control',
        `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
    );

    const searchParamsForSDK = {
        q: searchQuery,
        ...getFilters(otherQueryParams), // Use getFilters to process query params for SDK
        // expand: ['availability', 'promotions', 'options', 'images', 'prices', 'variations', 'page_meta_tags', 'custom_properties'], // Standard expand
        // perPricebook: true, // Standard param
    };

    // --- Fallback: Simulate API call with mock data ---
    const mockProductSearchResult = {
        hits: searchQuery ? [ // Only return hits if there's a search query
            {productId: 'search-product1', productName: `Found Product 1 for "${searchQuery}"`, image: {disBaseLink: '/img/hero.png', alt: 'Search Product 1'}, price: 150, currency: 'USD'},
            {productId: 'search-product2', productName: `Found Product 2 for "${searchQuery}"`, image: {disBaseLink: '/img/secondary-b.png', alt: 'Search Product 2'}, price: 250, currency: 'USD'},
        ] : [],
        total: searchQuery ? 2 : 0,
        refinements: searchQuery ? [ {attributeId: 'size', label: 'Size', values: [{label: 'Large', value: 'lg', hitCount: 1}]} ] : [],
        sortingOptions: [ {id: 'relevance', name: 'Relevance'}, {id: 'price-desc', name: 'Price High to Low'} ],
        selectedSortingOption: 'relevance',
        pageTitle: `Search Results for "${searchQuery}"`,
        pageDescription: `Search results for ${searchQuery}`,
        pageKeywords: `search, ${searchQuery}`,
    };

    if (!searchQuery) {
        mockProductSearchResult.pageTitle = formatMessage({defaultMessage: "Search"}); // Needs access to formatMessage or pass static string
        mockProductSearchResult.pageDescription = formatMessage({defaultMessage: "Enter a search term to find products."});
    }

    if (searchQuery === 'error') {
        return {props: {productSearchResult: null, searchQuery, error: {message: "Simulated server-side search error"}}};
}

    return {props: {productSearchResult: mockProductSearchResult, searchQuery, error: null}};
}

export default SearchPage // Exporting the renamed component

const Sort = ({sortUrls, productSearchResult, basePath, ...otherProps}) => {
    const intl = useIntl()
    const router = useRouter() // Using Next.js router
    // const history = useHistory() // Replaced by router

    return (
        <FormControl
            aria-label={intl.formatMessage({
                id: 'product_list.drawer.title.sort_by',
                defaultMessage: 'Sort By'
            })}
            data-testid="sf-product-list-sort"
            id="page_sort"
            width="auto"
            {...otherProps}
        >
            <Select
                id="sf-product-list-sort-select"
                aria-label={intl.formatMessage({
                    id: 'product_list.sort_by.label.assistive_msg',
                    defaultMessage: 'Sort products by'
                })}
                value={basePath.replace(/(offset)=(\d+)/i, '$1=0')}
                onChange={({target}) => {
                    router.push(target.value) // Use router.push
                }}
                height={11}
                width="240px"
            >
                {sortUrls.map((href, index) => (
                    <option key={href} value={href}>
                        {intl.formatMessage(
                            {
                                id: 'product_list.select.sort_by',
                                defaultMessage: 'Sort By: {sortOption}'
                            },
                            {
                                sortOption: productSearchResult?.sortingOptions[index]?.label
                            }
                        )}
                    </option>
                ))}
            </Select>
        </FormControl>
    )
}

// Sort.propTypes = { // PropTypes not typically used in Next.js pages
//     sortUrls: PropTypes.array,
//     productSearchResult: PropTypes.object,
//     basePath: PropTypes.string
// }
