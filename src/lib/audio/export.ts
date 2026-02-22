import type * as ToneType from "tone";
import type { DawState, Track, PluginParams } from "@/features/daw/types/daw.types";
import { pitchToName } from "@/features/piano-roll";
import { audioBufferToWav } from "./wavEncoder";

export interface ExportProgress {
    status: "building" | "rendering" | "encoding" | "done" | "error";
    progress: number;
    message?: string;
}

/**
 * Reconstructs the entire DAW graph inside a Tone.Offline context to render a WAV Blob.
 */
export async function exportProjectToWav(
    state: DawState,
    onProgress?: (info: ExportProgress) => void
): Promise<Blob> {
    // Dynamically import Tone so it doesn't break SSR
    const Tone = await import("tone");

    onProgress?.({ status: "building", progress: 0 });

    // 1. Calculate the total duration of the project
    let maxBeat = 0;
    for (const clip of state.clips) {
        maxBeat = Math.max(maxBeat, clip.startBeat + clip.durationBeats);
    }
    for (const clip of state.midiClips) {
        maxBeat = Math.max(maxBeat, clip.startBeat + clip.durationBeats);
    }

    // Add 4 extra seconds for reverb/delay tails to decay naturally.
    // We cannot use beat math for the tail because it's absolute time.
    const durationSec = (maxBeat * 60) / state.bpm + 4.0;

    if (durationSec <= 4.0 && state.clips.length === 0 && state.midiClips.length === 0) {
        throw new Error("Timeline is empty. Nothing to export.");
    }

    // 2. We use Tone.Offline to render.
    // Note: we fetch/load any external AudioBuffers *before* entering Tone.Offline if needed,
    // or we can await inside the callback since Tone >= 14 supports async Offline callbacks.
    onProgress?.({ status: "rendering", progress: 10 });

    const toneAudioBuffer = await Tone.Offline(async () => {
        // Set the overall project BPM
        Tone.getTransport().bpm.value = state.bpm;

        // Build the track channels and effects
        for (const track of state.tracks) {
            // Create channel
            const channel = new Tone.Channel({
                volume: track.volume,
                pan: track.pan,
                mute: track.muted,
            }).toDestination();

            // Connect effects if any
            let prevNode: ToneType.ToneAudioNode = channel;
            if (track.plugins) {
                for (const plugin of track.plugins) {
                    let node: ToneType.ToneAudioNode | null = null;

                    if (plugin.type === "reverb") {
                        const p = plugin.params as Extract<PluginParams, { type: "reverb" }>;
                        node = new Tone.Reverb({ decay: p.decay });
                        (node as any).wet.value = p.mix;
                    } else if (plugin.type === "delay") {
                        const p = plugin.params as Extract<PluginParams, { type: "delay" }>;
                        node = new Tone.FeedbackDelay({ delayTime: p.delayTime, feedback: p.feedback });
                        (node as any).wet.value = p.mix;
                    } else if (plugin.type === "eq") {
                        const p = plugin.params as Extract<PluginParams, { type: "eq" }>;
                        node = new Tone.EQ3({ low: p.low, mid: p.mid, high: p.high });
                    }

                    if (node) {
                        prevNode.disconnect();
                        prevNode.connect(node);
                        node.toDestination();
                        prevNode = node;
                    }
                }
            }

            // Schedule Instrument / MIDI clips
            if (track.trackKind === "instrument" || track.trackKind === undefined) {
                // Build a fresh synth for this track
                const synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
                }).connect(channel);

                // Find all MIDI clips for this track
                const trackMidiClips = state.midiClips.filter((c) => c.trackId === track.id);

                for (const clip of trackMidiClips) {
                    for (const note of clip.notes) {
                        // Absolute time scheduling works perfectly in Tone.Offline without needing Tone.Transport to start
                        const time = (note.startBeat * 60) / state.bpm;
                        const duration = (note.durationBeats * 60) / state.bpm;
                        synth.triggerAttackRelease(pitchToName(note.pitch), duration, time, note.velocity / 127);
                    }
                }
            }
            // Schedule Audio clips
            else if (track.trackKind === "audio") {
                const trackClips = state.clips.filter((c) => c.trackId === track.id);
                for (const clip of trackClips) {
                    if (clip.audioUrl) {
                        try {
                            const player = new Tone.Player({ url: clip.audioUrl }).connect(channel);
                            await player.load(clip.audioUrl);
                            const time = (clip.startBeat * 60) / state.bpm;
                            player.start(time);
                        } catch (err) {
                            console.warn(`Failed to bounce audio clip for track ${track.id}`, err);
                        }
                    }
                }
            }
        }

    }, durationSec, 2, 44100);

    onProgress?.({ status: "encoding", progress: 80 });

    // 3. Convert raw PCM AudioBuffer to WAV File Blob
    // toneAudioBuffer.get() returns the native AudioBuffer
    const nativeBuffer = toneAudioBuffer.get();
    if (!nativeBuffer) throw new Error("Failed to get native AudioBuffer from Tone.Offline");

    const wavBlob = audioBufferToWav(nativeBuffer);

    onProgress?.({ status: "done", progress: 100 });
    return wavBlob;
}
