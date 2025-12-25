import { Pasta } from "@/types/pasta";
import { deobfuscateData } from "@/utils/encryption";
import { useQuery } from "@tanstack/react-query";

interface EncryptedPastaResponse {
  id: number;
  tags: string[];
  _encrypted: string;
  _salt: string;
  _checksum: string;
}

/**
 * Fetch daily pasta from API and decrypt
 */
export function useDailyPasta(date?: string) {
  return useQuery({
    queryKey: ["pasta", "daily", date],
    queryFn: async () => {
      const url = date ? `/api/pasta/daily?date=${date}` : "/api/pasta/daily";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch daily pasta");
      }

      const encryptedData: EncryptedPastaResponse = await response.json();

      // Decrypt the sensitive data
      const decryptedData = deobfuscateData(
        encryptedData._encrypted,
        encryptedData._salt
      );

      // Combine public and decrypted data
      const pasta: Pasta = {
        id: encryptedData.id,
        tags: encryptedData.tags,
        ...decryptedData,
      };

      return pasta;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 3,
  });
}

/**
 * Fetch today's pasta (convenience wrapper)
 */
export function useTodaysPasta() {
  return useDailyPasta();
}

/**
 * Fetch archived pasta for a specific date
 */
export function useArchivedPasta(date: string) {
  return useDailyPasta(date);
}
