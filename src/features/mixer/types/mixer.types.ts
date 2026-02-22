/**
 * Mixer feature — re-exports plugin types from daw.types
 * plus any mixer-specific view types.
 */
export type {
    DelayParams,
    EQParams,
    PluginInstance,
    PluginParams,
    PluginType,
    ReverbParams,
} from "@/features/daw/types/daw.types";

/** Display option for the effect type picker. */
export interface EffectOption {
    label: string;
    value: import("@/features/daw/types/daw.types").PluginType;
}
