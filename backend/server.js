import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendEmails, testConnection, testAlias } from './emailService.js';
import { readProspects, writeProspects } from './dataSync.js';

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

// Get default from email
app.get('/api/email/default-from', (req, res) => {
    const defaultEmail = process.env.OFFICE365_USER_EMAIL;
    if (defaultEmail) {
        res.json({ success: true, email: defaultEmail });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'No default email configured' 
        });
    }
});

// Test if an alias can be used (query parameter version - easier to use)
app.get('/api/email/test-alias', async (req, res) => {
    try {
        const aliasEmail = req.query.email;
        if (!aliasEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email parameter: /api/email/test-alias?email=your-alias@domain.com' 
            });
        }
        const result = await testAlias(aliasEmail);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Test if an alias can be used (URL parameter version - for backwards compatibility)
app.get('/api/email/test-alias/:email', async (req, res) => {
    try {
        const aliasEmail = req.params.email;
        const result = await testAlias(aliasEmail);
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
        const { recipients, subject, previewText, message, fromEmail } = req.body;
        
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
        
        if (!fromEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'From email is required' 
            });
        }
        
        console.log(`Sending emails to ${recipients.length} recipients from ${fromEmail}...`);
        
        const result = await sendEmails(recipients, subject, message, fromEmail, previewText);
        
        console.log(`Email send complete: ${result.sent} sent, ${result.failed} failed`);
        
        // Update email_sent timestamp for successfully sent emails
        if (result.sent > 0) {
            const prospects = readProspects();
            const timestamp = new Date().toISOString();
            const successEmails = result.results.map(r => r.email);
            
            prospects.forEach(prospect => {
                if (successEmails.includes(prospect.email)) {
                    prospect.email_sent = timestamp;
                }
            });
            
            writeProspects(prospects);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('Send emails error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get all prospects
app.get('/api/prospects', (req, res) => {
    try {
        const prospects = readProspects();
        res.json({ success: true, data: prospects });
    } catch (error) {
        console.error('Get prospects error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Update a prospect (for email_sent, blocked flags)
app.put('/api/prospects/:licenseNumber', (req, res) => {
    try {
        const { licenseNumber } = req.params;
        const updates = req.body;
        
        const prospects = readProspects();
        const index = prospects.findIndex(p => p.licenseNumber === licenseNumber);
        
        if (index === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Prospect not found' 
            });
        }
        
        // Update only allowed fields
        if (updates.hasOwnProperty('blocked')) {
            prospects[index].blocked = updates.blocked;
        }
        if (updates.hasOwnProperty('email_sent')) {
            prospects[index].email_sent = updates.email_sent;
        }
        
        const success = writeProspects(prospects);
        
        if (success) {
            res.json({ 
                success: true, 
                data: prospects[index],
                message: 'Prospect updated successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save changes' 
            });
        }
        
    } catch (error) {
        console.error('Update prospect error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Bulk delete prospects (MUST be before POST /api/prospects)
app.post('/api/prospects/bulk-delete', (req, res) => {
    try {
        const { licenseNumbers } = req.body;
        
        if (!licenseNumbers || !Array.isArray(licenseNumbers) || licenseNumbers.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'licenseNumbers array is required' 
            });
        }
        
        console.log(`Bulk delete request for ${licenseNumbers.length} prospects`);
        
        const prospects = readProspects();
        const toDelete = new Set(licenseNumbers);
        const deletedProspects = [];
        
        // Filter out prospects to delete
        const remainingProspects = prospects.filter(p => {
            if (toDelete.has(p.licenseNumber)) {
                deletedProspects.push(p);
                return false;
            }
            return true;
        });
        
        if (deletedProspects.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No matching prospects found' 
            });
        }
        
        // Write updated data to all locations (JSON + Excel)
        const success = writeProspects(remainingProspects);
        
        if (success) {
            console.log(`✓ Bulk deleted ${deletedProspects.length} prospects`);
            res.json({ 
                success: true, 
                message: `Successfully deleted ${deletedProspects.length} prospect(s)`,
                deleted: deletedProspects.length,
                deletedProspects: deletedProspects
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete prospects' 
            });
        }
        
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Add a new prospect
app.post('/api/prospects', (req, res) => {
    try {
        const newProspect = req.body;
        
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'licenseNumber'];
        const missingFields = requiredFields.filter(field => !newProspect[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        const prospects = readProspects();
        
        // Check if license number already exists
        const exists = prospects.some(p => p.licenseNumber === newProspect.licenseNumber);
        if (exists) {
            return res.status(400).json({ 
                success: false, 
                message: 'A prospect with this license number already exists' 
            });
        }
        
        // Add default values for tracking fields
        newProspect.email_sent = null;
        newProspect.blocked = false;
        
        // Add full name if not provided
        if (!newProspect.fullName) {
            newProspect.fullName = `${newProspect.firstName} ${newProspect.lastName}`.trim();
        }
        
        prospects.push(newProspect);
        
        const success = writeProspects(prospects);
        
        if (success) {
            res.json({ 
                success: true, 
                data: newProspect,
                message: 'Prospect added successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save new prospect' 
            });
        }
        
    } catch (error) {
        console.error('Add prospect error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Delete a single prospect
app.delete('/api/prospects/:licenseNumber', (req, res) => {
    try {
        const { licenseNumber } = req.params;
        
        console.log(`Delete request for license: ${licenseNumber}`);
        
        const prospects = readProspects();
        const index = prospects.findIndex(p => p.licenseNumber === licenseNumber);
        
        if (index === -1) {
            console.log(`Prospect not found: ${licenseNumber}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Prospect not found' 
            });
        }
        
        // Store the deleted prospect info for response
        const deletedProspect = prospects[index];
        
        // Remove from array
        prospects.splice(index, 1);
        
        // Write updated data to all locations (JSON + Excel)
        const success = writeProspects(prospects);
        
        if (success) {
            console.log(`✓ Deleted prospect: ${deletedProspect.fullName} (${licenseNumber})`);
            res.json({ 
                success: true, 
                message: 'Prospect deleted successfully',
                deletedProspect: deletedProspect
            });
        } else {
            console.log(`Failed to write after deletion`);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete prospect' 
            });
        }
        
    } catch (error) {
        console.error('Delete prospect error:', error);
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
    console.log(`  - GET    /api/health`);
    console.log(`  - GET    /api/email/test`);
    console.log(`  - GET    /api/email/default-from`);
    console.log(`  - GET    /api/email/test-alias/:email`);
    console.log(`  - POST   /api/send-emails`);
    console.log(`  - GET    /api/prospects`);
    console.log(`  - PUT    /api/prospects/:licenseNumber`);
    console.log(`  - POST   /api/prospects`);
    console.log(`  - DELETE /api/prospects/:licenseNumber`);
    console.log(`  - POST   /api/prospects/bulk-delete`);
    console.log(`\n✓ Using Office365 OAuth2 authentication`);
    console.log(`✓ Default sending email: ${process.env.OFFICE365_USER_EMAIL || 'NOT SET'}`);
    console.log(`\n💡 To test email alias, open in browser:`);
    console.log(`   http://localhost:${PORT}/api/email/test-alias?email=your-alias@domain.com`);
    console.log(`📖 See README.md and ALIAS_SETUP_GUIDE.md for setup instructions\n`);
});
