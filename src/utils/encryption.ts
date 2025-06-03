// Simple XOR encryption that works both server and client side
export function obfuscateData(data: any, salt: string): string {
  try {
    const key = salt + "food-for-thought-secret";
    const jsonString = JSON.stringify(data);

    let encrypted = "";
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      // XOR and ensure we get a valid character
      const encryptedChar = String.fromCharCode((charCode ^ keyCode) % 256);
      encrypted += encryptedChar;
    }

    // Convert to base64 for safe transport
    if (typeof Buffer !== "undefined") {
      // Node.js environment
      return Buffer.from(encrypted, "binary").toString("base64");
    } else {
      // Browser environment
      return btoa(encrypted);
    }
  } catch (error) {
    console.error("Obfuscation failed:", error);
    return "";
  }
}

// Generate a daily salt based on the date
export function getDailySalt(): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `fft-${today}`;
}

// Simple XOR decryption
export function deobfuscateData(obfuscatedData: string, salt: string): any {
  try {
    const key = salt + "food-for-thought-secret";

    // Decode from base64
    let encrypted: string;
    if (typeof Buffer !== "undefined") {
      // Node.js environment
      encrypted = Buffer.from(obfuscatedData, "base64").toString("binary");
    } else {
      // Browser environment
      encrypted = atob(obfuscatedData);
    }

    let decrypted = "";
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      // XOR back to get original character
      const decryptedChar = String.fromCharCode((charCode ^ keyCode) % 256);
      decrypted += decryptedChar;
    }

    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Deobfuscation failed:", error);
    return null;
  }
}

// Legacy function - keeping for backwards compatibility
export function deobfuscateAnswers(
  obfuscatedData: string,
  salt: string
): {
  name: string;
  country: string;
  acceptableGuesses: string[];
} | null {
  return deobfuscateData(obfuscatedData, salt);
}
