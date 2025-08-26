const { setTimeout }  = require('timers/promises');
const promises = require('fs/promises');
const { Application } = require('../../models/application');
const logger = require('../../utils/logger');

const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
const watsonxAIService = WatsonXAI.newInstance({
  version: '2024-05-31',
  serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
});

const getImage = async (imagePath) => {
  logger.info(`[licenseService] Reading image from: ${imagePath}`);
  try {
    const imageBuffer = await promises.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const img = `data:image/jpeg;base64,${base64Image}`;
    logger.info(`[licenseService] Successfully read and encoded image.`);
    return img;
  } catch (err) {
    logger.error(`[licenseService] Error reading image: ${err.message}`);
    throw err;
  }
};

const INSTRUCTIONS=`
Analyze the provided image and extract the following information in JSON format:

- First Name
- Last Name
- Date of Birth (in YYYY-MM-DD format if possible, otherwise as written)
- License Number
- Issuing State (abbreviation, e.g., CA, TX, NY, FL)
- Expiry Date (in YYYY-MM-DD format if possible, otherwise as written)
- Address (Street, City, State, ZIP)
- License Type/Class (if identifiable, e.g., 'Class C', 'Learner Permit')

If any field is unclear, illegible, or not present, indicate that in the output (e.g., using null or 'Not Found').

Reply ONLY with JSON and no other pre- or post- text response.
`

async function askAI_openrouter(licensePhotoPath) {
  logger.info(`[licenseService] Calling OpenRouter with photo: ${licensePhotoPath}`);
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
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": INSTRUCTIONS
            },
            {
              "type": "image_url",
              "image_url": {
                "url": await getImage(licensePhotoPath)
              }
            }
          ]
        }
      ]
    })
  });

  let data = await res.json();
  logger.info(`[licenseService] OpenRouter raw response: ${JSON.stringify(data)}`);
  let jsonData = data.choices[0].message.content;
  try {
    const jsonMatch = jsonData.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonData = jsonMatch[1].replace('\"', '"').trim();
      jsonData = JSON.parse(jsonData);
    } else {
      jsonData = JSON.parse(jsonData);
    }
    logger.info(`[licenseService] Parsed OpenRouter JSON: ${JSON.stringify(jsonData, null, 2)}`);
    return jsonData;
  } catch (parseError) {
    logger.error("[licenseService] Parsing Error:", parseError.message);
    logger.error("[licenseService] Raw response was: " + jsonData);
  }
}

async function askAI_watsonx(licensePhotoPath) {
  logger.info(`[licenseService] Calling WatsonX with photo: ${licensePhotoPath}`);
  const messages = [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": INSTRUCTIONS
        },
        {
          "type": "image_url",
          "image_url": {
            "url": await getImage(licensePhotoPath)
          }
        }
      ]
    }
  ];

  const res = await watsonxAIService.textChat({
    modelId: 'meta-llama/llama-3-2-11b-vision-instruct',
    projectId: process.env.WATSONX_AI_PROJECT_ID,
    maxTokens: 20000,
    messages,
  });

  let data = await res.result;
  logger.info(`[licenseService] WatsonX raw response: ${JSON.stringify(data)}`);
  let jsonData = data.choices[0].message.content;
  try {
    const jsonMatch = jsonData.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonData = jsonMatch[1].replace('\"', '"').trim();
      jsonData = JSON.parse(jsonData);
    } else {
      jsonData = JSON.parse(jsonData);
    }
    logger.info(`[licenseService] Parsed WatsonX JSON: ${JSON.stringify(jsonData, null, 2)}`);
    return jsonData;
  } catch (parseError) {
    logger.error("[licenseService] Parsing Error:", parseError.message);
    logger.error("[licenseService] Raw response was: " + jsonData);
  }
}

async function MOCK_run(applicationId) {
  logger.info(`[licenseService] MOCK_run for application: ${applicationId}`);
  const data = {
    firstName: 'John',
    lastName: 'Doe',
    address: '100 Main Street',
    city: 'Anytown',
    state: 'XX',
    zipcode: '12345',
    issued: '01/01/2024',
    expires: '12/31/2027',
    DOB: '01/01/2000',
    id: '2207935'
  };

  const result = await setTimeout(5000, 'resolved');
  return result == 'resolved' ? data : null;
}

async function run(applicationId) {
  logger.info(`[licenseService] Starting license extraction for application: ${applicationId}`);
  const app = await Application.find(applicationId);

  let res;
  if (process.env.LLM_API && process.env.LLM_API.toUpperCase() === 'WATSONX') {
    res = await askAI_watsonx(app.userData.licensePhotoPath);
    logger.info(`[licenseService] Used WatsonX for extraction`);
  } else if (process.env.LLM_API && process.env.LLM_API.toUpperCase() === 'OPENAPI') {
    res = await askAI_openrouter(app.userData.licensePhotoPath);
    logger.info(`[licenseService] Used OpenAPI for extraction`);
  } else {
    res = await askAI_openrouter(app.userData.licensePhotoPath);
    logger.info(`[licenseService] Used OpenAPI (default) for extraction`);
  }
  logger.info(`[licenseService] Extraction result: ${JSON.stringify(res, null, 2)}`);
  return res;
}

module.exports = { run }