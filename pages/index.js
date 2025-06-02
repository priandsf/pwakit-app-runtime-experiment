/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
// import {useLocation} from 'react-router-dom'
import {useRouter} from 'next/router'
import Head from 'next/head'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    HStack,
    VStack,
    Text,
    Flex,
    Stack,
    Container,
    Link
} from '../../app/components/shared/ui' // Adjusted path

// Project Components
import Hero from '../../app/components/hero' // Adjusted path
// import Seo from '@salesforce/retail-react-app/app/components/seo'
import Section from '../../app/components/section' // Adjusted path
import ProductScroller from '../../app/components/product-scroller' // Adjusted path

// Others
// import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {heroFeatures, features} from '../../app/pages/home/data' // Adjusted path

//Hooks
import useEinstein from '../../app/hooks/use-einstein' // Adjusted path
import useDataCloud from '../../app/hooks/use-datacloud' // Adjusted path

// Constants
import {
    HOME_SHOP_PRODUCTS_CATEGORY_ID,
    HOME_SHOP_PRODUCTS_LIMIT,
    MAX_CACHE_AGE, 
    STALE_WHILE_REVALIDATE 
} from '../../app/constants' // Adjusted path
// import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
// import {useProductSearch} from '@salesforce/commerce-sdk-react' // Removed: will be fetched in getServerSideProps
// TODO: Import actual SDK client if attempting real API call in getServerSideProps
// For now, we'll use mock data.

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = ({ productSearchResult }) => { // Accept productSearchResult as prop
    const intl = useIntl()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    // const {pathname} = useLocation()
    const router = useRouter()
    const {pathname} = router

    // const {res} = useServerContext() // This is not available in Next.js pages component scope
    // Cache control headers are set in getServerSideProps

    // const {data: productSearchResult, isLoading} = useProductSearch({ // Removed useProductSearch
    //     parameters: {
    //         allImages: true,
    //         allVariationProperties: true,
    //         expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
    //         limit: HOME_SHOP_PRODUCTS_LIMIT,
    //         perPricebook: true,
    //         refine: [`cgid=${HOME_SHOP_PRODUCTS_CATEGORY_ID}`, 'htype=master']
    //     }
    // })
    const isLoading = !productSearchResult // isLoading is true if no productSearchResult

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [pathname, einstein, dataCloud]) // Added dependencies

    return (
        <Box data-testid="home-page" layerStyle="page">
            {/* <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            /> */}
            <Head>
                <title>Home Page</title>
                <meta name="description" content="Commerce Cloud Retail React App" />
                <meta name="keywords" content="Commerce Cloud, Retail React App, React Storefront" />
            </Head>

            <Hero
                title={intl.formatMessage({
                    defaultMessage: 'The React PWA Starter Store for Retail',
                    id: 'home.title.react_starter_store'
                })}
                img={{
                    src: '/img/hero.png', // Updated image path
                    alt: 'npx pwa-kit-create-app'
                }}
                actions={
                    <Stack spacing={{base: 4, sm: 6}} direction={{base: 'column', sm: 'row'}}>
                        <Button
                            as={Link}
                            href="https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html"
                            target="_blank"
                            width={{base: 'full', md: 'inherit'}}
                            paddingX={7}
                            _hover={{textDecoration: 'none'}}
                        >
                            <FormattedMessage
                                defaultMessage="Get started"
                                id="home.link.get_started"
                            />
                        </Button>
                    </Stack>
                }
            />

            <Section
                background={'gray.50'}
                marginX="auto"
                paddingY={{base: 8, md: 16}}
                paddingX={{base: 4, md: 8}}
                borderRadius="base"
                width={{base: '100vw', md: 'inherit'}}
                position={{base: 'relative', md: 'inherit'}}
                left={{base: '50%', md: 'inherit'}}
                right={{base: '50%', md: 'inherit'}}
                marginLeft={{base: '-50vw', md: 'auto'}}
                marginRight={{base: '-50vw', md: 'auto'}}
            >
                <SimpleGrid
                    columns={{base: 1, md: 1, lg: 3}}
                    spacingX={{base: 1, md: 4}}
                    spacingY={{base: 4, md: 14}}
                >
                    {heroFeatures.map((feature, index) => {
                        const featureMessage = feature.message
                        return (
                            <Link key={index} target="_blank" href={feature.href}>
                                <Box
                                    background={'white'}
                                    boxShadow="0px 2px 2px rgba(0, 0, 0, 0.1)"
                                    borderRadius={'4px'}
                                >
                                    <HStack>
                                        <Flex
                                            paddingLeft={6}
                                            height={24}
                                            align={'center'}
                                            justify={'center'}
                                        >
                                            {feature.icon}
                                        </Flex>
                                        <Text fontWeight="700">
                                            {intl.formatMessage(featureMessage.title)}
                                        </Text>
                                    </HStack>
                                </Box>
                            </Link>
                        )
                    })}
                </SimpleGrid>
            </Section>

            {productSearchResult && (
                <Section
                    padding={4}
                    paddingTop={16}
                    title={intl.formatMessage({
                        defaultMessage: 'Shop Products',
                        id: 'home.heading.shop_products'
                    })}
                    subtitle={intl.formatMessage(
                        {
                            defaultMessage:
                                'This section contains content from the catalog. {docLink} on how to replace it.',
                            id: 'home.description.shop_products',
                            description:
                                '{docLink} is a html button that links the user to https://sfdc.co/business-manager-manage-catalogs'
                        },
                        {
                            docLink: (
                                <Link
                                    target="_blank"
                                    href={'https://sfdc.co/business-manager-manage-catalogs'}
                                    textDecoration={'none'}
                                    position={'relative'}
                                    _after={{
                                        position: 'absolute',
                                        content: `""`,
                                        height: '2px',
                                        bottom: '-2px',
                                        margin: '0 auto',
                                        left: 0,
                                        right: 0,
                                        background: 'gray.700'
                                    }}
                                    _hover={{textDecoration: 'none'}}
                                >
                                    {intl.formatMessage({
                                        defaultMessage: 'Read docs',
                                        id: 'home.link.read_docs'
                                    })}
                                </Link>
                            )
                        }
                    )}
                >
                    <Stack pt={8} spacing={16}>
                        <ProductScroller
                            products={productSearchResult?.hits}
                            isLoading={isLoading}
                        />
                    </Stack>
                </Section>
            )}

            <Section
                padding={4}
                paddingTop={32}
                title={intl.formatMessage({
                    defaultMessage: 'Features',
                    id: 'home.heading.features'
                })}
                subtitle={intl.formatMessage({
                    defaultMessage:
                        'Out-of-the-box features so that you focus only on adding enhancements.',
                    id: 'home.description.features'
                })}
            >
                <Container maxW={'6xl'} marginTop={10}>
                    <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={10}>
                        {features.map((feature, index) => {
                            const featureMessage = feature.message
                            return (
                                <HStack key={index} align={'top'}>
                                    <VStack align={'start'}>
                                        <Flex
                                            width={16}
                                            height={16}
                                            align={'center'}
                                            justify={'left'}
                                            color={'gray.900'}
                                            paddingX={2}
                                        >
                                            {feature.icon}
                                        </Flex>
                                        <Text
                                            as="h3"
                                            color={'black'}
                                            fontWeight={700}
                                            fontSize={20}
                                        >
                                            {intl.formatMessage(featureMessage.title)}
                                        </Text>
                                        <Text color={'black'}>
                                            {intl.formatMessage(featureMessage.text)}
                                        </Text>
                                    </VStack>
                                </HStack>
                            )
                        })}
                    </SimpleGrid>
                </Container>
            </Section>

            <Section
                padding={4}
                paddingTop={32}
                title={intl.formatMessage({
                    defaultMessage: "We're here to help",
                    id: 'home.heading.here_to_help'
                })}
                subtitle={
                    <>
                        <>
                            {intl.formatMessage({
                                defaultMessage: 'Contact our support staff.',
                                id: 'home.description.here_to_help'
                            })}
                        </>
                        <br />
                        <>
                            {intl.formatMessage({
                                defaultMessage: 'They will get you to the right place.',
                                id: 'home.description.here_to_help_line_2'
                            })}
                        </>
                    </>
                }
                actions={
                    <Button
                        as={Link}
                        href="https://help.salesforce.com/s/?language=en_US"
                        target="_blank"
                        width={'auto'}
                        paddingX={7}
                        _hover={{textDecoration: 'none'}}
                    >
                        <FormattedMessage defaultMessage="Contact Us" id="home.link.contact_us" />
                    </Button>
                }
                maxWidth={'xl'}
            />
        </Box>
    )
}

