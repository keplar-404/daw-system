/**
 * Ambient module declaration for d3-scale v4.
 *
 * d3-scale v4 is an ESM-only package that bundles its own TypeScript
 * declarations in src/*.d.ts, but its package.json `exports` field does not
 * expose a `types` condition. TypeScript's `moduleResolution: "bundler"` then
 * falls back to the bare JS entry point and reports no types.
 *
 * This file provides the minimal types we use so the build stays clean
 * without downgrading d3-scale or changing moduleResolution globally.
 */
declare module "d3-scale" {
  /** A continuous linear scale. */
  export interface ScaleLinear<Range = number, Output = Range> {
    (value: number): Output;
    domain(domain: Iterable<number>): this;
    range(range: Iterable<Range>): this;
    invert(value: number): number;
    copy(): this;
  }

  /** Create a new linear scale with an empty domain and range. */
  export function scaleLinear<Range = number, Output = Range>(): ScaleLinear<
    Range,
    Output
  >;
}
