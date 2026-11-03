const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  planConnections,
  routeConnections,
  segmentClear,
  padded,
} = require("../atlas/web/connections.js");
const data = JSON.parse(
  fs.readFileSync(
    require("node:path").join(
      __dirname,
      "../atlas/examples/second-sole/atlas.json",
    ),
  ),
);
const edges = [
  ...data.edges,
  ...data.nodes.flatMap((n) =>
    n.contract.actions.filter((a) => a.to).map((a) => ({ ...a, from: n.id })),
  ),
];
const boxes = data.nodes.map((n) => {
  const g = data.groups.find((g) => g.id === n.group);
  return { ...n, x: g.x + n.x, y: g.y + n.y };
});

test("overview is a 14-link forward forest, with real actions and one parent per child", () => {
  const main = planConnections(data.nodes, edges);
  assert.equal(main.length, 14);
  assert.equal(new Set(main.map((e) => e.to)).size, 14);
  for (const e of main) {
    const a = data.nodes.find((n) => n.id === e.from),
      b = data.nodes.find((n) => n.id === e.to);
    assert.equal(a.group, b.group);
    assert.ok(a.y < b.y);
    assert.ok(!["return", "reference"].includes(e.edges[0].kind));
    assert.ok(edges.includes(e.edges[0]));
  }
  assert.ok(
    main.some((e) => e.from === "checkout" && e.to === "order-confirmed"),
  );
  assert.ok(!main.some((e) => e.from === "moodboard" || e.to === "home"));
});
test("selection preserves every relevant action, separates directions, and hides unrelated links", () => {
  for (const node of data.nodes) {
    const plan = planConnections(data.nodes, edges, node.id);
    assert.deepEqual(
      plan
        .flatMap((e) => e.edges)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      edges
        .filter((e) => e.from === node.id || e.to === node.id)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    );
    assert.ok(plan.every((e) => e.from === node.id || e.to === node.id));
  }
  const actions = planConnections(data.nodes, edges, "listing-actions");
  const dismissal = actions.find((e) => e.to === "my-listings");
  assert.equal(dismissal.edges.length, 4);
  assert.ok(
    actions.some(
      (e) =>
        e.from === "my-listings" &&
        e.to === "listing-actions" &&
        e.mode === "incoming",
    ),
  );
  assert.ok(dismissal.mode === "outgoing");
});
test("every shipped overview and selected route is orthogonal and avoids every card and title", () => {
  for (const selected of [null, ...data.nodes.map((n) => n.id)]) {
    for (const mode of ["all", "outgoing", "incoming"]) {
      const plan = planConnections(data.nodes, edges, selected).filter(
        (e) => !selected || mode === "all" || e.mode === mode,
      );
      const routed = routeConnections(plan, boxes);
      assert.equal(routed.length, plan.length);
      for (const edge of routed) {
        assert.ok(
          edge.points,
          `${selected}/${mode}: missing ${edge.from} → ${edge.to}`,
        );
        for (let i = 1; i < edge.points.length; i++) {
          const a = edge.points[i - 1],
            b = edge.points[i];
          assert.ok(a[0] === b[0] || a[1] === b[1]);
          assert.ok(
            segmentClear(a, b, boxes.map(padded)),
            `${selected}/${mode}: obstructed ${edge.from} → ${edge.to}`,
          );
        }
      }
    }
  }
});
test("opposing directions get distinct ports and routes", () => {
  const routes = routeConnections(
    planConnections(data.nodes, edges, "listing"),
    boxes,
  );
  const out = routes.find((e) => e.from === "listing" && e.to === "home");
  const incoming = routes.find((e) => e.from === "home" && e.to === "listing");
  assert.notDeepEqual(out.points, [...incoming.points].reverse());
  assert.notDeepEqual(out.points[0], incoming.points.at(-1));
});
test("hiding a screen removes its arrows without inventing bypass connections", () => {
  const plan = planConnections(data.nodes, edges);
  const routes = routeConnections(
    plan,
    boxes.filter((n) => n.id !== "checkout"),
  );
  assert.ok(!routes.some((e) => e.from === "checkout" || e.to === "checkout"));
  assert.ok(
    !routes.some((e) => e.from === "listing" && e.to === "order-confirmed"),
  );
  assert.equal(routes.length, 12);
});
test("cycles, self-links, references, and cross-group shortcuts stay out of main flow", () => {
  const nodes = [
    { id: "a", group: "x", x: 0, y: 0 },
    { id: "b", group: "x", x: 0, y: 600 },
    { id: "c", group: "y", x: 0, y: 1200 },
  ];
  const edges = [
    { from: "a", to: "b", label: "Continue", kind: "navigation" },
    { from: "b", to: "a", label: "Back", kind: "return" },
    { from: "b", to: "b", label: "Refresh", kind: "state" },
    { from: "a", to: "c", label: "Shortcut", kind: "navigation" },
    { from: "a", to: "b", label: "Reference", kind: "reference" },
  ];
  assert.equal(planConnections(nodes, edges).length, 1);
  assert.equal(
    planConnections(nodes, edges, "b").flatMap((e) => e.edges).length,
    4,
  );
  assert.ok(
    routeConnections(
      planConnections(nodes, edges, "b"),
      nodes.map((n) => ({ ...n, w: 220, h: 400 })),
    ).every((e) => e.points),
  );
});
