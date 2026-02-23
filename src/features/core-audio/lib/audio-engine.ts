import * as Tone from "tone";

export class AudioEngine {
    private static instance: AudioEngine;
    public analyser: Tone.Analyser;
    private channels: Map<string, Tone.Channel> = new Map();
    private players: Map<string, Tone.Player> = new Map();
    private mic: Tone.UserMedia | null = null;
    private recorder: Tone.Recorder | null = null;
    private recordingStartTimestamp: number = 0;

    private constructor() {
        // Analyser for VU meter
        this.analyser = new Tone.Analyser("fft", 256);
        Tone.getDestination().connect(this.analyser);

        // Initialize Recorder
        this.recorder = new Tone.Recorder();
    }

    public static getInstance(): AudioEngine {
        if (typeof window === "undefined") return null as any;
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    public async scheduleBlock(trackId: string, block: any) {
        // block as AudioBlock
        const channel = this.getChannel(trackId);

        // Clean up existing player if any
        if (this.players.has(block.id)) {
            this.players.get(block.id)?.dispose();
        }

        const player = new Tone.Player(block.blobUrl).connect(channel);
        player.sync().start(block.startTime, block.offset, block.duration);
        this.players.set(block.id, player);

        await Tone.loaded();
    }

    public unscheduleBlock(blockId: string) {
        const player = this.players.get(blockId);
        if (player) {
            player.dispose();
            this.players.delete(blockId);
        }
    }

    public getChannel(trackId: string): Tone.Channel {
        if (!this.channels.has(trackId)) {
            const channel = new Tone.Channel().toDestination();
            this.channels.set(trackId, channel);
        }
        return this.channels.get(trackId)!;
    }

    public removeChannel(trackId: string) {
        const channel = this.channels.get(trackId);
        if (channel) {
            channel.dispose();
            this.channels.delete(trackId);
        }
    }

    public updateTrackControl(trackId: string, type: 'volume' | 'mute' | 'solo', value: any) {
        const channel = this.getChannel(trackId);
        if (type === 'volume') {
            // value in decimal 0-1
            channel.volume.value = 20 * Math.log10(Math.max(value, 0.001));
        } else if (type === 'mute') {
            channel.mute = value;
        } else if (type === 'solo') {
            channel.solo = value;
        }
    }

    public async resume() {
        if (Tone.getContext().state !== "running") {
            await Tone.start();
        }
    }

    public play() {
        this.resume().then(() => {
            Tone.getTransport().start();
        });
    }

    public pause() {
        Tone.getTransport().pause();
    }

    public stop() {
        Tone.getTransport().stop();
    }

    public seek(seconds: number) {
        Tone.getTransport().seconds = seconds;
    }

    public setBpm(bpm: number) {
        Tone.getTransport().bpm.value = bpm;
    }

    public setLoop(loop: boolean, start?: number, end?: number) {
        Tone.getTransport().loop = loop;
        if (start !== undefined) Tone.getTransport().loopStart = start;
        if (end !== undefined) Tone.getTransport().loopEnd = end;
    }

    public setTimeSignature(numerator: number) {
        // Tone.js uses numerator for its internal time signature logic
        Tone.getTransport().timeSignature = numerator;
    }

    public setVolume(db: number) {
        // Volume in decibels
        Tone.getDestination().volume.value = db;
    }

    public getSeconds(): number {
        return Tone.getTransport().seconds;
    }

    public getVuLevels(): number[] {
        const values = this.analyser.getValue() as Float32Array;
        // Simple peak detection or average for VU
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += Math.abs(values[i]);
        }
        const avg = sum / values.length;
        // Return 0-1 range roughly
        return [avg, avg]; // Mono-to-stereo mock
    }

    public async startRecording() {
        if (!this.mic) {
            this.mic = new Tone.UserMedia();
        }

        try {
            await this.mic.open();
            // Directly connect mic to recorder
            this.mic.connect(this.recorder!);
            this.recorder!.start();
            this.recordingStartTimestamp = Tone.getTransport().seconds;
        } catch (e) {
            console.error("Mic access denied", e);
            throw e;
        }
    }

    public async stopRecording(): Promise<{ blob: Blob; duration: number }> {
        if (!this.recorder) throw new Error("Recorder not initialized");

        const recording = await this.recorder.stop();
        const duration = Tone.getTransport().seconds - this.recordingStartTimestamp;
        // Close mic to release resources
        this.mic?.close();

        return { blob: recording, duration };
    }
}
