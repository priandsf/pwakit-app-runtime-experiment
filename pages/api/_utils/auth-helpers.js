import crypto from 'crypto';
import {createRemoteJWKSet as joseCreateRemoteJWKSet, jwtVerify, decodeJwt} from 'jose';

// --- Marketing Cloud Logic ---
// Note: Managing this token's state in a serverless environment needs care.
// For now, the existing logic is ported. This might mean the token is not
// effectively shared across all serverless function invocations if they are cold starts.
let marketingCloudToken = '';
let marketingCloudTokenExpiration = new Date(0); // Initialize to expired

export function generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
}

export async function sendMarketingCloudEmail(emailId, marketingCloudConfig) {
    // Refresh token if expired or not present
    if (new Date() >= marketingCloudTokenExpiration || !marketingCloudToken) {
        const {clientId, clientSecret, subdomain} = marketingCloudConfig;
        if (!clientId || !clientSecret || !subdomain) {
            console.error('Marketing Cloud environment variables (CLIENT_ID, CLIENT_SECRET, SUBDOMAIN) are not set.');
            throw new Error('Marketing Cloud configuration is incomplete.');
        }
        const tokenUrl = `https://${subdomain}.auth.marketingcloudapis.com/v2/token`;
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.error(`Failed to fetch Marketing Cloud access token: ${tokenResponse.status} ${errorBody}`);
            throw new Error('Failed to fetch Marketing Cloud access token. Check your Marketing Cloud credentials and try again.');
        }

        const {access_token, expires_in} = await tokenResponse.json();
        marketingCloudToken = access_token;
        // Set expiration (e.g., 15 minutes from now, API returns expires_in in seconds)
        marketingCloudTokenExpiration = new Date(Date.now() + (expires_in ? expires_in - 300 : 15 * 60) * 1000); // refresh 5 mins before expiry
    }

    // Send the email
    const emailUrl = `https://${marketingCloudConfig.subdomain}.rest.marketingcloudapis.com/messaging/v1/email/messages/${generateUniqueId()}`;
    const emailResponse = await fetch(emailUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${marketingCloudToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            definitionKey: marketingCloudConfig.templateId,
            recipient: {
                contactKey: emailId,
                to: emailId,
                attributes: {'magic-link': marketingCloudConfig.magicLink}
            }
        })
    });

    if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        console.error(`Failed to send email to Marketing Cloud: ${emailResponse.status} ${errorBody}`);
        throw new Error('Failed to send email to Marketing Cloud');
    }
    return await emailResponse.json();
}

export async function emailLink(emailId, templateId, magicLink) {
    // These env vars will be checked within sendMarketingCloudEmail via marketingCloudConfig
    const marketingCloudConfig = {
        clientId: process.env.MARKETING_CLOUD_CLIENT_ID,
        clientSecret: process.env.MARKETING_CLOUD_CLIENT_SECRET,
        magicLink: magicLink,
        subdomain: process.env.MARKETING_CLOUD_SUBDOMAIN,
        templateId: templateId
    };
    return await sendMarketingCloudEmail(emailId, marketingCloudConfig);
}

// Reusable function to handle sending a magic link email.
export async function sendMagicLinkEmail(req, landingPath, emailTemplate, redirectUrl) {
    // Extract the base URL from the request
    const host = req.headers.host || process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
    const protocol = req.headers['x-forwarded-proto'] || (host?.includes('localhost') ? 'http' : 'https');
    const base = `${protocol}://${host}`;

    // Extract the email_id and token from the request body
    const {email_id, token} = req.body;

    if (!email_id || !token) {
        throw new Error('Missing email_id or token in request body.');
    }
    if(!landingPath || !emailTemplate){
        throw new Error('Missing landingPath or emailTemplate configuration.');
    }

    // Construct the magic link URL
    let magicLink = `${base}${landingPath}?token=${encodeURIComponent(token)}`;
    if (landingPath === process.env.RESET_PASSWORD_LANDING_PATH) { // Assumes RESET_PASSWORD_LANDING_PATH is set
        magicLink += `&email=${encodeURIComponent(email_id)}`;
    }
    if (landingPath === process.env.PASSWORDLESS_LOGIN_LANDING_PATH && redirectUrl) { // Assumes PASSWORDLESS_LOGIN_LANDING_PATH is set
        magicLink += `&redirect_url=${encodeURIComponent(redirectUrl)}`;
    }

    return await emailLink(email_id, emailTemplate, magicLink);
}


// --- SLAS Token Validation Logic ---
export const CLAIM = {
    ISSUER: 'iss'
};

export const DELIMITER = {
    ISSUER: '/'
};

export const throwSlasTokenValidationError = (message, code) => {
    const error = new Error(`SLAS Token Validation Error: ${message}`);
    error.code = code;
    throw error;
};

export const createRemoteJWKSet = (tenantId) => {
    // The app origin for JWKS URI needs to be reliably determined.
    // Using an environment variable for the base part of the JWKS URI is safer.
    // Example: JWKS_URI_BASE="https://my-app.com"
    // Or if the pattern is very fixed: process.env.APP_ORIGIN_FOR_JWKS
    // For now, constructing based on common env vars, but this is sensitive.
    const appOrigin = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'; // Fallback for local
    
    const shortCode = process.env.COMMERCE_API_SHORT_CODE;
    const configTenantId = process.env.COMMERCE_API_ORGANIZATION_ID?.replace(/^f_ecom_/, '');

    if (!shortCode || !configTenantId) {
        throw new Error('Missing COMMERCE_API_SHORT_CODE or COMMERCE_API_ORGANIZATION_ID environment variables for JWKS URI construction.');
    }

    if (tenantId !== configTenantId) {
        console.error(`Tenant ID mismatch: PWA Kit config ("${configTenantId}"), SLAS token ("${tenantId}").`);
        throw new Error(
            `The tenant ID in your PWA Kit configuration ("${configTenantId}") does not match the tenant ID in the SLAS callback token ("${tenantId}").`
        );
    }
    const JWKS_URI = `${appOrigin}/${shortCode}/${tenantId}/oauth2/jwks`;
    return joseCreateRemoteJWKSet(new URL(JWKS_URI));
};

export const validateSlasCallbackToken = async (token) => {
    if (!token) {
        throwSlasTokenValidationError('Token not provided.', 400);
    }
    const payload = decodeJwt(token);
    const subClaim = payload[CLAIM.ISSUER];
    if (!subClaim || typeof subClaim !== 'string') {
        throwSlasTokenValidationError('Invalid issuer claim in token.', 400);
    }
    const tokens = subClaim.split(DELIMITER.ISSUER);
    if (tokens.length < 3) {
        throwSlasTokenValidationError('Issuer claim format is incorrect.', 400);
    }
    const tenantId = tokens[2]; // e.g. f_ecom_zzrf_001 -> zzrf_001
    
    try {
        const jwks = createRemoteJWKSet(tenantId);
        const {payload: verifiedPayload} = await jwtVerify(token, jwks, {}); // Rename to avoid conflict
        return verifiedPayload;
    } catch (error) {
        console.error("JWKS validation error:", error);
        throwSlasTokenValidationError(error.message, 401);
    }
};

// --- JWKS Caching (Example, if needed directly in API routes, not typical for helpers) ---
// This was part of app/ssr.js but is more of an endpoint itself. 
// If you need a /jwks endpoint, it should be a separate API route.
// For now, removing jwksCaching from here as it was an Express route handler.
// If createRemoteJWKSet needs it, it should be self-contained or called by an endpoint.

console.log("Auth helpers module loaded."); // For debugging
