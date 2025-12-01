/**
 * Calls the OpenRouter API to rewrite the text and requests 3 JSON options.
 * @param {string} text The original text to rewrite.
 * @param {string} tone The desired tone/style (always 'professional' now).
 * @param {string} apiKey The stored OpenRouter API key.
 * @param {string} modelName The specific model ID to use.
 * @returns {Promise<string>} The raw JSON string containing 3 rewrite options.
 */
async function callOpenRouterAPI(text, tone, apiKey, modelName) {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    // CRITICAL: The prompt is updated to explicitly request JSON output with 3 options.
    const systemPrompt = `You are an expert text rewriter. Your task is to take the user's text and rewrite it in a better, clearer format, strictly adhering to a professional tone. You MUST generate exactly three distinct rewrite options. Respond ONLY with a JSON array containing three objects, each with a 'text' field. Example: [{"text": "Option 1..."}, {"text": "Option 2..."}, {"text": "Option 3..."}]`;
    const userQuery = `Original Text to rewrite: "${text}"`;

    if (!apiKey) throw new Error("OpenRouter API Key is missing. Please check the extension settings.");
    if (!modelName) throw new Error("OpenRouter Model is not selected. Please check the extension settings.");

    const payload = {
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        temperature: 0.8, // Slightly higher temp for diverse options
    };

    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'Rewrite-Chrome-Extension', 
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const jsonContent = result.choices?.[0]?.message?.content?.trim();
                
                if (jsonContent) {
                    // Return the raw JSON string for the content script to parse
                    return jsonContent;
                }
                throw new Error("API response was successful but contained no text content.");
            }

            if (response.status === 429) {
                const delay = Math.pow(2, retries) * 1000;
                retries++;
                console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`API call failed with status: ${response.status}`);

        } catch (error) {
            console.error("OpenRouter API call failed:", error);
            if (retries === 0) break;
            retries = maxRetries;
        }
    }

    throw new Error("Failed to get rewritten text from OpenRouter after all retries.");
}


// --- Main Message Listener and Routing ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Only handle the request *from* the content script to fetch AI data
    if (request.action === 'requestRewrite') { 
        (async () => {
            try {
                const storage = await chrome.storage.local.get(['apiKey', 'modelName']);
                const apiKey = storage.apiKey;
                const modelName = storage.modelName; 

                if (!apiKey || !modelName) {
                    sendResponse({ success: false, error: "API Key or Model is missing. Please check the extension settings." });
                    return;
                }

                // Call API with hardcoded 'professional' tone
                const jsonOptions = await callOpenRouterAPI(request.text, 'professional', apiKey, modelName); 

                // Send the raw JSON string back
                sendResponse({ success: true, rewrittenText: jsonOptions });

            } catch (error) {
                console.error("Rewrite process error:", error.message);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true;
    }
});