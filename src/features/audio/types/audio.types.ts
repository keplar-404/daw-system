/** Supported audio formats validated via binary magic numbers */
export type AudioFormat = "wav" | "mp3" | "ogg";

/** Returned by a successful validateAudioBlob call */
export interface AudioValidationResult {
  format: AudioFormat;
  sizeBytes: number;
}

/**
 * Strongly-typed error union thrown by validateAudioBlob.
 * Use `error.code` to discriminate.
 */
export type AudioValidationError =
  | {
      code: "SIZE_EXCEEDED";
      maxBytes: number;
      actualBytes: number;
      message: string;
    }
  | {
      code: "INVALID_FORMAT";
      detected: string;
      message: string;
    };

/** Type guard — narrows unknown to AudioValidationError */
export function isAudioValidationError(e: unknown): e is AudioValidationError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as AudioValidationError).code !== undefined
  );
}
