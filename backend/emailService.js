import { Client } from '@microsoft/microsoft-graph-client';
import { config } from 'dotenv';
import { ConfidentialClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';

config({ path: '../.env' });

let msalClient = null;
let graphClient = null;

// Initialize MSAL client for OAuth2
function initializeMsalClient() {
    if (!process.env.OFFICE365_CLIENT_ID || 
        !process.env.OFFICE365_CLIENT_SECRET || 
        !process.env.OFFICE365_TENANT_ID) {
        throw new Error('Office365 OAuth credentials not found. Please set OFFICE365_CLIENT_ID, OFFICE365_CLIENT_SECRET, and OFFICE365_TENANT_ID in .env file.');
    }

    const msalConfig = {
        auth: {
            clientId: process.env.OFFICE365_CLIENT_ID,
            authority: `https://login.microsoftonline.com/${process.env.OFFICE365_TENANT_ID}`,
            clientSecret: process.env.OFFICE365_CLIENT_SECRET,
        }
    };

    return new ConfidentialClientApplication(msalConfig);
}

// Get OAuth2 access token
async function getAccessToken() {
    if (!msalClient) {
        msalClient = initializeMsalClient();
    }

    const tokenRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
    };

    try {
        const response = await msalClient.acquireTokenByClientCredential(tokenRequest);
        return response.accessToken;
    } catch (error) {
        console.error('Error acquiring access token:', error);
        throw new Error('Failed to acquire OAuth2 access token: ' + error.message);
    }
}

// Initialize Graph Client
async function getGraphClient() {
    const accessToken = await getAccessToken();
    
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
}

// Convert plain text message to HTML
function textToHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

export async function sendEmails(recipients, subject, message, senderName = null) {
    try {
        if (!process.env.OFFICE365_USER_EMAIL) {
            throw new Error('Office365 user email not found. Please set OFFICE365_USER_EMAIL in .env file.');
        }

        // Get Graph client with fresh token
        const client = await getGraphClient();
        
        // Validate inputs
        if (!recipients || recipients.length === 0) {
            throw new Error('No recipients provided');
        }
        
        if (!subject || !message) {
            throw new Error('Subject and message are required');
        }
        
        // Rate limiting: max 50 recipients per request
        if (recipients.length > 50) {
            throw new Error('Maximum 50 recipients allowed per request');
        }
        
        // Filter out invalid emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validRecipients = recipients.filter(r => emailRegex.test(r.email));
        
        if (validRecipients.length === 0) {
            throw new Error('No valid email addresses found');
        }
        
        // Send individual emails to each recipient using Graph API
        const results = [];
        const errors = [];
        
        for (const recipient of validRecipients) {
            try {
                // Personalize the message with recipient name if available
                let personalizedMessage = message;
                if (recipient.name) {
                    personalizedMessage = message.replace(/\[First Name\]/g, recipient.name);
                }
                
                // Prepare email message for Graph API
                const mailMessage = {
                    message: {
                        subject: subject,
                        body: {
                            contentType: 'HTML',
                            content: textToHtml(personalizedMessage)
                        },
                        toRecipients: [
                            {
                                emailAddress: {
                                    address: recipient.email
                                }
                            }
                        ],
                        from: senderName ? {
                            emailAddress: {
                                name: senderName,
                                address: process.env.OFFICE365_USER_EMAIL
                            }
                        } : undefined
                    },
                    saveToSentItems: true
                };
                
                // Send via Graph API
                await client
                    .api(`/users/${process.env.OFFICE365_USER_EMAIL}/sendMail`)
                    .post(mailMessage);
                
                results.push({
                    email: recipient.email,
                    success: true
                });
                
                console.log(`✓ Sent email to ${recipient.email}`);
                
            } catch (error) {
                console.error(`✗ Failed to send to ${recipient.email}:`, error.message);
                errors.push({
                    email: recipient.email,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            sent: results.length,
            failed: errors.length,
            results: results,
            errors: errors
        };
        
    } catch (error) {
        console.error('Email service error:', error);
        throw error;
    }
}

export async function testConnection() {
    try {
        const client = await getGraphClient();
        
        // Test by getting user info
        const user = await client
            .api(`/users/${process.env.OFFICE365_USER_EMAIL}`)
            .select('displayName,mail')
            .get();
        
        return { 
            success: true, 
            message: `Microsoft Graph API connection successful. Connected as: ${user.displayName} (${user.mail})`
        };
    } catch (error) {
        console.error('Connection test error:', error);
        return { 
            success: false, 
            message: error.message || 'Connection test failed'
        };
    }
}
