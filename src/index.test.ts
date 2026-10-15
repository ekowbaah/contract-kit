import test from "node:test";
import assert from "node:assert/strict";
import { array, checkCompatibility, client, endpoint, mockTransport, number, object, openApi, string } from "./index.js";

test("validates a typed contract with path-aware issues", () => {
  const User = object("User", { id: number("id"), name: string("name") });
  assert.deepEqual(User.parse({ id: "7" }), {ok:false,issues:["id: id must be a finite number","name: name must be a string"]});
  assert.deepEqual(array(number()).parse([1,"no"]),{ok:false,issues:["[1]: value must be a finite number"]});
});
test("generates clients, mocks, and OpenAPI from one contract",async()=>{
  const input=object("lookup",{id:string("id")}); const output=object("user",{name:string("name")});
  const lookup=endpoint({method:"POST",path:"/users/lookup",input,output});
  const call=client(lookup,mockTransport({"POST /users/lookup":()=>({name:"Ada"})}));
  assert.deepEqual(await call({id:"1"}),{name:"Ada"});
  assert.equal((openApi({lookup}) as any).paths["/users/lookup"].post.operationId,"lookup");
});
test("flags breaking endpoint changes",()=>{
  const schema=string();
  const old={read:endpoint({method:"GET",path:"/v1/items",input:schema,output:schema})};
  const next={read:endpoint({method:"POST",path:"/v2/items",input:schema,output:schema})};
  assert.deepEqual(checkCompatibility(old,next),[{endpoint:"read",reason:"method or path changed"}]);
});
