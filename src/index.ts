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
export const boolean = (name = "value"): Schema<boolean> => ({ name, parse: input => typeof input === "boolean" ? { ok: true, value: input } : { ok: false, issues: [`${name} must be a boolean`] } });
export const optional = <T>(schema: Schema<T>): Schema<T | undefined> => ({ name: `${schema.name}?`, parse: input => input === undefined ? { ok: true, value: undefined } : schema.parse(input) });
export const array = <T>(schema: Schema<T>, name = "value"): Schema<T[]> => ({ name, parse(input) {
  if (!Array.isArray(input)) return { ok: false, issues: [`${name} must be an array`] };
  const values:T[]=[]; const issues:string[]=[];
  input.forEach((item,index)=>{const result=schema.parse(item); if(result.ok) values.push(result.value); else issues.push(...result.issues.map(issue=>`[${index}]: ${issue}`));});
  return issues.length ? {ok:false,issues} : {ok:true,value:values};
}});
export const oneOf = <const T extends readonly string[]>(values:T,name="value"):Schema<T[number]> => ({name,parse:input=>typeof input==="string"&&values.includes(input)?{ok:true,value:input as T[number]}:{ok:false,issues:[`${name} must be one of ${values.join(", ")}`]}});

export interface Endpoint<I, O> { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"; path: string; input: Schema<I>; output: Schema<O>; }
export function endpoint<I,O>(definition: Endpoint<I,O>): Endpoint<I,O> { return Object.freeze(definition); }

export type Contract = Record<string, Endpoint<any, any>>;
export type CompatibilityIssue = { endpoint:string; reason:string };
export function checkCompatibility(previous:Contract,next:Contract):CompatibilityIssue[] {
  const issues:CompatibilityIssue[]=[];
  for(const [name,oldEndpoint] of Object.entries(previous)) {
    const current=next[name];
    if(!current) issues.push({endpoint:name,reason:"endpoint removed"});
    else if(current.method!==oldEndpoint.method||current.path!==oldEndpoint.path) issues.push({endpoint:name,reason:"method or path changed"});
  }
  return issues;
}
export function openApi(contract:Contract,{title="API",version="1.0.0"}={}):Record<string,unknown> {
  const paths:Record<string,unknown>={};
  for(const [operationId,item] of Object.entries(contract)) {
    const path=(paths[item.path]??{}) as Record<string,unknown>;
    path[item.method.toLowerCase()]={operationId,responses:{"200":{description:"Successful response"},"400":{description:"Contract validation failed"}}};
    paths[item.path]=path;
  }
  return {openapi:"3.1.0",info:{title,version},paths};
}
export type Transport=(request:{method:string;path:string;body:unknown})=>Promise<unknown>;
export function client<I,O>(item:Endpoint<I,O>,transport:Transport) {
  return async(input:I):Promise<O>=>{
    const validInput=item.input.parse(input); if(!validInput.ok) throw new Error(validInput.issues.join("; "));
    const response=await transport({method:item.method,path:item.path,body:validInput.value});
    const validOutput=item.output.parse(response); if(!validOutput.ok) throw new Error(`invalid server response: ${validOutput.issues.join("; ")}`);
    return validOutput.value;
  };
}
export function mockTransport(routes:Record<string,(body:unknown)=>unknown>):Transport {
  return async request=>{const handler=routes[`${request.method} ${request.path}`]; if(!handler) throw new Error(`unhandled route: ${request.method} ${request.path}`); return handler(request.body);};
}

