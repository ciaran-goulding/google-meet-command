// api/slack/oauth.js

const axios = require('axios');
const qs = require('querystring'); 

module.exports = async (req, res) => {
    // --- 1. Load Credentials (Ensure they are accessed correctly) ---
    const client_id = process.env.SLACK_CLIENT_ID;
    const client_secret = process.env.SLACK_CLIENT_SECRET;
    const code = req.query.code;
    
    // IMPORTANT: This must match the URL you put in Slack's Redirect URLs field
    const redirect_uri = 'https://google-meet-command.vercel.app/api/slack/oauth/callback'; 

    if (!code) {
        return res.status(400).send('Installation Error: No authorization code received.');
    }

    try {
        // --- 2. CRITICAL STEP: Token Exchange Request ---
        const tokenExchangeURL = 'https://slack.com/api/oauth.v2.access';
        
        const response = await axios.post(
            tokenExchangeURL,
            qs.stringify({
                client_id: client_id,
                client_secret: client_secret,
                code: code,
                redirect_uri: redirect_uri // Must be included and match
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const data = response.data;

        if (data.ok) {
            // Success: Installation complete.
            res.status(200).send('<h1>Success! Slack App Installed.</h1><p>You can close this window now and use the /meet command.</p>');
        } else {
            // Failure: Slack rejected the exchange (e.g., 'invalid_client_secret')
            console.error('Slack OAuth Error:', data.error);
            res.status(500).send(`Installation Failed. Slack Error: ${data.error}`);
        }

    } catch (error) {
        // The function is crashing before a response is sent to Slack
        console.error('API Function Crashed:', error.message);
        res.status(500).send('Internal Server Error: Token exchange process failed.');
    }
};