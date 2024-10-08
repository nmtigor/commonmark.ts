import { Clock } from "./system.js";
export interface SimulatedClock extends Clock {
  start(speed: number): void;
  increment(ms: number): void;
  set(ms: number): void;
}
export declare class SimulatedClock implements SimulatedClock {
  private timeouts;
  private _now;
  private _id;
  private _flushing;
  private _flushingInvalidated;
  now(): number;
  private getId;
  setTimeout(fn: (...args: any[]) => void, timeout: number): number;
  clearTimeout(id: number): void;
  private flushTimeouts;
}
