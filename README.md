# Monolith

**Write a manifesto, a threat, or a love letter** and be assured that only those who you want to be able to read it will be able to read it. Monolith is a minimalist, client-side encrypted message-sharing platform; messages are stored **NOWHERE** and are encrypted with XOR-based symmetric encryption presented in the form of a URL. As long you have url, you have your message, forever.

## Overview

Monolith provides two encryption methods:
- **Link Encryption**: Generates a one-time URL containing both the encrypted message and decryption key
- **Scribe Encryption**: Password-based encryption where the recipient needs the shared password to decrypt

## Technical Stack

### Frontend
- Pure JavaScript (Vanilla JS)
- HTML5 & CSS3
- Canvas API for particle animation
- Marked.js for Markdown parsing
- Highlight.js for code syntax highlighting
- Inter Mono font family

### Encryption Implementation

#### Link Encryption
Uses a combination of:
1. Random key generation (32 characters)
2. XOR-based symmetric encryption
3. Base64 URL-safe encoding

#### Scribe Encryption
Implements:
1. Password hashing using a simple rolling hash function
2. Salt generation
3. XOR encryption with combined key

```javascript
// Password hashing algorithm
hash = password.split('').reduce((hash, char) => {
return ((hash << 5) - hash) + char.charCodeAt(0) | 0
}, 0).toString(36)
// Final encryption key
finalKey = hash + password
```
### URL Structure
Messages are shared via URL fragments (#) to ensure no server requests: https://monolith.ashwath.ch/#decrypt?data=<base64_encrypted_data>

The encrypted data contains:
- Encryption method
- Encrypted message
- Salt (for scribe method)
- Decryption key (for link method)

### Background Animation

The particle system uses HTML5 Canvas with the following characteristics:

- 314 particles (π × 100)
- Each particle has:
  - Random size: 0.5-2px
  - Variable speed: ±0.5px per frame
  - Pulsing opacity: base opacity (0.2-0.6) + sin wave modulation (±0.15)
  - Random initial position
  - Continuous boundary wrapping
```javascript
opacity = baseOpacity + Math.sin(time + pulseOffset) * 0.15;
position += velocity * deltaTime;
```
## Security Considerations

1. **Client-side Only**: All encryption/decryption happens in the browser
2. **No Storage**: Messages exist only in the URL
3. **XOR Encryption**: While not cryptographically secure, suitable for casual message sharing
4. **URL Fragments**: Server never sees encrypted data
5. **Password Handling**: Passwords never transmitted or stored

## Message Flow

1. **Encryption**:
   - User enters message
   - Selects encryption method
   - Message is encrypted in browser
   - URL is generated containing encrypted data

2. **Sharing**:
   - User shares generated URL
   - No server interaction occurs

3. **Decryption**:
   - Recipient opens URL
   - Browser extracts encrypted data from URL fragment
   - Message is decrypted client-side
   - Original message displayed

## Limitations

- URL length limitations (~2000-8000 characters depending on browser)
- No message persistence
- Simple XOR encryption (not for sensitive data)
- No forward secrecy

## License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT)  .

## Credits

Developed by [ashfelloff](https://github.com/ashfelloff)
