export interface EncryptedApiResponse {
  id?: number;
  tags?: string[];
  region?: string;
  _encrypted: string;
  _salt: string;
  _checksum: string;
}

export function isEncryptedResponse(obj: unknown): obj is EncryptedApiResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_encrypted' in obj &&
    '_salt' in obj &&
    typeof (obj as any)._encrypted === 'string' &&
    typeof (obj as any)._salt === 'string'
  );
}
