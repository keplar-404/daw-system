"use client";

import { useEffect, useState } from "react";
import { AudioEngine } from "../lib/audio-engine";

export function useVuMeter() {
    const [levels, setLevels] = useState<number[]>([0, 0]);

    useEffect(() => {
        const engine = AudioEngine.getInstance();
        if (!engine) return;

        let rafId: number;
        const update = () => {
            const currentLevels = engine.getVuLevels();
            setLevels(currentLevels);
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return levels;
}
