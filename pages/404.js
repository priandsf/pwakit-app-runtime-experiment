/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react' // Removed useEffect as it's not used here
import {
    Box,
    Heading,
    Flex,
    Button,
    Stack,
    Text
} from '../app/components/shared/ui' // Adjusted path
// import {Helmet} from 'react-helmet' // Replaced by Head
import Head from 'next/head'
import {useIntl} from 'react-intl'
// import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks' // PWA Kit specific
import {SearchIcon} from '../app/components/icons' // Adjusted path
// import {useHistory} from 'react-router-dom' // Replaced by useRouter
import {useRouter} from 'next/router'
// import Link from '@salesforce/retail-react-app/app/components/link'
import NextLink from 'next/link' // Using Next.js Link
// Seo component is replaced by Head

const PageNotFound = () => {
    const intl = useIntl()
    const router = useRouter() // Using Next.js router
    // const {res} = useServerContext() // PWA Kit specific, remove

    // In Next.js, setting status code is typically done in getServerSideProps or getStaticProps if needed.
    // For a custom 404 page, Next.js handles the 404 status automatically.
    // if (res) { // PWA Kit specific, remove
    //     res.status(404)
    // }

    // Add Einstein and DataCloud hooks if they are intended to be used on 404 pages.
    // For now, assuming they are not part of the minimal 404 page.
    // const einstein = useEinstein()
    // const dataCloud = useDataCloud()
    // useEffect(() => {
    //     einstein.sendViewPage(router.asPath)
    //     dataCloud.sendViewPage(router.asPath)
    // }, [router.asPath, einstein, dataCloud])

    return (
        <Box
            layerStyle="page"
            className="page-not-found"
            height={'100%'}
            padding={{lg: 8, md: 6, sm: 0, base: 0}}
        >
            {/* <Helmet>
                <title>
                    {intl.formatMessage({
                        defaultMessage: "The page you're looking for can't be found.",
                        id: 'page_not_found.title.page_cant_be_found'
                    })}
                </title>
            </Helmet> */}
            <Head>
                <title>
                    {intl.formatMessage({
                        defaultMessage: "The page you're looking for can't be found.",
                        id: 'page_not_found.title.page_cant_be_found'
                    })}
                </title>
                 <meta name="robots" content="noindex" />
            </Head>

            <Flex
                h="100%"
                justify="center"
                align="center"
                flexDirection="column"
                px={{base: 5, md: 12}}
                py={{base: 48, md: 60}}
            >
                <SearchIcon boxSize={['30px', '32px']} mb={8} />
                <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2} align="center">
                    {intl.formatMessage({
                        defaultMessage: "The page you're looking for can't be found.",
                        id: 'page_not_found.title.page_cant_be_found'
                    })}
                </Heading>
                <Box mb={12}>
                    <Text textAlign="center">
                        {intl.formatMessage({
                            defaultMessage:
                                'Please try retyping the address, going back to the previous page, or going to the home page.',
                            id: 'page_not_found.message.suggestion_to_try'
                        })}
                    </Text>
                </Box>
                <Stack direction={['column', 'row']} width={['100%', 'auto']}>
                    <Button
                        variant="outline"
                        bg="white"
                        onClick={() => router.back()} // Using router.back()
                        borderColor={'gray.200'}
                    >
                        {intl.formatMessage({
                            defaultMessage: 'Back to previous page',
                            id: 'page_not_found.action.go_back'
                        })}
                    </Button>
                    <NextLink href="/" passHref>
                        <Button as="a"> {/* Render as anchor tag */}
                            {intl.formatMessage({
                                defaultMessage: 'Go to home page',
                                id: 'page_not_found.link.homepage'
                            })}
                        </Button>
                    </NextLink>
                </Stack>
            </Flex>
        </Box>
    )
}

// PageNotFound.getTemplateName = () => 'page-not-found' // Removed PWA Kit specific

export default PageNotFound
