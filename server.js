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
app.use(cors());
// File upload setup
const upload = multer({ dest: 'uploads/' });
function cleanObjectKeys(obj) {
    const cleanedObj = {};
    Object.keys(obj).forEach((key) => {
        let cleanedKey = key;
        cleanedKey = cleanedKey.replaceAll('"', '');
        cleanedKey = cleanedKey.replace(/\s+/g, '');
        cleanedKey = cleanedKey.toLowerCase().replace('(usd)', '');
        cleanedObj[cleanedKey] = obj[key];
    });
    return cleanedObj;
}
// Middleware
app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({ message: 'File uploaded successfully', filePath: req.file.path });
});


// Analyze endpoint
app.post('/analyze', async (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
    }

    try {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(cleanObjectKeys(data)))
            .on('end', async () => {
                const analysis = await analyzeAdPerformance(results);
                res.status(200).json(analysis);
            });
    } catch (error) {
        res.status(500).json({ error: 'Error analyzing file', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
module.exports.handler = serverless(app);