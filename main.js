// Encryption helper functions
function generateKey() {
    // Generate a random string key
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let key = '';
    for (let i = 0; i < 32; i++) {
        key += charset[Math.floor(Math.random() * charset.length)];
    }
    console.log('Generated new key:', key);
    return key;
}

async function encryptMessage(message, key) {
    // Simple substitution and XOR-based encryption
    const result = [];
    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const encrypted = charCode ^ keyChar;
        result.push(encrypted);
    }
    
    return {
        encrypted: result,
        iv: [] // Not needed for this simple encryption
    };
}

async function decryptMessage(encrypted, key) {
    // Reverse the encryption process
    const result = [];
    for (let i = 0; i < encrypted.length; i++) {
        const encryptedChar = encrypted[i];
        const keyChar = key.charCodeAt(i % key.length);
        const decrypted = encryptedChar ^ keyChar;
        result.push(String.fromCharCode(decrypted));
    }
    
    return result.join('');
}

// New encryption methods
async function encryptWithScribe(message, password) {
    // Create a key from the password using a simple hash
    const key = password.split('').reduce((hash, char) => {
        const charCode = char.charCodeAt(0);
        return ((hash << 5) - hash) + charCode | 0;
    }, 0).toString(36);
    
    const result = await encryptMessage(message, key + password);
    return {
        ...result,
        salt: key // Store the hash as salt
    };
}

// UI handling
let currentEncryptionMethod = 'link';

function initializeEncryptionOptions() {
    const options = document.querySelectorAll('.encryption-option');
    
    // Set default option
    const defaultOption = document.querySelector('[data-method="link"]');
    defaultOption.classList.add('active');
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            options.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            option.classList.add('active');
            // Update current method
            currentEncryptionMethod = option.dataset.method;
            
            // Show/hide relevant details sections
            document.querySelectorAll('.encryption-details').forEach(detail => {
                detail.classList.remove('active');
            });
            const details = document.getElementById(`${currentEncryptionMethod}-details`);
            if (details) {
                details.classList.add('active');
            }
        });
    });
}

async function handleEncrypt() {
    try {
        const messageInput = document.getElementById('message-input');
        const subjectInput = document.getElementById('subject-input');
        const message = messageInput.value;
        const subject = subjectInput.value || ''; // Use empty string if no subject
        
        if (!message) {
            alert('Please enter a message');
            return;
        }
        
        // Combine subject and message with a delimiter
        const fullMessage = JSON.stringify({
            subject: subject,
            content: message
        });
        
        let encryptedData;
        let shareUrl;
        
        switch (currentEncryptionMethod) {
            case 'link':
                const key = generateKey();
                encryptedData = await encryptMessage(fullMessage, key);
                shareUrl = generateShareUrl('link', encryptedData, key);
                
                // Debug logging
                console.log('Generated key:', key);
                console.log('Encrypted data:', encryptedData);
                console.log('Share URL:', shareUrl);
                
                document.getElementById('share-url').value = shareUrl;
                document.getElementById('share-section').style.display = 'block';
                break;
                
            case 'scribe':
                const modal = document.getElementById('password-modal');
                const confirmBtn = document.getElementById('confirm-password');
                const error = document.getElementById('password-error');
                
                modal.style.display = 'flex';
                document.getElementById('scribe-password').focus();

                const handleConfirm = async () => {
                    const password = document.getElementById('scribe-password').value;
                    const confirmPassword = document.getElementById('scribe-password-confirm').value;

                    if (!password || !confirmPassword) {
                        error.textContent = 'please enter both passwords';
                        return;
                    }

                    if (password !== confirmPassword) {
                        error.textContent = 'passwords do not match';
                        return;
                    }

                    try {
                        encryptedData = await encryptWithScribe(fullMessage, password);
                        shareUrl = generateShareUrl('scribe', encryptedData);
                        document.getElementById('share-url').value = shareUrl;
                        document.getElementById('share-section').style.display = 'block';
                        modal.style.display = 'none';
                        
                        // Clear the password fields
                        document.getElementById('scribe-password').value = '';
                        document.getElementById('scribe-password-confirm').value = '';
                        error.textContent = '';
                    } catch (err) {
                        error.textContent = 'encryption failed';
                    }
                };

                confirmBtn.onclick = handleConfirm;
                
                // Allow Enter key to confirm
                const handleKeyPress = (e) => {
                    if (e.key === 'Enter') {
                        handleConfirm();
                    }
                };
                
                document.getElementById('scribe-password').onkeypress = handleKeyPress;
                document.getElementById('scribe-password-confirm').onkeypress = handleKeyPress;
                break;
                
            default:
                alert('Please select an encryption method');
                return;
        }
    } catch (error) {
        console.error('Encryption error:', error);
        alert('Failed to encrypt message: ' + error.message);
    }
}

