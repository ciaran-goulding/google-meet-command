// Add require statement for axios
const axios = require('axios');
const qs = require('querystring'); 

module.exports = async (req, res) => {
    const code = req.query.code;
    const client_id = process.env.SLACK_CLIENT_ID;
    const client_secret = process.env.SLACK_CLIENT_SECRET;
    
    // IMPORTANT: This redirect_uri must EXACTLY match the one in your Slack App settings.
    const redirect_uri = 'https://google-meet-command.vercel.app/api/slack/oauth/callback';

    if (!code) {
        return res.status(400).send('Error: Missing authorization code.');
    }

    try {
        // --- CRITICAL STEP: Exchange the temporary code for a permanent token ---
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
            // Success: App is installed, token is received and valid.
            // data.access_token contains the permanent 'xoxb-' token.
            res.status(200).send('App installation complete! You can close this window and use /meet in Slack.');
        } else {
            // Failure: Slack rejected the exchange (e.g., code expired, secret wrong)
            res.status(500).send(`Installation failed: Slack Error: ${data.error}`);
        }

    } catch (error) {
        console.error('External API Call Failed:', error);
        res.status(500).send('Internal Server Error during token exchange.');
    }
};