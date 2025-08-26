const { setTimeout }  = require('timers/promises');
const promises = require('fs/promises');
const { Application } = require('../../models/application');
const logger = require('../../utils/logger');

const INSTRUCTIONS = `
You are an insurance underwriter that uses the following 
underwriting rules to determine if you should approve a car insurance application: 
`;

const PROMPT = `
Evaluation this application using your underwriting rules. Your response should 
consist of two components: STATUS and REASONING. 
STATUS is either "APPROVED" or "REJECTED".
REASONING is a narrative on how you came to your decision.
Output your result in Markdown in the following format:

# Underwriting Decision
- Application ID: 
- STATUS: 
- REASONING:
`;

const MANUAL_PATH = './services/llm/manual.md';

async function getManual() {
    try {
        const contents = await promises.readFile(MANUAL_PATH, {encoding: 'utf-8'});
        return contents;
    } catch (err) {
        logger.error(err.message);
        return 'NO MANUAL FOUND';
    }
}

// --- OpenRouter (OpenAI-compatible) ---
async function askAI_openrouter(application) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + process.env.OPENAPI_KEY,
            "HTTP-Referer": "jdux",
            "X-Title": "jdux",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "openai/gpt-4.1-nano",
            "messages": [
                {
                    "role": "system",
                    "content": [
                        { "type": "text", "text": INSTRUCTIONS },
                        { "type": "text", "text": await getManual() }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": PROMPT },
                        { "type": "text", "text": JSON.stringify(application) }
                    ]
                }
            ]
        })
    });

    let data = await res.json();
    if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]) {
        logger.error('OpenRouter API error:', data);
        throw new Error('OpenRouter API did not return choices: ' + JSON.stringify(data));
    }
    return data.choices[0].message.content;
}

// --- WatsonX ---
async function askAI_watsonx(application) {
    const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
    const watsonxAIService = WatsonXAI.newInstance({
        version: '2024-05-31',
        serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
    });

    const messages = [
        {
            "role": "system",
            "content": [
                { "type": "text", "text": INSTRUCTIONS },
                { "type": "text", "text": await getManual() }
            ]
        },
        {
            "role": "user",
            "content": [
                { "type": "text", "text": PROMPT },
                { "type": "text", "text": JSON.stringify(application) }
            ]
        }
    ];

    const res = await watsonxAIService.textChat({
        modelId: 'ibm/granite-3-2b-instruct',
        projectId: process.env.WATSONX_AI_PROJECT_ID,
        maxTokens: 2048,
        messages,
    });

    let data = await res.result;
    if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]) {
        logger.error('watsonx API error:', data);
        throw new Error('watsonx API did not return choices: ' + JSON.stringify(data));
    }
    return data.choices[0].message.content;
}

// --- Main run function ---
async function run(applicationId) {
    try {
        const app = await Application.find(applicationId);
        if (!app) {
            throw new Error(`Application not found for underwriting: ${applicationId}`);
        }

        let res;
        if (process.env.LLM_API && process.env.LLM_API.toUpperCase() === 'WATSONX') {
            res = await askAI_watsonx(app);
        } else if (process.env.LLM_API && process.env.LLM_API.toUpperCase() === 'OPENAPI') {
            res = await askAI_openrouter(app);
        } else {
            // Default to OpenRouter if not set
            res = await askAI_openrouter(app);
        }

        logger.info(res);
        return {
            evaluation: res.includes("APPROVED") ? "APPROVED" : "REJECTED",
            reasoning: res
        };
    } catch (error) {
        logger.error('Underwriting run failed:', error);
        throw error; // Ensure Bull retries on failure
    }
}

module.exports = { run };