export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: string[] };
export interface Schema<T> { readonly name: string; parse(input: unknown): ValidationResult<T>; }
export type Infer<S> = S extends Schema<infer T> ? T : never;

export function object<T extends Record<string, Schema<unknown>>>(name: string, shape: T): Schema<{ [K in keyof T]: Infer<T[K]> }> {
  return { name, parse(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) return { ok: false, issues: [`${name} must be an object`] };
    const output: Record<string, unknown> = {}; const issues: string[] = [];
    for (const [key, schema] of Object.entries(shape)) {
      const result = schema.parse((input as Record<string, unknown>)[key]);
      if (result.ok) output[key] = result.value; else issues.push(...result.issues.map(issue => `${key}: ${issue}`));
    }
    return issues.length ? { ok: false, issues } : { ok: true, value: output as { [K in keyof T]: Infer<T[K]> } };
  }};
}
export const string = (name = "value"): Schema<string> => ({ name, parse: input => typeof input === "string" ? { ok: true, value: input } : { ok: false, issues: [`${name} must be a string`] } });
export const number = (name = "value"): Schema<number> => ({ name, parse: input => typeof input === "number" && Number.isFinite(input) ? { ok: true, value: input } : { ok: false, issues: [`${name} must be a finite number`] } });

export interface Endpoint<I, O> { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"; path: string; input: Schema<I>; output: Schema<O>; }
export function endpoint<I,O>(definition: Endpoint<I,O>): Endpoint<I,O> { return Object.freeze(definition); }

