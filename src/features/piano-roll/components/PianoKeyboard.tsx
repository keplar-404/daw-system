"use client";

import { Layer, Rect, Text } from "react-konva";

import {
    KEYBOARD_WIDTH,
    NOTE_ROW_HEIGHT,
    PITCH_MAX,
    PITCH_MIN,
    isBlackKey,
    pitchToName,
} from "../types/piano-roll.types";

interface PianoKeyboardProps {
    /** Total visible height of the note grid (rows × NOTE_ROW_HEIGHT). */
    height: number;
}

const WHITE_KEY_COLOR = "#e8e8e8";
const BLACK_KEY_COLOR = "#1e1e1e";
const KEY_BORDER_COLOR = "#333333";
const LABEL_COLOR = "#555555";

/**
 * Konva Layer rendering the vertical piano keyboard strip.
 *
 * Renders one row per semitone from PITCH_MAX (top) to PITCH_MIN (bottom).
 * White keys fill the full KEYBOARD_WIDTH; black keys are narrower.
 * Note names are shown on C notes only.
 *
 * Rule 1 compliant — no audio engine imports.
 */
export function PianoKeyboard({ height: _height }: PianoKeyboardProps) {
    const rows: React.ReactNode[] = [];

    for (let pitch = PITCH_MAX; pitch >= PITCH_MIN; pitch--) {
        const row = PITCH_MAX - pitch;
        const y = row * NOTE_ROW_HEIGHT;
        const black = isBlackKey(pitch);
        const isC = pitch % 12 === 0;
        const name = isC ? pitchToName(pitch) : "";

        rows.push(
            <Rect
                key={`key-${pitch}`}
                x={black ? 0 : 0}
                y={y}
                width={black ? KEYBOARD_WIDTH * 0.65 : KEYBOARD_WIDTH}
                height={NOTE_ROW_HEIGHT}
                fill={black ? BLACK_KEY_COLOR : WHITE_KEY_COLOR}
                stroke={KEY_BORDER_COLOR}
                strokeWidth={0.5}
                listening={false}
            />,
        );

        if (isC) {
            rows.push(
                <Text
                    key={`label-${pitch}`}
                    x={2}
                    y={y + 1}
                    text={name}
                    fontSize={8}
                    fontFamily="monospace"
                    fill={LABEL_COLOR}
                    listening={false}
                />,
            );
        }
    }

    return <Layer>{rows}</Layer>;
}
