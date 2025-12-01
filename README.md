**The OpenRouter Rewrite Engine**


🚀 Overview

The OpenRouter Rewrite Engine is a powerful, lightweight Chrome extension designed to instantly elevate the professionalism of your writing across any webpage. By leveraging the flexibility and model access provided by the OpenRouter API, this tool allows users to select text, generate three distinct professional rewrite options, and instantly replace the original content with a single click.

This project is an excellent example of a modern, API-driven browser extension using a unified gateway for multiple large language models.


✨ Key Features

Floating Rewrite Button: A discreet "Rewrite" button appears automatically above the cursor whenever you select text.
Professional Tone: All AI suggestions are strictly constrained to a clear, professional tone, ideal for emails, reports, and academic work.
Three Rewriting Options: The user interface provides three distinct, high-quality rewrite suggestions to choose from.
Instant Text Replacement: Clicking any suggested option immediately replaces the original selected text in the DOM.
Unified API Backend: Uses a single OpenRouter API Key to access a wide range of powerful models (e.g., GPT-4o, Claude 3, Gemini 2.5 Flash), configured directly in the extension's settings page.
Secure Storage: API keys are stored locally within Chrome's secure storage.


⚙️ Installation & Setup

Clone the Repository: Download the project files.
Load Extension: Navigate to chrome://extensions/ in Chrome, enable Developer mode, and click Load unpacked. Select the project folder.
Configure API Key: Open the extension's Options page (via the extension icon) and enter your OpenRouter API Key and select your preferred model.


⚙️ Generic Guide for Implementing External AI APIs

Generic Guide for Implementing External AI APIs in background.jsThis guide outlines the general structure for integrating a third-party Language Model API directly into your Chrome Extension's background.js Service Worker.Note: Your current extension implementation uses the OpenRouter endpoint (https://openrouter.ai/api/v1/chat/completions) for all model calls. OpenRouter is generally preferred as it handles routing, authentication, and payload conversion for multiple models (including GPT, Claude, and Gemini) under a single, consistent API key and endpoint.Template for a Direct, Single-Provider API FunctionIf you ever need to bypass OpenRouter and integrate a new, proprietary AI service, you must define the following asynchronous function:/**
 * Calls a direct, external API endpoint to process and rewrite text.
 * * @param {string} text The original text to rewrite.
 * @param {string} tone The desired tone/style.
 * @param {string} apiKey The API key stored in extension storage.
 * @returns {Promise<string>} The response content (e.g., a JSON string).
 */
async function callProviderAPI(text, tone, apiKey) {
    // 1. Define the provider's specific API URL
    const API_URL = "YOUR_PROVIDER_ENDPOINT_HERE"; 
    
    // 2. Define the system/user prompts
    // (Ensure the system prompt requests the specific JSON structure your content script expects)
    const systemPrompt = `You are an expert rewriter. Generate exactly three distinct rewrite options. Respond ONLY with a JSON array: [{"text": "..."}, ...]`;
    const userQuery = `Original Text: "${text}" (Tone: ${tone})`;

    // 3. Define the provider's specific request payload (JSON body)
    const payload = {
        model: "provider-model-name", // Required model identifier
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        // Include any required provider-specific parameters (e.g., max_tokens, temperature)
    };

    // 4. Set up the fetch request with authentication
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // CRITICAL: Use the correct Authorization Header format (e.g., Bearer, x-api-key)
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorDetail}`);
    }

    const result = await response.json();
    
    // 5. Extract the raw JSON content based on the provider's response structure
    let responseContent = result.choices?.[0]?.message?.content; 
    
    if (responseContent) {
        return responseContent;
    }
    throw new Error("Provider response was successful but contained no readable text content.");
}
