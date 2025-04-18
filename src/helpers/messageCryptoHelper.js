import CryptoJS from 'crypto-js';

export function decryptMessage(encryptedContent, chatId) {
    const key = chatId;
    const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
}

export function encryptMessage(content, chatId) {
    const key = chatId;
    const encrypted = CryptoJS.AES.encrypt(content, key).toString();
    return encrypted;
}
