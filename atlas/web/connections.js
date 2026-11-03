/* Shared by the browser viewer and the dependency-free connection tests. */
(function (root) {
  "use strict";

  function planConnections(items, edges, selected = null) {
    const nodes = new Map(
      items.filter((n) => !n.retired).map((n) => [n.id, n]),
    );
    const valid = edges.filter((e) => nodes.has(e.from) && nodes.has(e.to));
    const bundles = new Map();
    if (selected) {
      for (const edge of valid) {
        if (edge.from !== selected && edge.to !== selected) continue;
        const id = JSON.stringify([edge.from, edge.to]);
        if (!bundles.has(id))
          bundles.set(id, {
            id,
            from: edge.from,
            to: edge.to,
            edges: [],
            mode: edge.from === selected ? "outgoing" : "incoming",
          });
        bundles.get(id).edges.push(edge);
      }
    } else {
      // One real, forward connection per child forms a forest. Return actions,
      // shortcuts between groups and reference links belong in selection mode.
      const parents = new Map();
      for (const edge of valid) {
        const a = nodes.get(edge.from),
          b = nodes.get(edge.to);
        if (
          a.group !== b.group ||
          a.id === b.id ||
          a.kind === "anchor" ||
          b.kind === "anchor" ||
          ["return", "reference", "proposal", "motion"].includes(edge.kind)
        )
          continue;
        if (a.y > b.y || (a.y === b.y && a.x >= b.x)) continue;
        const score =
          Math.max(0, b.y - a.y - (a.h || 420)) +
          Math.abs(b.x + (b.w || 240) / 2 - a.x - (a.w || 240) / 2) * 0.6;
        if (!parents.has(b.id) || score < parents.get(b.id).score)
          parents.set(b.id, { edge, score });
      }
      for (const { edge } of parents.values()) {
        const id = JSON.stringify([edge.from, edge.to]);
        bundles.set(id, {
          id,
          from: edge.from,
          to: edge.to,
          edges: [edge],
          mode: "main",
        });
      }
    }
    return [...bundles.values()];
  }

  function compact(points) {
    const out = [];
    for (const p of points) {
      const b = out.at(-1),
        a = out.at(-2);
      if (b && b[0] === p[0] && b[1] === p[1]) continue;
      if (
        a &&
        ((a[0] === b[0] && b[0] === p[0]) || (a[1] === b[1] && b[1] === p[1]))
      )
        out.pop();
      out.push(p);
    }
    return out;
  }
  const padded = (b) => ({
    x: b.x - 12,
    y: b.y - 40,
    w: b.w + 24,
    h: b.h + 54,
  });
  function segmentClear(a, b, boxes) {
    return !boxes.some((r) =>
      a[0] === b[0]
        ? a[0] > r.x &&
          a[0] < r.x + r.w &&
          Math.max(a[1], b[1]) > r.y &&
          Math.min(a[1], b[1]) < r.y + r.h
        : a[1] > r.y &&
          a[1] < r.y + r.h &&
          Math.max(a[0], b[0]) > r.x &&
          Math.min(a[0], b[0]) < r.x + r.w,
    );
  }
  const clear = (p, boxes) =>
    p.slice(1).every((b, i) => segmentClear(p[i], b, boxes));
  function length(p) {
    return p
      .slice(1)
      .reduce(
        (n, b, i) => n + Math.abs(p[i][0] - b[0]) + Math.abs(p[i][1] - b[1]),
        0,
      );
  }
  function overlapCost(points, previous) {
    let cost = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        vertical = a[0] === b[0];
      for (const path of previous)
        for (let j = 1; j < path.length; j++) {
          const c = path[j - 1],
            d = path[j];
          if (vertical !== (c[0] === d[0])) continue;
          const axis = vertical ? 1 : 0,
            fixed = 1 - axis;
          if (Math.abs(a[fixed] - c[fixed]) > 8) continue;
          cost +=
            Math.max(
              0,
              Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) -
                Math.max(
                  Math.min(a[axis], b[axis]),
                  Math.min(c[axis], d[axis]),
                ),
            ) * 5;
        }
    }
    return cost;
  }
  class Heap {
    constructor() {
      this.values = [];
    }
    push(value) {
      let i = this.values.length;
      this.values.push(value);
      while (i && this.values[(i - 1) >> 1].cost > value.cost) {
        this.values[i] = this.values[(i - 1) >> 1];
        i = (i - 1) >> 1;
      }
      this.values[i] = value;
    }
    pop() {
      const first = this.values[0],
        last = this.values.pop();
      if (this.values.length) {
        let i = 0;
        while (i * 2 + 1 < this.values.length) {
          let child = i * 2 + 1;
          if (
            child + 1 < this.values.length &&
            this.values[child + 1].cost < this.values[child].cost
          )
            child++;
          if (this.values[child].cost >= last.cost) break;
          this.values[i] = this.values[child];
          i = child;
        }
        this.values[i] = last;
      }
      return first;
    }
  }
  function detour(start, end, boxes) {
    // Sparse visibility grid, on obstacle boundaries rather than raster steps.
    const nearby = boxes.filter(
      (b) =>
        b.x + b.w >= Math.min(start[0], end[0]) - 600 &&
        b.x <= Math.max(start[0], end[0]) + 600 &&
        b.y + b.h >= Math.min(start[1], end[1]) - 600 &&
        b.y <= Math.max(start[1], end[1]) + 600,
    );
    const xs = [
      ...new Set([
        start[0],
        end[0],
        ...nearby.flatMap((b) => [b.x - 24, b.x + b.w + 24]),
      ]),
    ].sort((a, b) => a - b);
    const ys = [
      ...new Set([
        start[1],
        end[1],
        ...nearby.flatMap((b) => [b.y - 24, b.y + b.h + 24]),
      ]),
    ].sort((a, b) => a - b);
    if (xs.length * ys.length > 24000) return null;
    const key = (x, y) => y * xs.length + x;
    const s = [xs.indexOf(start[0]), ys.indexOf(start[1])],
      t = [xs.indexOf(end[0]), ys.indexOf(end[1])];
    const heap = new Heap(),
      distances = new Map([[key(...s), 0]]),
      before = new Map(),
      closed = new Set();
    heap.push({ p: s, cost: 0 });
    while (heap.values.length && closed.size < 12000) {
      const { p } = heap.pop(),
        id = key(...p);
      if (closed.has(id)) continue;
      if (id === key(...t)) {
        const path = [];
        for (let k = id; k !== undefined; k = before.get(k))
          path.push([xs[k % xs.length], ys[Math.floor(k / xs.length)]]);
        return compact(path.reverse());
      }
      closed.add(id);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const q = [p[0] + dx, p[1] + dy];
        if (q[0] < 0 || q[1] < 0 || q[0] >= xs.length || q[1] >= ys.length)
          continue;
        const a = [xs[p[0]], ys[p[1]]],
          b = [xs[q[0]], ys[q[1]]],
          next = key(...q);
        const distance = distances.get(id) + length([a, b]);
        if (
          closed.has(next) ||
          distance >= (distances.get(next) ?? Infinity) ||
          !segmentClear(a, b, boxes)
        )
          continue;
        distances.set(next, distance);
        before.set(next, id);
        heap.push({
          p: q,
          cost: distance + Math.abs(b[0] - end[0]) + Math.abs(b[1] - end[1]),
        });
      }
    }
    return null;
  }
  function routeConnections(plan, items) {
    const boxes = new Map(items.map((b) => [b.id, b])),
      obstacles = items.map(padded);
    const slots = new Map(),
      ports = new Map();
    const active = plan.filter((e) => boxes.has(e.from) && boxes.has(e.to));
    for (const edge of active) {
      const a = boxes.get(edge.from),
        b = boxes.get(edge.to);
      const dx = b.x + b.w / 2 - a.x - a.w / 2,
        dy = b.y + b.h / 2 - a.y - a.h / 2;
      const vertical =
        edge.mode === "main" ? b.y > a.y : Math.abs(dy) >= Math.abs(dx);
      const sides =
        a.id === b.id
          ? ["right", "top"]
          : vertical
            ? dy >= 0
              ? ["bottom", "top"]
              : ["top", "bottom"]
            : dx >= 0
              ? ["right", "left"]
              : ["left", "right"];
      [a, b].forEach((box, index) => {
        const side = sides[index],
          key = `${box.id}:${side}`;
        if (!slots.has(key)) slots.set(key, []);
        slots.get(key).push({ edge, box, side, index, other: index ? a : b });
      });
    }
    for (const endpoints of slots.values()) {
      endpoints.sort((a, b) => {
        const horizontal = ["top", "bottom"].includes(a.side);
        return (
          (horizontal ? a.other.x - b.other.x : a.other.y - b.other.y) ||
          a.edge.id.localeCompare(b.edge.id)
        );
      });
      endpoints.forEach((e, i) => {
        const r = padded(e.box),
          fraction = 0.2 + (0.6 * (i + 0.5)) / endpoints.length;
        const point =
          e.side === "top"
            ? [e.box.x + e.box.w * fraction, r.y]
            : e.side === "bottom"
              ? [e.box.x + e.box.w * fraction, r.y + r.h]
              : e.side === "left"
                ? [r.x, e.box.y + e.box.h * fraction]
                : [r.x + r.w, e.box.y + e.box.h * fraction];
        const vector = {
          top: [0, -1],
          bottom: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        }[e.side];
        let gap = 28;
        let stub = point.map((v, j) => v + vector[j] * gap);
        while (gap > 1 && !segmentClear(point, stub, obstacles)) {
          gap /= 2;
          stub = point.map((v, j) => v + vector[j] * gap);
        }
        ports.set(`${e.edge.id}:${e.index}`, { point, stub });
      });
    }
    const previous = [];
    return active.map((edge) => {
      const a = ports.get(`${edge.id}:0`),
        b = ports.get(`${edge.id}:1`);
      const s = a.stub,
        t = b.stub;
      let options = [
        compact([a.point, s, [s[0], t[1]], t, b.point]),
        compact([a.point, s, [t[0], s[1]], t, b.point]),
      ];
      const xs = [
        (s[0] + t[0]) / 2,
        s[0] - 40,
        s[0] + 40,
        t[0] - 40,
        t[0] + 40,
      ];
      const ys = [
        (s[1] + t[1]) / 2,
        s[1] - 40,
        s[1] + 40,
        t[1] - 40,
        t[1] + 40,
      ];
      if (!options.some((p) => clear(p, obstacles))) {
        for (const box of obstacles) {
          xs.push(box.x - 24, box.x + box.w + 24);
          ys.push(box.y - 24, box.y + box.h + 24);
        }
      }
      options.push(
        ...xs.map((x) =>
          compact([a.point, s, [x, s[1]], [x, t[1]], t, b.point]),
        ),
        ...ys.map((y) =>
          compact([a.point, s, [s[0], y], [t[0], y], t, b.point]),
        ),
      );
      options = options.filter((p) => clear(p, obstacles));
      options.sort(
        (a, b) =>
          length(a) +
          a.length * 24 +
          overlapCost(a, previous.slice(-80)) -
          (length(b) + b.length * 24 + overlapCost(b, previous.slice(-80))),
      );
      let points = options[0];
      if (!points) {
        const middle = detour(s, t, obstacles);
        if (middle) points = compact([a.point, ...middle, b.point]);
      }
      if (points) previous.push(points);
      return { ...edge, points: points || null };
    });
  }
  const api = { planConnections, routeConnections, segmentClear, padded };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ScreenAtlasConnections = api;
})(typeof window !== "undefined" ? window : globalThis);