function generateShareUrl(method, encryptedData, key = null) {
    try {
        // Create the data object
        const data = {
            method,
            encrypted: encryptedData.encrypted
        };
        
        if (method === 'link' && key) {
            data.key = key;
        }
        if (method === 'scribe') {
            data.salt = encryptedData.salt;
        }
        
        // First convert to JSON, then to base64, then make URL safe
        const jsonString = JSON.stringify(data);
        const base64 = btoa(jsonString);
        const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        const baseUrl = window.location.href.split('#')[0];
        return `${baseUrl}#decrypt?data=${urlSafeBase64}`;
    } catch (error) {
        console.error('Error generating share URL:', error);
        throw new Error('Failed to generate share URL');
    }
}

// Add Markdown preview functionality
function updatePreview() {
    const input = document.getElementById('message-input').value;
    const preview = document.getElementById('preview');
    
    // Configure marked options
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });
    
    // Convert markdown to HTML
    preview.innerHTML = marked.parse(input);
}

// Update the init function
function init() {
    console.log('Initializing...');
    
    if (window.location.hash.startsWith('#decrypt')) {
        handleDecrypt();
    }
    
    initializeEncryptionOptions();
    
    // Add markdown preview
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('input', updatePreview);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = messageInput.selectionStart;
                const end = messageInput.selectionEnd;
                messageInput.value = messageInput.value.substring(0, start) + '    ' + messageInput.value.substring(end);
                messageInput.selectionStart = messageInput.selectionEnd = start + 4;
            }
        });
    }
    
    const encryptButton = document.getElementById('encrypt-button');
    if (encryptButton) {
        encryptButton.addEventListener('click', handleEncrypt);
        console.log('Encrypt button listener added');
    } else {
        console.error('Encrypt button not found');
    }
    
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const shareUrl = document.getElementById('share-url');
            shareUrl.select();
            document.execCommand('copy');
            
            // Show notification
            const notification = document.getElementById('notification');
            notification.classList.add('show');
            
            // Hide notification after 2 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 2000);
        });
    }
}

