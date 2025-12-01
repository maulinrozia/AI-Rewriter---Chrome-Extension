document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('model-select');
    const allowedDomainsTextarea = document.getElementById('allowed-domains'); // Get the new textarea
    const saveButton = document.getElementById('save-button');
    const statusDiv = document.getElementById('status');

    // Function to display status messages
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = ''; // Clear previous classes
        statusDiv.classList.add(type);
        statusDiv.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // 1. Load saved settings on startup
    chrome.storage.local.get(['apiKey', 'modelName', 'allowedDomains'], (items) => {
        if (items.apiKey) {
            apiKeyInput.value = items.apiKey;
        }
        if (items.modelName) {
            modelSelect.value = items.modelName;
        } else {
             // Default to GPT-3.5 Turbo if no model is saved
             modelSelect.value = "openai/gpt-3.5-turbo";
        }
        // Load the saved domains
        if (items.allowedDomains) {
            allowedDomainsTextarea.value = items.allowedDomains;
        }
        showStatus('Settings loaded.', 'success');
    });

    // 2. Save settings when the button is clicked
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const modelName = modelSelect.value;
        const allowedDomains = allowedDomainsTextarea.value.trim(); // Get the domains content

        if (!apiKey) {
             showStatus('Please enter an OpenRouter API Key.', 'error');
             return;
        }
        
        if (!modelName) {
             showStatus('Please select an OpenRouter Model.', 'error');
             return;
        }

        chrome.storage.local.set({
            apiKey: apiKey,
            modelName: modelName,
            allowedDomains: allowedDomains // Save the domains content
        }, () => {
            showStatus(`Settings saved successfully! Model: ${modelName}`, 'success');
        });
    });
});
