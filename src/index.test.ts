import test from "node:test"; import assert from "node:assert/strict";
import { object, string, number, endpoint } from "./index.js";
test("validates a typed contract", () => {
  const User = object("User", { id: number("id"), name: string("name") });
  const result = User.parse({ id: 7, name: "Ada" });
  assert.equal(result.ok, true);
  assert.equal(endpoint({ method:"POST", path:"/users", input:User, output:User }).path, "/users");
});
test("returns path-aware issues", () => {
  const User = object("User", { id: number("id"), name: string("name") });
  const result = User.parse({ id: "7" });
  assert.deepEqual(result.ok ? [] : result.issues, ["id: id must be a finite number", "name: name must be a string"]);
});

