// Regexes for validation
const tenantIdRegExp = /^[a-zA-Z]{4}_([0-9]{3}|s[0-9]{2}|stg|dev|prd)$/;
const shortCodeRegExp = /^[a-zA-Z0-9-]+$/;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { shortCode, tenantId } = req.query;

    // Validate parameters
    if (!shortCode || !tenantId || !shortCodeRegExp.test(shortCode) || !tenantIdRegExp.test(tenantId)) {
        return res.status(400).json({ error: 'Bad request parameters: Tenant ID or short code is invalid or missing.' });
    }

    try {
        // Construct the JWKS URI
        // Note: The organization ID in the URI uses 'f_ecom_' prefix.
        // The tenantId parameter from the path is typically the part after 'f_ecom_'.
        const JWKS_URI = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_${tenantId}/oauth2/jwks`;

        const response = await fetch(JWKS_URI);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching JWKS from ${JWKS_URI}: ${response.status} ${errorBody}`);
            return res.status(response.status).json({ error: `Failed to fetch JWKS: ${response.statusText}` });
        }

        const jwksData = await response.json();

        // Set Cache-Control header
        // JWKS rotate every 30 days. Cache for 14 days (1209600 seconds), stale-while-revalidate for 1 day (86400 seconds).
        res.setHeader('Cache-Control', 'public, max-age=1209600, stale-while-revalidate=86400');

        // Return JWKS data
        return res.status(200).json(jwksData);

    } catch (error) {
        console.error(`Server error while fetching JWKS: ${error.message}`);
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
