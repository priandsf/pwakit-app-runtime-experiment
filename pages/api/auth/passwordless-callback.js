import { validateSlasCallbackToken, sendMagicLinkEmail } from '../_utils/auth-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const slasCallbackToken = req.headers['x-slas-callback-token'];
        const { redirectUrl } = req.query; // redirectUrl might be in query for some flows

        // Validate the SLAS callback token
        await validateSlasCallbackToken(slasCallbackToken);

        // Determine the landing path and Marketing Cloud template from environment variables
        const landingPath = process.env.PASSWORDLESS_LOGIN_LANDING_PATH;
        const emailTemplate = process.env.MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE;

        if (!landingPath || !emailTemplate) {
            console.error('Passwordless login landing path or email template environment variables are not set.');
            return res.status(500).json({ error: 'Passwordless login configuration is incomplete.' });
        }
        
        // Send the magic link email
        // req (NextApiRequest) is passed to sendMagicLinkEmail to derive base URL and access body
        const emailResponse = await sendMagicLinkEmail(req, landingPath, emailTemplate, redirectUrl);

        return res.status(200).json(emailResponse);

    } catch (error) {
        console.error('Passwordless callback error:', error);
        if (error.code === 401 || error.message.includes('Token Validation Error')) {
            return res.status(401).json({ error: 'Unauthorized: Invalid SLAS callback token.' });
        }
        if (error.message.includes('Missing email_id or token')) {
             return res.status(400).json({ error: `Bad Request: ${error.message}` });
        }
        if (error.message.includes('Marketing Cloud') || error.message.includes('configuration is incomplete')) {
            return res.status(500).json({ error: `Email service error: ${error.message}` });
        }
        return res.status(500).json({ error: 'Internal Server Error during passwordless callback.' });
    }
}
