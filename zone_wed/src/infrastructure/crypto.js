// CAPA: Infraestructura
// Utilidades criptográficas con Web Crypto API (PBKDF2 + salt)

const ALGORITHM = 'SHA-256';
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuffer(hex) {
    if (!hex || hex.length % 2 !== 0) {
        return new Uint8Array(0).buffer;
    }

    const bytes = hex.match(/.{1,2}/g) ?? [];
    return new Uint8Array(bytes.map((byte) => parseInt(byte, 16))).buffer;
}

function getCrypto() {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        return crypto;
    }

    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
        return globalThis.crypto;
    }

    throw new Error('Web Crypto API no está disponible en este entorno.');
}

async function hashPassword(password, salt = null) {
    const cryptoApi = getCrypto();
    const encoder = new TextEncoder();
    const saltBuffer = salt ? hexToBuffer(salt) : cryptoApi.getRandomValues(new Uint8Array(SALT_LENGTH));
    const saltHex = bufferToHex(saltBuffer);

    const keyMaterial = await cryptoApi.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const hashBuffer = await cryptoApi.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: ITERATIONS,
            hash: ALGORITHM,
        },
        keyMaterial,
        256
    );

    const hashHex = bufferToHex(hashBuffer);
    return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, storedHash) {
    if (!password || !storedHash || typeof storedHash !== 'string') {
        return false;
    }

    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) {
        return false;
    }

    const newHash = await hashPassword(password, saltHex);
    return newHash === storedHash;
}

export const Crypto = {
    hashPassword,
    verifyPassword,
};

export default Crypto;
