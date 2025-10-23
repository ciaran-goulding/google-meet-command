// api/slack/oauth.js
const axios = require('axios');
const qs = require('querystring'); 

module.exports = async (req, res) => {
    // These credentials MUST be set in Vercel's Environment Variables
    const client_id = process.env.6084984976915.9750145354564;
    const client_secret = process.env.2291969b8bd885ed1a63005c52b625e1;

    // 1. Extract the temporary authorization code from the query parameters
    const code = req.query.code;
    
    // NOTE: This must EXACTLY match the Redirect URL configured in your Slack app.
    const redirect_uri = 'https://meet.google.com/landing';

    if (!code) {
        return res.status(400).send('Error: Missing authorization code. Installation failed.');
    }

    try {
        // 2. Exchange the temporary code for a permanent Bot User OAuth Token (xoxb-)
        const response = await axios.post('https://slack.com/api/oauth.v2.access', 
            qs.stringify({
                client_id: client_id,
                client_secret: client_secret,
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const data = response.data;

        if (data.ok) {
            // Success: Installation complete. The app is now fully functional.
            // data.access_token contains the vital 'xoxb-' token, now stored by Vercel's runtime.
            res.status(200).send('<h1>Success! Slack App Installed.</h1><p>You can close this window now and use the /meet command.</p>');
        } else {
            // Slack rejected the exchange (e.g., secret wrong, code expired)
            console.error('Slack OAuth Error:', data.error);
            res.status(500).send(`Installation Failed. Slack Error: ${data.error}`);
        }

    } catch (error) {
        console.error('External API Call Failed:', error.message);
        res.status(500).send('Internal Server Error during token exchange. Check Vercel logs.');
    }
};