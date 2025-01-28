const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = "AIzaSyDudhKZnbXSglit0bY0Z7KMC1zK8O0n7O0";

async function analyzeAdPerformance(csvData) {
    const adsData = csvData;

    // Summarize performance
    const keywordsAnalysis = adsData.map((ad) => ({
        keyword: ad?.matchedproduct,
        clicks: parseInt(ad?.clicks, 10) || 0,
        impressions: parseInt(ad?.impressions, 10) || 0,
        sales: parseFloat(ad?.sales) || 0,
        acos: parseFloat(ad?.acos) || 0,
        ctr:  parseInt(ad?.ctr) || 0,
    }));
    const prompt = `Analyze the following ad performance data:
    ${JSON.stringify(keywordsAnalysis, null, 2)}
    Provide a summary focusing on high-performing keywords (low ACOS, high CTR, high sales) and suggest improvements for underperforming keywords.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: prompt },
                        ],
                    },
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response?.data.candidates[0].content?.parts[0]?.text;
    } catch (error) {
        console.error('Error generating analysis:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { analyzeAdPerformance };
