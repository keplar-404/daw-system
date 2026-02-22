/**
 * Converts a Tone.js / Web Audio API AudioBuffer into a downloadable WAV Blob.
 * Supports both mono and stereo and handles down-mixing if necessary.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result: Float32Array;
    if (numChannels === 2) {
        const channel0 = buffer.getChannelData(0);
        const channel1 = buffer.getChannelData(1);
        result = new Float32Array(channel0.length + channel1.length);
        let j = 0;
        for (let i = 0; i < channel0.length; i++) {
            result[j++] = channel0[i];
            result[j++] = channel1[i];
        }
    } else {
        result = buffer.getChannelData(0);
    }

    const dataLength = result.length * (bitDepth / 8);
    const bufferArray = new ArrayBuffer(44 + dataLength);
    const view = new DataView(bufferArray);

    const writeString = (v: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            v.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, result[i]));
        // Convert 32-bit float (-1 to 1) to 16-bit PCM integer
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: "audio/wav" });
}
