// --- Floating Button and Modal UI Setup ---

// Create and inject the button and modal panel into the page body
function createFloatingUI() {
    // 1. Rewrite Button
    let button = document.createElement('button');
    button.id = 'rewrite-button';
    button.textContent = '✨ Rewrite';
    document.body.appendChild(button);

    // 2. Rewrite Panel (Modal)
    let panel = document.createElement('div');
    panel.id = 'rewrite-panel';
    panel.innerHTML = `
        <h3>Rewrite Suggestions</h3>
        <p class="tone-info">Tone: Professional (Fixed)</p>
        
        <div class="loader" id="rewrite-loader"></div>
        <div id="options-container" class="options-container">
            <!-- Options will be dynamically inserted here -->
        </div>

        <button id="close-panel">Close</button>
    `;
    document.body.appendChild(panel);

    return { button, panel };
}

const { button, panel } = createFloatingUI();
let selectedText = '';
let currentSelectionRange = null; 

// --- Core Selection Logic ---

// Function to store the original selection range
function getSelectionData() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        return {
            range: range.cloneRange(), // CRITICAL: Clone the range to preserve its state
            text: selection.toString().trim()
        };
    }
    return null;
}

// Show the floating button near the mouse pointer coordinates
function showButton(clientX, clientY) {
    if (selectedText.length < 5) {
        button.classList.remove('visible');
        return;
    }

    // Position the button approximately 45px above the mouse pointer
    const top = clientY + window.scrollY - 45; 
    // Position the button approximately centered relative to the pointer
    const left = clientX + window.scrollX - 25; 

    button.style.top = `${top}px`;
    button.style.left = `${left}px`;
    button.classList.add('visible');
}

// Hide the button
function hideButton() {
    button.classList.remove('visible');
}

// Store the selection and show the button on mouseup
document.addEventListener('mouseup', (event) => {
    const selectionData = getSelectionData();
    const clientX = event.clientX;
    const clientY = event.clientY;
    
    // Check if the click was on the button itself or inside the modal
    if (event.target === button || panel.contains(event.target)) {
        return;
    }

    if (selectionData && selectionData.text.length > 0) {
        selectedText = selectionData.text;
        currentSelectionRange = selectionData.range; // Store the cloned range
        showButton(clientX, clientY);
    } else {
        selectedText = '';
        currentSelectionRange = null;
        hideButton();
    }
});


// --- Modal & Replacement Logic ---

function showLoading() {
    document.getElementById('options-container').innerHTML = '';
    document.getElementById('rewrite-loader').style.display = 'block';
    panel.style.display = 'flex';
}

function displayOptions(options) {
    const container = document.getElementById('options-container');
    const loader = document.getElementById('rewrite-loader');

    loader.style.display = 'none';
    container.innerHTML = ''; // Clear previous content

    if (!Array.isArray(options) || options.length === 0) {
        container.innerHTML = `<p style="color: red;">Error: AI did not return valid options. Check API setup or model response format.</p>`;
        return;
    }

    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'rewrite-option';
        optionDiv.innerHTML = `<span class="option-label">Option ${index + 1}:</span> ${option.text}`;
        
        // Add click listener to replace the original text
        optionDiv.addEventListener('click', () => {
            replaceOriginalText(option.text);
        });

        container.appendChild(optionDiv);
    });
}

/**
 * Replaces the original selected text in the DOM with the new text.
 * @param {string} newText The text from the selected rewrite option.
 */
function replaceOriginalText(newText) {
    if (currentSelectionRange && newText) {
        try {
            const newNode = document.createTextNode(newText);
            
            // 1. Remove the original content
            currentSelectionRange.deleteContents();
            
            // 2. Insert the new text node where the old text was
            currentSelectionRange.insertNode(newNode);

            // 3. Clear selection and close panel (We explicitly clear here for cleanliness)
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(currentSelectionRange); // Optionally re-select the new text
            
            panel.style.display = 'none';
            
            // 4. Reset stored range/text
            selectedText = '';
            currentSelectionRange = null;

        } catch (e) {
            console.error("DOM replacement failed:", e);
            alert('Error replacing text. The page structure might prevent editing or the selection was invalid.');
        }
    } else {
        alert('Cannot replace text. The original text selection was lost or invalid. Please try selecting the text again.');
    }
}


// --- Event Listeners and Background Communication ---

// 1. Click the floating button to open the panel and start rewriting
button.addEventListener('click', () => {
    if (!selectedText) {
        alert("Please select text before using the 'Rewrite Text' button.");
        return;
    }

    // Show loading state and modal
    showLoading();
    hideButton(); // Hide floating button once panel is open

    // Send the rewrite request to the background service worker (tone is hardcoded 'professional')
    chrome.runtime.sendMessage({
        action: 'requestRewrite',
        text: selectedText,
        tone: 'professional' // Hardcoded tone
    }, (response) => {
        if (response.success) {
            // Parse the JSON response
            try {
                // Ensure we strip common markdown code blocks if the model wrapped the JSON
                const cleanJson = response.rewrittenText.replace(/^```json\s*|```\s*$/g, '').trim();

                const options = JSON.parse(cleanJson);
                displayOptions(options);
            } catch (e) {
                // Handle non-JSON or malformed response
                console.error("Failed to parse JSON response:", response.rewrittenText, e);
                // Display error message to user
                const errorMessage = `Error: AI returned invalid format. Please check the model. Full response: ${response.rewrittenText.substring(0, 100)}...`;
                document.getElementById('rewrite-loader').style.display = 'none';
                document.getElementById('options-container').innerHTML = `<p style="color: red;">${errorMessage}</p>`;
            }
        } else {
            // Handle API error
            document.getElementById('rewrite-loader').style.display = 'none';
            document.getElementById('options-container').innerHTML = `<p style="color: red;">API Error: ${response.error || 'Failed to get a response.'}</p>`;
        }
    });
});

// 2. Close the panel
document.getElementById('close-panel').addEventListener('click', () => {
    panel.style.display = 'none';
});