import { deobfuscateData } from './encryption';
import { Dish } from '@/types/dishes';
import { Pasta } from '@/types/pasta';
import { GameTypeId } from '@/config/games/types';
import debugLogger from './debugLogger';

interface EncryptedResponse {
  id?: number;
  tags?: string[];
  region?: string;
  _encrypted: string;
  _salt: string;
  _checksum?: string;
}

export function hasEncryptedFields(obj: any): obj is EncryptedResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj._encrypted === 'string' &&
    typeof obj._salt === 'string'
  );
}

export function decryptGameItem<T = Dish | Pasta>(
  response: unknown,
  gameTypeId: GameTypeId
): T | null {
  try {
    debugLogger.group('DECRYPTION', `Decrypting ${gameTypeId} item`);

    debugLogger.decryption('Raw API response structure', {
      isArray: Array.isArray(response),
      itemCount: Array.isArray(response) ? response.length : 1,
    });

    let encryptedData: unknown;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        debugLogger.error('Received empty array from API');
        debugLogger.groupEnd();
        return null;
      }
      encryptedData = response[0];
    } else {
      encryptedData = response;
    }

    const hasEncryption = hasEncryptedFields(encryptedData);

    debugLogger.decryption('Encrypted data structure', {
      hasEncryptedFields: hasEncryption,
      availableFields: Object.keys(encryptedData as any),
    });

    if (!hasEncryption) {
      debugLogger.decryption('⚠️ No encryption fields found, returning unencrypted', {
        fields: Object.keys(encryptedData as any),
      });
      debugLogger.groupEnd();
      return encryptedData as T;
    }

    debugLogger.decryption('Decrypting sensitive data', {
      encryptedLength: (encryptedData as EncryptedResponse)._encrypted.length,
      saltLength: (encryptedData as EncryptedResponse)._salt.length,
      hasChecksum: !!(encryptedData as EncryptedResponse)._checksum,
    });

    const decryptedData = deobfuscateData(
      (encryptedData as EncryptedResponse)._encrypted,
      (encryptedData as EncryptedResponse)._salt
    );

    debugLogger.decryption('Decryption result', {
      success: !!decryptedData,
      decryptedFields: decryptedData ? Object.keys(decryptedData) : [],
    });

    if (!decryptedData) {
      debugLogger.error('Failed to decrypt game item data');
      debugLogger.groupEnd();
      return null;
    }

    const completeItem = reconstructGameItem<T>(
      encryptedData as EncryptedResponse,
      decryptedData,
      gameTypeId
    );

    debugLogger.decryption('Item reconstruction complete', {
      id: (completeItem as any)?.id,
      hasAcceptableGuesses: !!(completeItem as any)?.acceptableGuesses,
      acceptableGuessesCount: (completeItem as any)?.acceptableGuesses?.length || 0,
      hasIngredients: !!(completeItem as any)?.ingredients,
    });

    debugLogger.groupEnd();

    return completeItem;
  } catch (error) {
    debugLogger.error('Error decrypting game item', error);
    debugLogger.groupEnd();
    return null;
  }
}

function reconstructGameItem<T>(
  publicData: EncryptedResponse,
  decryptedData: any,
  gameTypeId: GameTypeId
): T {
  const baseItem = {
    id: publicData.id,
    tags: publicData.tags,
    ...decryptedData,
  };

  if (gameTypeId === 'food-for-thought') {
    const dish = baseItem as Dish;
    if (dish.ingredients && dish.acceptableGuesses) {
      dish.ingredients = reorderIngredientsForGameplay(
        dish.ingredients,
        dish.acceptableGuesses
      );
    }
  }

  return baseItem as T;
}

function reorderIngredientsForGameplay(
  ingredients: string[],
  acceptableGuesses: string[]
): string[] {
  if (ingredients.length <= 3) {
    return ingredients;
  }

  const normalizedGuesses = acceptableGuesses.map((guess) =>
    guess.toLowerCase()
  );

  const problematicIngredients: string[] = [];
  const safeIngredients: string[] = [];

  ingredients.forEach((ingredient) => {
    const normalizedIngredient = ingredient.toLowerCase();
    const appearsInGuess = normalizedGuesses.some(
      (guess) =>
        guess.includes(normalizedIngredient) &&
        normalizedIngredient.length >= 4 &&
        normalizedIngredient.length / guess.length > 0.15
    );

    if (appearsInGuess) {
      problematicIngredients.push(ingredient);
    } else {
      safeIngredients.push(ingredient);
    }
  });

  if (problematicIngredients.length === 0) {
    return ingredients;
  }

  const reordered: string[] = [];
  const safesToAdd = Math.min(3, safeIngredients.length);
  reordered.push(...safeIngredients.slice(0, safesToAdd));

  const remainingSafe = safeIngredients.slice(safesToAdd);
  let safeIndex = 0;
  let problematicIndex = 0;

  while (reordered.length < ingredients.length) {
    if (
      reordered.length >= 3 &&
      reordered.length <= 4 &&
      problematicIndex < problematicIngredients.length
    ) {
      reordered.push(problematicIngredients[problematicIndex]);
      problematicIndex++;
    } else if (safeIndex < remainingSafe.length) {
      reordered.push(remainingSafe[safeIndex]);
      safeIndex++;
    } else if (problematicIndex < problematicIngredients.length) {
      reordered.push(problematicIngredients[problematicIndex]);
      problematicIndex++;
    }
  }

  return reordered;
}
