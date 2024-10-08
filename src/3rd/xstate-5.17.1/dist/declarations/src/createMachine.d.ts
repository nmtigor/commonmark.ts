import { StateMachine } from "./StateMachine.js";
import { ResolvedStateMachineTypes, TODO } from "./types.js";
import {
  AnyActorRef,
  AnyEventObject,
  Cast,
  EventObject,
  InternalMachineImplementations,
  MachineConfig,
  MachineContext,
  MachineTypes,
  MetaObject,
  NonReducibleUnknown,
  ParameterizedObject,
  ProvidedActor,
  StateValue,
  ToChildren,
} from "./types.js";
/**
 * Creates a state machine (statechart) with the given configuration.
 *
 * The state machine represents the pure logic of a state machine actor.
 *
 * @example
 *
 * ```ts
 * import { createMachine } from 'xstate';
 *
 * const lightMachine = createMachine({
 *   id: 'light',
 *   initial: 'green',
 *   states: {
 *     green: {
 *       on: {
 *         TIMER: { target: 'yellow' }
 *       }
 *     },
 *     yellow: {
 *       on: {
 *         TIMER: { target: 'red' }
 *       }
 *     },
 *     red: {
 *       on: {
 *         TIMER: { target: 'green' }
 *       }
 *     }
 *   }
 * });
 *
 * const lightActor = createActor(lightMachine);
 * lightActor.start();
 *
 * lightActor.send({ type: 'TIMER' });
 * ```
 *
 * @param config The state machine configuration.
 * @param options DEPRECATED: use `setup({ ... })` or `machine.provide({ ... })`
 *   to provide machine implementations instead.
 */
export declare function createMachine<
  TContext extends MachineContext,
  TEvent extends AnyEventObject, // TODO: consider using a stricter `EventObject` here
  TActor extends ProvidedActor,
  TAction extends ParameterizedObject,
  TGuard extends ParameterizedObject,
  TDelay extends string,
  TTag extends string,
  TInput,
  TOutput extends NonReducibleUnknown,
  TEmitted extends EventObject,
  TMeta extends MetaObject,
  _ = any,
>(
  config:
    & {
      types?: MachineTypes<
        TContext,
        TEvent,
        TActor,
        TAction,
        TGuard,
        TDelay,
        TTag,
        TInput,
        TOutput,
        TEmitted,
        TMeta
      >;
      schemas?: unknown;
    }
    & MachineConfig<
      TContext,
      TEvent,
      TActor,
      TAction,
      TGuard,
      TDelay,
      TTag,
      TInput,
      TOutput,
      TEmitted,
      TMeta
    >,
  implementations?: InternalMachineImplementations<
    ResolvedStateMachineTypes<
      TContext,
      TEvent,
      TActor,
      TAction,
      TGuard,
      TDelay,
      TTag,
      TEmitted
    >
  >,
): StateMachine<
  TContext,
  TEvent,
  Cast<ToChildren<TActor>, Record<string, AnyActorRef | undefined>>,
  TActor,
  TAction,
  TGuard,
  TDelay,
  StateValue,
  TTag & string,
  TInput,
  TOutput,
  TEmitted,
  TMeta, // TMeta
  TODO
>;
