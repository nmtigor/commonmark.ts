import {
  AnyActorRef,
  AnyEventObject,
  AnyTransitionDefinition,
  Snapshot,
} from "./types.js";
export type InspectionEvent =
  | InspectedSnapshotEvent
  | InspectedEventEvent
  | InspectedActorEvent
  | InspectedMicrostepEvent
  | InspectedActionEvent;
interface BaseInspectionEventProperties {
  rootId: string;
  /**
   * The relevant actorRef for the inspection event.
   *
   * - For snapshot events, this is the `actorRef` of the snapshot.
   * - For event events, this is the target `actorRef` (recipient of event).
   * - For actor events, this is the `actorRef` of the registered actor.
   */
  actorRef: AnyActorRef;
}
export interface InspectedSnapshotEvent extends BaseInspectionEventProperties {
  type: "@xstate.snapshot";
  event: AnyEventObject;
  snapshot: Snapshot<unknown>;
}
interface InspectedMicrostepEvent extends BaseInspectionEventProperties {
  type: "@xstate.microstep";
  event: AnyEventObject;
  snapshot: Snapshot<unknown>;
  _transitions: AnyTransitionDefinition[];
}
export interface InspectedActionEvent extends BaseInspectionEventProperties {
  type: "@xstate.action";
  action: {
    type: string;
    params: Record<string, unknown>;
  };
}
export interface InspectedEventEvent extends BaseInspectionEventProperties {
  type: "@xstate.event";
  sourceRef: AnyActorRef | undefined;
  event: AnyEventObject;
}
export interface InspectedActorEvent extends BaseInspectionEventProperties {
  type: "@xstate.actor";
}
export {};
