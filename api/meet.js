/**
 * Vercel Serverless Function entry point for the Slack /meet command.
 * This file should be saved as 'api/meet.js' in a new project folder.
 * * NOTE: This requires the Slack Signing Secret to be set as an Environment Variable
 * on Vercel named SLACK_SIGNING_SECRET.
 * * @param {object} req - Vercel request object (contains Slack data in req.body).
 * @param {object} res - Vercel response object.
 */
const crypto = require('crypto');
const qs = require('querystring');

// --- 1. RATE LIMITING (Placeholder Logic) ---
// Note: Vercel platforms have built-in rate-limiting, but this is a conceptual check.
// This example does NOT persist state (required for true rate limiting).
const rateLimitCheck = (req) => {
    // In a real application, you would check a database (e.g., Redis) 
    // to see if req.body.user_id or req.body.team_id has exceeded a limit.
    // For this example, we will just return true (allow).
    return true; 
};

// --- 2. SIGNATURE VERIFICATION ---
const verifySlackSignature = (req) => {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (!signature || !timestamp || !signingSecret) {
        // Essential headers or secret missing
        return false;
    }

    // Check for replay attacks (timestamp must be recent, e.g., within 5 minutes)
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
    if (timestamp < fiveMinutesAgo) {
        return false; // Request is too old
    }

    // The signature base string is: v0:timestamp:request_body
    // Vercel's body parser already converts the raw buffer body into req.body, 
    // so we need to rebuild the raw body from the parsed data for verification.
    // In a Vercel/Express environment, the raw body is typically needed for verification,
    // which is lost when req.body is parsed. We use the raw request body buffer if available,
    // or reconstruct it (as an approximation).

    // --- Critical Assumption: Vercel Body Parser ---
    // If Vercel/Next.js is configured to expose the raw body, use that.
    // Otherwise, we reconstruct the body from req.body (which is typically qs-encoded for slash commands)
    const rawBody = qs.stringify(req.body); 
    
    const basestring = `v0:${timestamp}:${rawBody}`;
    
    const hash = 'v0=' + 
        crypto.createHmac('sha256', signingSecret)
              .update(basestring)
              .digest('hex');

    // Compare the calculated hash with the signature received from Slack
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
};

module.exports = async (req, res) => {
    // 1. Method Check
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // 2. Signature Verification Check
    if (!verifySlackSignature(req)) {
        console.error('Signature verification failed.');
        return res.status(401).send('Signature Verification Failed: Unauthorized');
    }

    // 3. Rate Limit Check (Conceptual)
    if (!rateLimitCheck(req)) {
        return res.status(429).send('Too Many Requests');
    }

    // --- APPLICATION LOGIC (Only runs if checks pass) ---
    const meetUrl = "https://meet.google.com/new";
    
    // Original payload logic (restored to include only original elements)
    const responsePayload = {
        response_type: "in_channel", 
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:video_camera: *Instant Google Meet Started* by <@${req.body.user_id}>` 
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Join Google Meet Now"
                        },
                        style: "primary",
                        url: meetUrl
                    }
                ]
            }
        ]
    };

    // 4. Send the JSON response back to Slack
    res.json(responsePayload);
};