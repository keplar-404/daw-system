// Public API for the `daw` feature slice.
// Other features/pages should import from here, not from internal paths.

export { useDawStore } from "./store/dawStore";
export type {
  AutomationLane,
  AutomationNode,
  AutomationTarget,
  Clip,
  DawActions,
  DawState,
  DawStore,
  EQParams,
  DelayParams,
  MidiClip,
  NoteEvent,
  PluginInstance,
  PluginParams,
  PluginType,
  ReverbParams,
  Track,
} from "./types/daw.types";