// Home.getTemplateName = () => 'home' // Removed static method

export default Home

export async function getServerSideProps(context) {
    // Set cache control headers
    context.res.setHeader(
        'Cache-Control',
        `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
    )

    // Fallback: Simulate API call with mock data
    const mockProductSearchResult = {
        hits: [
            {
                productId: 'mock-product-1',
                productName: 'Mock Product 1',
                image: {disBaseLink: '/img/hero.png', alt: 'Mock Product 1'},
                price: 19.99,
                currency: 'USD',
                // Add other necessary fields that ProductScroller expects
            },
            {
                productId: 'mock-product-2',
                productName: 'Mock Product 2',
                image: {disBaseLink: '/img/secondary-a.png', alt: 'Mock Product 2'},
                price: 29.99,
                currency: 'USD',
            },
            {
                productId: 'mock-product-3',
                productName: 'Mock Product 3',
                image: {disBaseLink: '/img/secondary-b.png', alt: 'Mock Product 3'},
                price: 39.99,
                currency: 'USD',
            }
        ],
        // Add other top-level fields like 'total', 'refinements', 'sortingOptions' if needed by the component
        total: 3 
    };

    // In a real scenario, you would initialize the Salesforce Commerce SDK client here
    // and make an API call similar to:
    // const client = new CommerceSDKClient(...config);
    // const productSearchResult = await client.shopperSearch.productSearch({
    //     parameters: {
    //         allImages: true,
    //         allVariationProperties: true,
    //         expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
    //         limit: HOME_SHOP_PRODUCTS_LIMIT,
    //         perPricebook: true,
    //         refine: [`cgid=${HOME_SHOP_PRODUCTS_CATEGORY_ID}`, 'htype=master']
    //     }
    // });
    // For now, we return mock data.
    return { props: { productSearchResult: mockProductSearchResult } };
}
