import express from 'express';
import multer from 'multer';
import { FileProcessor } from '../services/fileProcessor.js';
import { EmailJobManager } from '../services/emailJobManager.js';
const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (allowedTypes.includes(file.mimetype) || ['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV and XLSX files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});
// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                data: [],
                message: 'No file uploaded'
            });
        }
        const recipients = await FileProcessor.processFile(req.file);
        res.json({
            success: true,
            data: recipients,
            message: `Successfully processed ${recipients.length} recipients`
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(400).json({
            success: false,
            data: [],
            message: error instanceof Error ? error.message : 'File processing failed'
        });
    }
});
// Send emails endpoint
router.post('/send-emails', async (req, res) => {
    try {
        const { subject, message, cc, provider, recipients, smtpConfig } = req.body;
        if (!subject || !message || !provider || !recipients || recipients.length === 0) {
            return res.status(400).json({
                jobId: '',
                status: 'failed',
                message: 'Missing required fields'
            });
        }
        if (provider === 'smtp' && !smtpConfig) {
            return res.status(400).json({
                jobId: '',
                status: 'failed',
                message: 'SMTP configuration is required for SMTP provider'
            });
        }
        const jobManager = EmailJobManager.getInstance();
        const jobId = jobManager.createJob({
            subject,
            message,
            cc,
            provider,
            recipients,
            smtpConfig
        });
        // Process the job asynchronously
        processJobAsync(jobId);
        res.json({
            jobId,
            status: 'processing'
        });
    }
    catch (error) {
        console.error('Send emails error:', error);
        res.status(500).json({
            jobId: '',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Email sending failed'
        });
    }
});
// Get job status endpoint
router.get('/status/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const jobManager = EmailJobManager.getInstance();
        const job = jobManager.getJob(jobId);
        if (!job) {
            return res.status(404).json({
                jobId,
                status: 'not_found',
                message: 'Job not found'
            });
        }
        const results = jobManager.getJobResults(jobId);
        const sentCount = results.filter(r => r.status === 'sent').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        res.json({
            jobId,
            status: job.status,
            progress: {
                total: job.recipients.length,
                sent: sentCount,
                failed: failedCount,
                remaining: job.recipients.length - sentCount - failedCount
            },
            results
        });
    }
    catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({
            jobId: req.params.jobId,
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to get job status'
        });
    }
});
// SMTP configuration validation endpoint
router.post('/smtp-config', (req, res) => {
    try {
        const { host, port, secure, user, pass } = req.body;
        if (!host || !port || !user || !pass) {
            return res.status(400).json({
                valid: false,
                message: 'Missing required SMTP configuration fields'
            });
        }
        // Basic validation
        if (port < 1 || port > 65535) {
            return res.status(400).json({
                valid: false,
                message: 'Invalid port number'
            });
        }
        res.json({
            valid: true,
            message: 'SMTP configuration is valid'
        });
    }
    catch (error) {
        console.error('SMTP config validation error:', error);
        res.status(500).json({
            valid: false,
            message: error instanceof Error ? error.message : 'SMTP configuration validation failed'
        });
    }
});
// Helper function to process jobs asynchronously
async function processJobAsync(jobId) {
    try {
        const jobManager = EmailJobManager.getInstance();
        await jobManager.processJob(jobId);
    }
    catch (error) {
        console.error(`Job ${jobId} processing failed:`, error);
    }
}
export default router;
