// Client-side deobfuscation
export function deobfuscateAnswers(
  obfuscatedData: string,
  salt: string
): {
  name: string;
  country: string;
  acceptableGuesses: string[];
} | null {
  try {
    const key = salt + "food-for-thought-secret";
    const data = Buffer.from(obfuscatedData, "base64").toString();

    let result = "";
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(char ^ keyChar);
    }

    return JSON.parse(result);
  } catch (error) {
    console.error("Deobfuscation failed:", error);
    return null;
  }
}
