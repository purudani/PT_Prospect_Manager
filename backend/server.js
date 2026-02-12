import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendEmails, testConnection } from './emailService.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Test SMTP connection
app.get('/api/email/test', async (req, res) => {
    try {
        const result = await testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Send emails endpoint
app.post('/api/send-emails', async (req, res) => {
    try {
        const { recipients, subject, message, senderName } = req.body;
        
        // Validate request body
        if (!recipients || !Array.isArray(recipients)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipients must be an array' 
            });
        }
        
        if (!subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject and message are required' 
            });
        }
        
        console.log(`Sending emails to ${recipients.length} recipients...`);
        
        const result = await sendEmails(recipients, subject, message, senderName);
        
        console.log(`Email send complete: ${result.sent} sent, ${result.failed} failed`);
        
        res.json(result);
        
    } catch (error) {
        console.error('Send emails error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ API endpoints:`);
    console.log(`  - GET  /api/health`);
    console.log(`  - GET  /api/email/test`);
    console.log(`  - POST /api/send-emails`);
    console.log(`\nUsing Office365 OAuth2 authentication`);
    console.log(`Make sure to complete Azure AD app registration (see README.md)\n`);
});
