// Public API for the `audio` feature slice.
// Other features/pages should import from here, not from internal paths.

export { AudioDropzone } from "./components/AudioDropzone";
export { useAudioUpload } from "./hooks/useAudioUpload";
export {
  getAudioBlob,
  removeAudioBlob,
  storeAudioFile,
} from "./services/audioStorage";
export {
  MAX_FILE_SIZE_BYTES,
  validateAudioBlob,
} from "./services/audioValidation";
export type {
  AudioFormat,
  AudioValidationError,
  AudioValidationResult,
} from "./types/audio.types";
export { isAudioValidationError } from "./types/audio.types";
