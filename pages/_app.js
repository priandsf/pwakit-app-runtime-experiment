import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { IntlProvider } from 'react-intl';
import Head from 'next/head';
// Attempt to import the Salesforce theme
// import retailTheme from '@salesforce/retail-react-app/app/theme';
import Script from 'next/script';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Script src="/head-active_data.js" strategy="afterInteractive" />
      <Script src="/dwanalytics-22.2.js" strategy="lazyOnload" />
      <Script src="/dwac-21.7.js" strategy="lazyOnload" />
      <IntlProvider locale="en-US" messages={{}} defaultLocale="en-US">
        {/* <ChakraProvider theme={retailTheme || extendTheme({})}> */}
        <ChakraProvider theme={extendTheme({})}>
          <header>Header Placeholder</header>
          <main>
            <Component {...pageProps} />
          </main>
          <footer>Footer Placeholder</footer>
        </ChakraProvider>
      </IntlProvider>
    </>
  );
}

export default MyApp;
