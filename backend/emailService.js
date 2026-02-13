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

export async function sendEmails(recipients, subject, message, fromEmail = null) {
    try {
        if (!process.env.OFFICE365_USER_EMAIL) {
            throw new Error('Office365 user email not found. Please set OFFICE365_USER_EMAIL in .env file.');
        }

        // Use provided fromEmail or fallback to env email
        const senderEmail = fromEmail || process.env.OFFICE365_USER_EMAIL;

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
        
        // Log sending details
        console.log(`\n📧 Sending emails:`);
        console.log(`   From: ${senderEmail}`);
        console.log(`   Authenticated as: ${process.env.OFFICE365_USER_EMAIL}`);
        if (senderEmail !== process.env.OFFICE365_USER_EMAIL) {
            console.log(`   ⚠️  Using alias - ensure it's configured in Microsoft 365!`);
        }
        console.log(`   Recipients: ${recipients.length}\n`);
        
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
                            content: personalizedMessage // Already HTML from rich text editor
                        },
                        toRecipients: [
                            {
                                emailAddress: {
                                    address: recipient.email
                                }
                            }
                        ],
                        from: {
                            emailAddress: {
                                address: senderEmail
                            }
                        }
                    },
                    saveToSentItems: true
                };
                
                // Send via Graph API using the authenticated user's email
                // Note: fromEmail must be the user's email or a valid alias/SendAs address
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
                
                // Provide helpful error messages for common alias issues
                let errorMsg = error.message;
                if (error.message.includes('ErrorSendAsDenied') || 
                    error.message.includes('does not have SendAs rights')) {
                    errorMsg = `Send As permission denied for ${senderEmail}. Add this alias in Microsoft 365 Admin and grant SendAs permissions.`;
                } else if (error.message.includes('ErrorInvalidSendAsAddress')) {
                    errorMsg = `"${senderEmail}" is not a valid sending address. Ensure it's added as an alias in Microsoft 365.`;
                }
                
                errors.push({
                    email: recipient.email,
                    success: false,
                    error: errorMsg
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

// Test if a specific email alias can be used
export async function testAlias(aliasEmail) {
    try {
        const client = await getGraphClient();
        
        // Try to send a test email (but we'll use a dry run)
        // First, get the user's mailbox settings to check aliases
        const user = await client
            .api(`/users/${process.env.OFFICE365_USER_EMAIL}`)
            .select('displayName,mail,proxyAddresses,otherMails')
            .get();
        
        // Check if the alias is in the user's proxy addresses
        const aliases = [
            user.mail,
            ...(user.proxyAddresses || []).map(addr => addr.replace(/^smtp:/i, '')),
            ...(user.otherMails || [])
        ];
        
        const isValidAlias = aliases.some(addr => 
            addr.toLowerCase() === aliasEmail.toLowerCase()
        );
        
        return { 
            success: true,
            isValidAlias,
            aliases: aliases.filter(addr => addr.includes('@')),
            message: isValidAlias 
                ? `✅ "${aliasEmail}" is a valid alias and can be used`
                : `⚠️ "${aliasEmail}" is NOT in your mailbox aliases. You may not have permission to send from this address.`,
            help: !isValidAlias ? 'Add this alias in Microsoft 365 Admin Center → Users → Email Aliases' : null
        };
    } catch (error) {
        console.error('Alias test error:', error);
        return { 
            success: false, 
            message: `Error checking alias: ${error.message}`
        };
    }
}

export async function testConnection() {
    try {
        const client = await getGraphClient();
        
        // Test by getting user info
        const user = await client
            .api(`/users/${process.env.OFFICE365_USER_EMAIL}`)
            .select('displayName,mail,proxyAddresses')
            .get();
        
        // Get list of available aliases
        const aliases = [
            user.mail,
            ...(user.proxyAddresses || []).map(addr => addr.replace(/^smtp:/i, ''))
        ].filter(addr => addr.includes('@'));
        
        return { 
            success: true, 
            message: `Microsoft Graph API connection successful. Connected as: ${user.displayName} (${user.mail})`,
            availableAliases: aliases.length > 1 ? aliases : null
        };
    } catch (error) {
        console.error('Connection test error:', error);
        return { 
            success: false, 
            message: error.message || 'Connection test failed'
        };
    }
}