// Update handleDecrypt function
async function handleDecrypt() {
    try {
        // Get the hash part after #decrypt?
        const hashPart = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
        const urlSafeBase64 = new URLSearchParams(hashPart).get('data');
        
        if (!urlSafeBase64) {
            console.error('No data found in URL');
            return;
        }

        // Convert URL safe base64 back to regular base64
        const base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
        // Add back padding if needed
        const padding = base64.length % 4;
        const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
        
        // Decode base64 to JSON string, then parse
        const jsonString = atob(paddedBase64);
        const data = JSON.parse(jsonString);
        
        console.log('Decoded data:', data); // Debug log
        
        const { method } = data;
        let decrypted;

        const decryptSection = document.getElementById('decrypt-section');
        const encryptSection = document.getElementById('encrypt-section');
        const inputSection = document.getElementById('decrypt-input-section');
        
        decryptSection.style.display = 'block';
        encryptSection.style.display = 'none';

        switch (method) {
            case 'link':
                try {
                    if (!data.key || !data.encrypted) {
                        throw new Error('Missing key or encrypted data');
                    }
                    console.log('Decrypting with key:', data.key);
                    console.log('Encrypted data:', data.encrypted);
                    
                    // Hide password overlay for link method
                    const overlay = document.getElementById('password-overlay');
                    overlay.style.display = 'none';
                    
                    decrypted = await decryptMessage(data.encrypted, data.key);
                    console.log('Decrypted result:', decrypted);
                    
                    // Parse the decrypted JSON
                    const messageData = JSON.parse(decrypted);
                    const decryptedSubject = document.getElementById('decrypted-subject');
                    const decryptedMessage = document.getElementById('decrypted-message');
                    
                    // Display subject if it exists
                    if (messageData.subject) {
                        decryptedSubject.textContent = messageData.subject;
                        decryptedSubject.style.display = 'block';
                    } else {
                        decryptedSubject.style.display = 'none';
                    }
                    
                    // Display message content with markdown
                    if (typeof marked !== 'undefined') {
                        decryptedMessage.innerHTML = marked.parse(messageData.content);
                    } else {
                        decryptedMessage.textContent = messageData.content;
                    }
                    
                    // Show the decrypted content immediately
                    const content = document.getElementById('decrypted-content');
                    content.classList.add('revealed');

                    // Update the decryption success handling to show export button
                    document.querySelector('.export-container').classList.add('visible');
                } catch (error) {
                    console.error('Link decryption error:', error);
                    alert('Failed to decrypt link message: ' + error.message);
                }
                break;

            case 'scribe':
                const overlay = document.getElementById('password-overlay');
                const content = document.getElementById('decrypted-content');
                const passwordInput = document.getElementById('decrypt-password');

                // Show password overlay for scribe method
                overlay.style.display = 'flex';

                passwordInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                        const password = passwordInput.value;
                        if (!password) {
                            passwordInput.classList.add('error');
                            return;
                        }

                        try {
                            const key = password.split('').reduce((hash, char) => {
                                const charCode = char.charCodeAt(0);
                                return ((hash << 5) - hash) + charCode | 0;
                            }, 0).toString(36);
                            
                            decrypted = await decryptMessage(data.encrypted, key + password);
                            const messageData = JSON.parse(decrypted);
                            
                            const decryptedSubject = document.getElementById('decrypted-subject');
                            const decryptedMessage = document.getElementById('decrypted-message');
                            
                            if (messageData.subject) {
                                decryptedSubject.textContent = messageData.subject;
                                decryptedSubject.style.display = 'block';
                            } else {
                                decryptedSubject.style.display = 'none';
                            }
                            
                            if (typeof marked !== 'undefined') {
                                decryptedMessage.innerHTML = marked.parse(messageData.content);
                            } else {
                                decryptedMessage.textContent = messageData.content;
                            }

                            // Hide overlay and remove blur
                            overlay.classList.add('hidden');
                            content.classList.add('revealed');

                            // Update the decryption success handling to show export button
                            document.querySelector('.export-container').classList.add('visible');
                        } catch (error) {
                            console.error('Scribe decryption error:', error);
                            passwordInput.classList.add('error');
                            passwordInput.value = '';
                            setTimeout(() => passwordInput.classList.remove('error'), 500);
                        }
                    }
                });
                break;

            default:
                alert('Unknown encryption method');
                break;
        }
    } catch (error) {
        console.error('Decryption error:', error);
        alert('Failed to decrypt message. Error: ' + error.message);
    }
}

// Update the HTML to remove the RSA option
const rsaOption = document.querySelector('[data-method="rsa"]');
if (rsaOption) {
    rsaOption.remove();
}
const rsaDetails = document.getElementById('rsa-details');
if (rsaDetails) {
    rsaDetails.remove();
}

// Add export function
function exportToFile() {
    const subject = document.getElementById('decrypted-subject').textContent;
    const message = document.getElementById('decrypted-message').textContent;
    const content = `${subject}\n\n${message}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monolith-message.txt';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Make sure the init function is called after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
