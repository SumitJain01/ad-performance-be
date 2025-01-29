const express = require('express');
const serverless = require("serverless-http");
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { analyzeAdPerformance } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Enable CORS for all origins (Update for production security)
app.use(cors({
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// ✅ Handle preflight requests properly
app.options('*', cors());

// ✅ Increase request body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Ensure Render supports temporary file storage
const upload = multer({
    dest: '/tmp/', // Render allows file writing here
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ✅ Utility function to clean CSV headers
function cleanObjectKeys(obj) {
    const cleanedObj = {};
    Object.keys(obj).forEach((key) => {
        let cleanedKey = key.replaceAll('"', '').replace(/\s+/g, '').toLowerCase().replace('(usd)', '');
        cleanedObj[cleanedKey] = obj[key];
    });
    return cleanedObj;
}

// ✅ File Upload API
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log("📤 Upload request received");

    if (!req.file) {
        console.error("❌ No file uploaded");
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("✅ File uploaded successfully:", req.file);

    res.status(200).json({
        message: 'File uploaded successfully',
        filePath: req.file.path,
    });
});

// ✅ Analyze CSV API
app.post('/analyze', async (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        console.error("❌ File path missing in request");
        return res.status(400).json({ error: 'File path is required' });
    }

    try {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(cleanObjectKeys(data)))
            .on('end', async () => {
                console.log("✅ CSV file parsed successfully");
                const analysis = await analyzeAdPerformance(results);
                res.status(200).json(analysis);
            });
    } catch (error) {
        console.error("❌ Error analyzing file:", error);
        res.status(500).json({ error: 'Error analyzing file', details: error.message });
    }
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export for Serverless Deployment (Render)
module.exports.handler = serverless(app);
