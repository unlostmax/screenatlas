/* ScreenAtlas browser workbench. Project files and SQLite remain the authorities. */
(() => {
  "use strict";
  const ICONS = {
    search:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjExIiBjeT0iMTEiIHI9IjgiLz48bGluZSB4MT0iMjEiIHkxPSIyMSIgeDI9IjE2LjY1IiB5Mj0iMTYuNjUiLz48L3N2Zz4=",
    grid: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciLz48cmVjdCB4PSIxNCIgeT0iMyIgd2lkdGg9IjciIGhlaWdodD0iNyIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIvPjxyZWN0IHg9IjMiIHk9IjE0IiB3aWR0aD0iNyIgaGVpZ2h0PSI3Ii8+PC9zdmc+",
    "message-square":
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNWEyIDIgMCAwIDEtMiAySDdsLTQgNFY1YTIgMiAwIDAgMSAyLTJoMTRhMiAyIDAgMCAxIDIgMnoiLz48L3N2Zz4=",
    clock:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBvbHlsaW5lIHBvaW50cz0iMTIgNiAxMiAxMiAxNiAxNCIvPjwvc3ZnPg==",
    folder:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxOWEyIDIgMCAwIDEtMiAySDRhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJoNWwyIDNoOWEyIDIgMCAwIDEgMiAyeiIvPjwvc3ZnPg==",
    "chevron-down":
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ii8+PC9zdmc+",
    smartphone:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjUiIHk9IjIiIHdpZHRoPSIxNCIgaGVpZ2h0PSIyMCIgcng9IjIiIHJ5PSIyIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTgiIHgyPSIxMi4wMSIgeTI9IjE4Ii8+PC9zdmc+",
    plus: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSIxMiIgeTE9IjUiIHgyPSIxMiIgeTI9IjE5Ii8+PGxpbmUgeDE9IjUiIHkxPSIxMiIgeDI9IjE5IiB5Mj0iMTIiLz48L3N2Zz4=",
    minus:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSI1IiB5MT0iMTIiIHgyPSIxOSIgeTI9IjEyIi8+PC9zdmc+",
    crosshair:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PGxpbmUgeDE9IjIyIiB5MT0iMTIiIHgyPSIxOCIgeTI9IjEyIi8+PGxpbmUgeDE9IjYiIHkxPSIxMiIgeDI9IjIiIHkyPSIxMiIvPjxsaW5lIHgxPSIxMiIgeTE9IjYiIHgyPSIxMiIgeTI9IjIiLz48bGluZSB4MT0iMTIiIHkxPSIyMiIgeDI9IjEyIiB5Mj0iMTgiLz48L3N2Zz4=",
    "help-circle":
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTkuMDkgOWEzIDMgMCAwIDEgNS44MyAxYzAgMi0zIDMtMyAzIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMi4wMSIgeTI9IjE3Ii8+PC9zdmc+",
    x: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSIxOCIgeTE9IjYiIHgyPSI2IiB5Mj0iMTgiLz48bGluZSB4MT0iNiIgeTE9IjYiIHgyPSIxOCIgeTI9IjE4Ii8+PC9zdmc+",
    "arrow-up-right":
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSI3IiB5MT0iMTciIHgyPSIxNyIgeTI9IjciLz48cG9seWxpbmUgcG9pbnRzPSI3IDcgMTcgNyAxNyAxNyIvPjwvc3ZnPg==",
  };
  const displayTitle = (value) => value.replace(/\s*[·•]\s*/g, " / ");
  const groupTitle = (value) =>
    displayTitle(value).replace(/^\s*\d+\s*[/.-]\s*/, "");
  const icon = (name) => {
    const img = document.createElement("img");
    img.src = ICONS[name];
    img.className = "ui-icon";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    return img;
  };
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => el.replaceChildren(icon(el.dataset.icon)));
  document
    .querySelectorAll("button.close")
    .forEach((el) => el.replaceChildren(icon("x")));
  const $ = (id) => document.getElementById(id);
  const make = (tag, value, cls) => {
    const element = document.createElement(tag);
    if (value !== undefined && value !== null) element.textContent = value;
    if (cls) element.className = cls;
    return element;
  };
  const button = (label, action, cls) => {
    const element = make("button", label, cls);
    element.type = "button";
    if (action) element.addEventListener("click", action);
    return element;
  };
  const svg = (tag, attrs, parent) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) =>
      element.setAttribute(key, value),
    );
    if (parent) parent.append(element);
    return element;
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uuid = () => crypto.randomUUID();
  const date = (value) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Time unknown";
  const kinds = {
    screen: "Screen / state",
    anchor: "Visual anchor",
    frame: "Illustrative frame",
    sheet: "Contact sheet",
    gap: "Design gap",
    system: "External / system",
    hub: "Navigation hub",
  };
  const statusLabels = {
    open: "Open",
    in_progress: "In progress",
    ready: "Ready for review",
    resolved: "Resolved",
    pending: "Not reviewed",
    approved: "Appearance approved",
    changes_requested: "Changes requested",
  };
  const contractFields = {
    purpose: "Responsibility",
    entry: "Entry conditions",
    data: "Data & content",
    states: "States",
    edgeCases: "Edge cases & recovery",
    accessibility: "Accessibility & motion",
    acceptance: "Acceptance examples",
  };
  let state,
    signature = "",
    selected = null,
    connectionDirection = "outgoing",
    enabled = new Set(),
    knownGroups = new Set(),
    hiddenNodes = new Set(),
    collapsedGroups = new Set(),
    initialized = false,
    connected = false;
  let nodes = new Map(),
    groups = new Map(),
    cards = new Map(),
    edges = [],
    mainConnections = [],
    focusedConnection = null,
    edgeFrame = null,
    observer,
    layoutEdit = false;
  let camera = { x: 0, y: 0, scale: 0.7 },
    bounds = { x: 0, y: 0, w: 1800, h: 900 },
    pointer = null,
    gesture = null;
  let toastTimer,
    pollTimer,
    routeCache = new Map(),
    selectedThread = null;
  let editor = null,
    settings = null,
    commentDraft = null,
    view = null,
    imageBusy = false,
    uploadBusy = false;
  const captureDraftForms = new Map();
  const readonly = () => Boolean(state?.readonly);
  const key = (name) => `atlas:${state.project.id}:${name}`;
  function readDraft(name) {
    try {
      return JSON.parse(localStorage.getItem(key(name)));
    } catch {
      return null;
    }
  }
  function saveDraft(name, value) {
    try {
      value === null
        ? localStorage.removeItem(key(name))
        : localStorage.setItem(key(name), JSON.stringify(value));
    } catch {
      toast(
        "Browser draft storage is unavailable. Keep this page open until your work is saved.",
      );
    }
  }
  function toast(message, persistent = false) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    if (!persistent)
      toastTimer = setTimeout(() => {
        $("toast").hidden = true;
      }, 6500);
  }
  async function request(path, payload) {
    if (readonly())
      throw new Error(
        "This is a read-only export. Open the local project to make changes.",
      );
    const response = await fetch(path, {
      method: payload ? "POST" : "GET",
      cache: "no-store",
      headers: payload
        ? { "Content-Type": "application/json", "X-Atlas-Token": state?.token }
        : {},
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(payload?.entries ? 45000 : 15000),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || `ScreenAtlas returned ${response.status}`,
      );
    return result;
  }
  async function command(name, payload) {
    return request(`/api/commands/${name}`, payload);
  }
  async function projectSave(project, etag) {
    if (readonly()) throw new Error("Read-only export");
    const result = await request("/api/project", { project, etag });
    await refresh();
    return result;
  }
  function imageURL(hash) {
    return hash ? state.images?.[hash] || `/api/images/${hash}.png` : "";
  }
  function designState(id) {
    return state.designStates.find((item) => item.node_id === id);
  }
  function version(id) {
    return state.versions.find((item) => item.id === id);
  }
  function capture(id) {
    return state.captures.find((item) => item.id === id);
  }
  function latestCapture(id) {
    return state.captures.find((item) => item.node_id === id);
  }
  function designFor(id) {
    const node = nodes.get(id),
      review = designState(id);
    const proposal = version(review?.proposed_id),
      accepted = version(review?.accepted_id);
    if (proposal)
      return {
        hash: proposal.sha256,
        label: "Proposed design",
        kind: "proposed",
        version: proposal,
      };
    if (accepted && node?.reference?.sha256 !== accepted.sha256)
      return {
        hash: accepted.sha256,
        label: "Accepted / not promoted",
        kind: "accepted",
        version: accepted,
      };
    if (node?.reference)
      return {
        hash: node.reference.sha256,
        label: "Curated reference",
        kind: "reference",
      };
    return { hash: null, label: "No reference yet", kind: "missing" };
  }
  function connections(project) {
    return project.edges.concat(
      project.nodes.flatMap((node) =>
        (node.contract.actions || [])
          .filter((action) => action.to)
          .map((action) => ({
            id: `action:${node.id}:${action.id}`,
            from: node.id,
            to: action.to,
            label: action.label,
            kind: action.kind || "navigation",
            actionId: action.id,
          })),
      ),
    );
  }
  function badge(label, cls = "") {
    return make("span", label, `badge ${cls}`);
  }
  function isVisible(node) {
    return Boolean(
      node &&
        !node.retired &&
        enabled.has(node.group) &&
        !hiddenNodes.has(node.id),
    );
  }
  function visibleNodes() {
    return [...nodes.values()].filter(isVisible);
  }
  function groupMembers(id) {
    return [...nodes.values()].filter(
      (node) => !node.retired && node.group === id,
    );
  }
  function saveVisibility() {
    saveDraft("canvas-visibility", {
      groups: [...enabled],
      knownGroups: [...knownGroups],
      hiddenNodes: [...hiddenNodes],
      collapsedGroups: [...collapsedGroups],
    });
  }
  function syncVisibilityURL() {
    if (readonly()) return;
    const url = new URL(location.href);
    url.searchParams.set("groups", [...enabled].join(","));
    url.hash = selected
      ? new URLSearchParams({ screen: selected }).toString()
      : "";
    history.replaceState(null, "", url);
  }
  function setNodeVisible(id, show) {
    const node = nodes.get(id);
    if (show) {
      if (!enabled.has(node.group)) {
        enabled.add(node.group);
        for (const sibling of groupMembers(node.group))
          hiddenNodes.add(sibling.id);
      }
      hiddenNodes.delete(id);
    } else hiddenNodes.add(id);
    setGroups();
  }
  function rect(node) {
    const group = groups.get(node.group);
    return {
      x: group.x + node.x,
      y: group.y + node.y,
      w: node.w || 240,
      h: node.h || 420,
    };
  }

  async function refresh() {
    try {
      const incoming = window.ATLAS_EXPORT || (await request("/api/state"));
      const next = JSON.stringify(incoming);
      connected = true;
      $("connection").textContent = incoming.readonly
        ? "Read-only project export"
        : "Saved locally";
      $("fatal").hidden = true;
      if (next === signature) return;
      const hadScreens = Boolean(
        state?.project.nodes.some((node) => !node.retired),
      );
      const firstLoad = !initialized;
      let newGroups = false;
      signature = next;
      state = incoming;
      nodes = new Map(state.project.nodes.map((node) => [node.id, node]));
      groups = new Map(state.project.groups.map((group) => [group.id, group]));
      edges = connections(state.project);
      mainConnections = ScreenAtlasConnections.planConnections(
        [...nodes.values()],
        edges,
      );
      routeCache.clear();
      if (!initialized) {
        const hash = new URLSearchParams(location.hash.slice(1));
        selected = nodes.has(hash.get("screen")) ? hash.get("screen") : null;
        const parameters = new URLSearchParams(location.search);
        const saved = readDraft("canvas-visibility");
        const savedGroups = parameters.has("groups")
          ? parameters.get("groups").split(",")
          : saved?.groups;
        enabled = new Set(
          Array.isArray(savedGroups)
            ? savedGroups.filter((id) => groups.has(id))
            : [...groups.keys()],
        );
        const staleFilter =
          parameters.has("groups") &&
          parameters.get("groups") !== "" &&
          savedGroups.every((id) => !groups.has(id));
        if (
          Array.isArray(saved?.knownGroups) &&
          (!parameters.has("groups") || staleFilter)
        ) {
          for (const id of groups.keys())
            if (!saved.knownGroups.includes(id)) {
              enabled.add(id);
              newGroups = true;
            }
        }
        hiddenNodes = new Set(
          (saved?.hiddenNodes || []).filter((id) => nodes.has(id)),
        );
        collapsedGroups = new Set(
          Array.isArray(saved?.collapsedGroups)
            ? saved.collapsedGroups
            : state.project.groups.map((group) => group.id),
        );
        if (selected && !isVisible(nodes.get(selected))) selected = null;
        initialized = true;
      } else {
        for (const id of groups.keys())
          if (!knownGroups.has(id)) {
            enabled.add(id);
            collapsedGroups.add(id);
            newGroups = true;
          }
      }
      knownGroups = new Set(groups.keys());
      enabled = new Set([...enabled].filter((id) => groups.has(id)));
      if (selected && (!nodes.has(selected) || nodes.get(selected).retired))
        selected = null;
      if (!readonly() && (firstLoad || newGroups)) saveVisibility();
      if (newGroups) syncVisibilityURL();
      render();
      if (!camera.fitted || (!hadScreens && visibleNodes().length)) {
        fit();
        camera.fitted = true;
      }
      if ($("image-dialog").open) renderImage();
      if (
        $("review-dialog").open &&
        !$("thread-detail").querySelector("textarea:focus")
      )
        renderReview();
      if ($("history-dialog").open) renderHistory();
    } catch (error) {
      connected = false;
      $("connection").textContent = "Disconnected; drafts kept";
      if (!state) {
        $("fatal-message").textContent = error.message;
        $("fatal").hidden = false;
      } else toast(`Could not refresh: ${error.message}`, true);
    }
  }
  function render() {
    const project = state.project;
    document.title = `${project.name} / ScreenAtlas`;
    $("project-name").textContent = project.name;
    renderInventory();
    const reviewCount = state.threads.filter(
      (thread) => thread.status !== "resolved",
    ).length;
    $("review-count").textContent = reviewCount;
    $("review-count").hidden = reviewCount === 0;
    for (const id of [
      "add-screen",
      "empty-add",
      "layout-toggle",
      "project-settings",
    ])
      $(id).disabled = readonly();
    renderSidebar();
    renderMap();
    renderInspector();
  }
  function renderInventory() {
    const live = [...nodes.values()].filter((node) => !node.retired);
    const shown = visibleNodes();
    const isBoard = (node) => node.kind === "anchor" || node.kind === "sheet";
    const boards = live.filter(isBoard).length;
    const shownBoards = shown.filter(isBoard).length;
    const count = (visible, total, noun) =>
      `${visible === total ? total : `${visible}/${total}`} ${noun}${total === 1 ? "" : "s"}`;
    const inventory = [
      count(shown.length - shownBoards, live.length - boards, "screen"),
    ];
    if (boards) inventory.push(count(shownBoards, boards, "board"));
    inventory.push(
      `${groups.size} ${groups.size === 1 ? "group" : "groups"}`,
      `${edges.length} connections`,
    );
    $("inventory").replaceChildren(
      ...inventory.map((text) => make("span", text)),
    );
  }
  function visibilityControl(label, action) {
    const wrapper = make("label", null, "visibility-control");
    const input = make("input");
    input.type = "checkbox";
    input.setAttribute("aria-label", label);
    input.addEventListener("change", () => action(input.checked));
    wrapper.append(input);
    return { wrapper, input };
  }
  function renderSidebar() {
    $("groups").replaceChildren();
    for (const group of state.project.groups) {
      const row = make("div", null, "group-row");
      row.dataset.group = group.id;
      const disclosure = button(
        "",
        () => {
          collapsedGroups.has(group.id)
            ? collapsedGroups.delete(group.id)
            : collapsedGroups.add(group.id);
          disclosure.setAttribute(
            "aria-expanded",
            String(!collapsedGroups.has(group.id)),
          );
          renderScreenList();
          saveVisibility();
        },
        "group-disclosure",
      );
      disclosure.append(icon("chevron-down"));
      disclosure.setAttribute(
        "aria-label",
        `Screens in ${groupTitle(group.title)}`,
      );
      disclosure.setAttribute(
        "aria-expanded",
        String(!collapsedGroups.has(group.id)),
      );
      const { wrapper, input } = visibilityControl(
        `Show ${groupTitle(group.title)} group`,
        (show) => {
          if (show) {
            enabled.add(group.id);
            for (const node of groupMembers(group.id))
              hiddenNodes.delete(node.id);
          } else enabled.delete(group.id);
          setGroups();
        },
      );
      input.dataset.groupVisibility = group.id;
      const focus = button("", () => fit(group), "group-focus");
      focus.setAttribute(
        "aria-label",
        `Focus ${groupTitle(group.title)} group`,
      );
      focus.title = "Focus this group on the canvas";
      focus.append(
        icon("grid"),
        make("span", groupTitle(group.title).replace(/ flow$/i, "")),
      );
      const list = make("nav", null, "group-screens");
      list.dataset.group = group.id;
      row.append(disclosure, wrapper, focus, list);
      $("groups").append(row);
    }
    renderScreenList();
  }
  function renderScreenList() {
    const query = $("search").value.toLowerCase().trim();
    $("screen-list").replaceChildren();
    const lists = new Map();
    document.querySelectorAll(".group-screens").forEach((list) => {
      list.replaceChildren();
      list.hidden = Boolean(query) || collapsedGroups.has(list.dataset.group);
      lists.set(list.dataset.group, list);
    });
    document.querySelector(".screen-list-heading").hidden = !query;
    const found = [...nodes.values()].filter(
      (node) =>
        !node.retired &&
        (!query ||
          `${node.title} ${node.id} ${node.platform} ${node.contract.purpose} ${node.contract.states}`
            .toLowerCase()
            .includes(query)),
    );
    $("screen-count").textContent = found.length;
    for (const node of found) {
      if (!query && collapsedGroups.has(node.group)) continue;
      const row = make("div", null, "screen-entry");
      row.dataset.node = node.id;
      const { wrapper, input } = visibilityControl(
        `Show ${displayTitle(node.title)} screen`,
        (show) => setNodeVisible(node.id, show),
      );
      input.dataset.nodeVisibility = node.id;
      const item = button("", () => {
        select(node.id);
        fit(rect(node));
      });
      item.append(icon("smartphone"), make("span", displayTitle(node.title)));
      row.append(wrapper, item);
      (query ? $("screen-list") : lists.get(node.group)).append(row);
    }
    if (query && !found.length)
      $("screen-list").append(make("p", "No matching screens.", "small-note"));
    updateSidebarVisibility();
  }
  function updateSidebarVisibility() {
    document.querySelectorAll(".group-row").forEach((row) => {
      const members = groupMembers(row.dataset.group),
        count = members.filter(isVisible).length;
      const input = row.querySelector("[data-group-visibility]");
      input.checked =
        enabled.has(row.dataset.group) && count === members.length;
      input.indeterminate = count > 0 && count < members.length;
      row.querySelector(".group-focus").disabled = count === 0;
      row.classList.toggle("inactive", count === 0);
    });
    document.querySelectorAll(".screen-entry").forEach((row) => {
      const node = nodes.get(row.dataset.node),
        visible = isVisible(node);
      row.querySelector("input").checked = visible;
      row.classList.toggle("inactive", !visible);
      row
        .querySelector("button")
        .setAttribute("aria-current", String(selected === node.id));
    });
  }
  function setGroups() {
    connectionFocus(null);
    saveVisibility();
    if (selected && !isVisible(nodes.get(selected))) selected = null;
    routeCache.clear();
    renderInventory();
    updateSidebarVisibility();
    renderMap(true);
    renderInspector();
    syncVisibilityURL();
  }
  function showAll() {
    enabled = new Set(groups.keys());
    hiddenNodes.clear();
    setGroups();
    fit();
  }
  function thumbnailURL(image) {
    const url = imageURL(image.dataset.hash);
    return !readonly() && image.dataset.retried
      ? `${url}?thumbnail-retry=1`
      : url;
  }
  function renderMap(preserveCards = false) {
    if (!preserveCards) {
      observer?.disconnect();
      cards.clear();
      $("cards").replaceChildren();
    } else {
      for (const [id, card] of cards) {
        if (isVisible(nodes.get(id))) continue;
        const image = card.querySelector("img.card-image");
        if (image) observer?.unobserve(image);
        card.remove();
        cards.delete(id);
      }
    }
    $("zones").replaceChildren();
    if (!preserveCards || !observer)
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const image = entry.target;
            if (!image.isConnected) continue;
            if (entry.isIntersecting && image.dataset.hash)
              image.src = thumbnailURL(image);
            else image.removeAttribute("src");
          }
        },
        { root: $("viewport"), rootMargin: "250px" },
      );
    const visibleGroupIds = new Set(visibleNodes().map((node) => node.group));
    const activeGroups = [...groups.values()].filter((group) =>
      visibleGroupIds.has(group.id),
    );
    for (const group of activeGroups) {
      const zone = make("div", null, "zone");
      Object.assign(zone.style, {
        left: `${group.x}px`,
        top: `${group.y}px`,
        width: `${group.w}px`,
        height: `${group.h}px`,
      });
      const title = make("div", null, "zone-title");
      title.append(icon("grid"), make("span", groupTitle(group.title)));
      zone.append(title);
      $("zones").append(zone);
    }
    const visible = visibleNodes();
    for (const node of visible) {
      if (preserveCards && cards.has(node.id)) {
        cards.get(node.id).classList.toggle("selected", node.id === selected);
        continue;
      }
      const box = rect(node),
        design = designFor(node.id),
        card = make(
          "article",
          null,
          `screen-card${node.id === selected ? " selected" : ""}`,
        );
      card.dataset.node = node.id;
      card.setAttribute(
        "aria-label",
        `${displayTitle(node.title)} / ${design.label}`,
      );
      Object.assign(card.style, {
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.w}px`,
        height: `${box.h}px`,
      });
      const heading = make("div", null, "card-heading");
      heading.append(make("h2", displayTitle(node.title)));
      card.append(heading);
      if (design.hash) {
        const image = make("img", null, "card-image");
        image.dataset.hash = design.hash;
        image.alt = displayTitle(node.title);
        image.decoding = "async";
        image.draggable = false;
        image.addEventListener("load", () => {
          image.alt = displayTitle(node.title);
        });
        image.addEventListener("error", () => {
          // An offscreen unload can cancel an in-flight image. Some browsers
          // retain that failed request; retry its local URL once on re-entry.
          if (!image.getAttribute("src")) return;
          if (!readonly() && !image.dataset.retried) {
            image.dataset.retried = "true";
            image.src = thumbnailURL(image);
            return;
          }
          image.alt = "Reference missing or unreadable";
        });
        observer.observe(image);
        card.append(image);
      } else {
        const blank = make("div", null, "card-empty");
        blank.append(
          icon(node.kind === "system" ? "arrow-up-right" : "smartphone"),
          make(
            "strong",
            node.kind === "system"
              ? "External surface"
              : "Room for a reference",
          ),
          make(
            "p",
            node.contract.purpose ||
              "Define this screen, then explore a visual direction with your agent.",
          ),
        );
        card.append(blank);
      }
      const latest = latestCapture(node.id),
        footer = make("div", null, "card-footer");
      footer.append(
        design.kind === "proposed" || design.kind === "accepted"
          ? badge(
              design.kind === "proposed"
                ? "Proposal to review"
                : "Accepted / local",
              design.kind,
            )
          : make(
              "span",
              latest
                ? latest.reference_changed
                  ? "Reference changed"
                  : statusLabels[latest.review.status]
                : node.kind === "frame"
                  ? "Illustrative / not motion proof"
                  : "",
            ),
      );
      footer.append(
        button("Inspect", (event) => {
          event.stopPropagation();
          openImage(node.id);
        }),
      );
      card.append(footer);
      card.addEventListener("click", (event) => {
        if (
          !gesture?.moved &&
          !event.target.closest("button") &&
          !card.dataset.justDragged
        )
          select(node.id);
      });
      card.addEventListener("dblclick", (event) => {
        if (!event.target.closest("button")) openImage(node.id);
      });
      $("cards").append(card);
      cards.set(node.id, card);
    }
    const hasScreens = [...nodes.values()].some((node) => !node.retired);
    $("empty-map").hidden = hasScreens || readonly();
    $("hidden-map").hidden = !hasScreens || visible.length > 0;
    const allBounds = activeGroups.concat(visible.map(rect));
    bounds = allBounds.length
      ? {
          x: Math.min(...allBounds.map((b) => b.x)) - 45,
          y: Math.min(...allBounds.map((b) => b.y)) - 60,
          w:
            Math.max(...allBounds.map((b) => b.x + b.w)) -
            Math.min(...allBounds.map((b) => b.x)) +
            90,
          h:
            Math.max(...allBounds.map((b) => b.y + b.h)) -
            Math.min(...allBounds.map((b) => b.y)) +
            110,
        }
      : { x: 0, y: 0, w: 1800, h: 900 };
    drawEdges();
    drawPins();
    drawMinimap();
    drawCamera();
  }

  function scheduleEdges() {
    if (!edgeFrame)
      edgeFrame = requestAnimationFrame(() => {
        edgeFrame = null;
        drawEdges();
      });
  }
  function connectionFocus(id) {
    focusedConnection = id;
    const drawn =
      id &&
      [...$("edges").querySelectorAll(".connection-route")].some(
        (el) => el.dataset.connection === id,
      );
    $("edges").classList.toggle("has-connection-focus", Boolean(drawn));
    for (const el of $("edges").querySelectorAll("[data-connection]"))
      el.classList.toggle("connection-hover", el.dataset.connection === id);
    const pair = id ? JSON.parse(id) : [];
    for (const [key, card] of cards)
      card.classList.toggle("connection-endpoint", pair.includes(key));
    const readout = $("connection-readout");
    readout.hidden = !id;
    if (id) {
      const labels = [
        ...new Set(
          edges
            .filter((e) => e.from === pair[0] && e.to === pair[1])
            .map((e) => e.label),
        ),
      ];
      readout.replaceChildren(
        make(
          "strong",
          `${displayTitle(nodes.get(pair[0]).title)} → ${displayTitle(nodes.get(pair[1]).title)}`,
        ),
        make("span", labels.join(" / ")),
      );
    }
  }
  function roundedPath(points) {
    let path = `M${points[0].join(" ")}`;
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1],
        b = points[i],
        c = points[i + 1];
      const radius = Math.min(
        14,
        Math.hypot(b[0] - a[0], b[1] - a[1]) / 2,
        Math.hypot(c[0] - b[0], c[1] - b[1]) / 2,
      );
      const near = (p) => {
        const distance = Math.hypot(p[0] - b[0], p[1] - b[1]);
        return b.map((v, j) => v + ((p[j] - v) * radius) / distance);
      };
      path += `L${near(a).join(" ")}Q${b.join(" ")} ${near(c).join(" ")}`;
    }
    return path + `L${points.at(-1).join(" ")}`;
  }
  function connectionLabel(edge) {
    const labels = [...new Set(edge.edges.map((e) => displayTitle(e.label)))];
    return labels[0] + (labels.length > 1 ? ` +${labels.length - 1}` : "");
  }
  function fitConnections() {
    if (!selected) return;
    const ids = new Set([selected]);
    for (const edge of ScreenAtlasConnections.planConnections(
      [...nodes.values()],
      edges,
      selected,
    ))
      if (connectionDirection === "all" || edge.mode === connectionDirection) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    const boxes = [...ids]
      .filter((id) => cards.has(id))
      .map((id) => rect(nodes.get(id)));
    const x = Math.min(...boxes.map((b) => b.x)) - 100,
      y = Math.min(...boxes.map((b) => b.y)) - 100;
    fit({
      x,
      y,
      w: Math.max(...boxes.map((b) => b.x + b.w)) - x + 100,
      h: Math.max(...boxes.map((b) => b.y + b.h)) - y + 100,
    });
  }
  function drawEdges() {
    if (!state) return;
    $("edges").replaceChildren();
    $("main-flow-label").hidden = Boolean(selected);
    $("connection-filters").hidden = !selected;
    $("fit-connections").hidden = !selected;
    for (const mode of ["outgoing", "incoming", "all"]) {
      const control = $(`connections-${mode}`);
      const relevant = edges.filter((e) =>
        mode === "outgoing"
          ? e.from === selected
          : mode === "incoming"
            ? e.to === selected
            : e.from === selected || e.to === selected,
      );
      const count = new Set(relevant.map((e) => JSON.stringify([e.from, e.to])))
        .size;
      control.textContent = `${mode === "all" ? "All" : mode === "outgoing" ? "Outgoing" : "Incoming"} (${count})`;
      control.setAttribute(
        "aria-pressed",
        String(connectionDirection === mode),
      );
    }
    const defs = svg("defs", {}, $("edges"));
    for (const [id, fill] of [
      ["main", "#a6a6b3"],
      ["outgoing", "#b1a5ff"],
      ["incoming", "#79c4c8"],
    ]) {
      const marker = svg(
        "marker",
        {
          id: `arrow-${id}`,
          viewBox: "0 0 10 10",
          refX: 9,
          refY: 5,
          markerWidth: 5,
          markerHeight: 5,
          orient: "auto",
        },
        defs,
      );
      svg("path", { d: "M0 0L10 5L0 10Z", fill }, marker);
    }
    const boxes = visibleNodes().map((n) => ({ ...rect(n), id: n.id }));
    const cacheKey = JSON.stringify([selected, connectionDirection]);
    if (!routeCache.has(cacheKey)) {
      const plan = selected
        ? ScreenAtlasConnections.planConnections(
            [...nodes.values()],
            edges,
            selected,
          )
        : mainConnections;
      routeCache.set(
        cacheKey,
        ScreenAtlasConnections.routeConnections(
          plan.filter(
            (e) =>
              !selected ||
              connectionDirection === "all" ||
              e.mode === connectionDirection,
          ),
          boxes,
        ),
      );
    }
    const routes = routeCache.get(cacheKey);
    const area = $("viewport").getBoundingClientRect(),
      scale = camera.scale;
    const viewBox = {
      x: -camera.x / scale,
      y: -camera.y / scale,
      w: area.width / scale,
      h: area.height / scale,
    };
    const labels = [],
      placed = [];
    const overlap = (a, b) =>
      a.x < b.x + b.w + 8 / scale &&
      a.x + a.w + 8 / scale > b.x &&
      a.y < b.y + b.h + 8 / scale &&
      a.y + a.h + 8 / scale > b.y;
    for (const edge of routes) {
      if (!edge.points) continue;
      const points = edge.points;
      const left = Math.min(...points.map((p) => p[0])),
        top = Math.min(...points.map((p) => p[1]));
      if (
        Math.max(...points.map((p) => p[0])) < viewBox.x ||
        left > viewBox.x + viewBox.w ||
        Math.max(...points.map((p) => p[1])) < viewBox.y ||
        top > viewBox.y + viewBox.h
      )
        continue;
      const group = svg(
        "g",
        {
          class: `connection-route ${edge.mode}`,
          "data-connection": edge.id,
          "data-from": edge.from,
          "data-to": edge.to,
          "data-count": edge.edges.length,
          "data-points": JSON.stringify(points),
        },
        $("edges"),
      );
      const explanation = edge.edges
        .map(
          (e) =>
            `${displayTitle(nodes.get(e.from).title)} → ${displayTitle(nodes.get(e.to).title)}: ${e.label}`,
        )
        .join("\n");
      svg("title", {}, group).textContent = explanation;
      svg("path", { class: "edge-hit", d: roundedPath(points) }, group);
      svg(
        "path",
        {
          class: "edge-path",
          d: roundedPath(points),
          "marker-end": `url(#arrow-${edge.mode})`,
        },
        group,
      );
      group.addEventListener("pointerenter", () => connectionFocus(edge.id));
      group.addEventListener("pointerleave", () => connectionFocus(null));
      if (!selected && scale < 0.32) continue;
      const text = connectionLabel(edge);
      const short = text.length > 52 ? `${text.slice(0, 49)}…` : text;
      const split =
        short.length > 26 ? Math.max(1, short.lastIndexOf(" ", 26)) : 0;
      const at = split === 1 ? 26 : split;
      const lines = at ? [short.slice(0, at), short.slice(at).trim()] : [short];
      const width = Math.min(
          240,
          Math.max(...lines.map((s) => s.length)) * 6.2 + 18,
        ),
        height = lines.length * 14 + 10;
      const size = { w: width / scale, h: height / scale };
      const candidates = points
        .slice(1)
        .flatMap((end, i) => {
          const start = points[i],
            length = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]);
          const vertical = end[0] === start[0];
          if (length < (vertical ? size.h : size.w) + 12 / scale) return [];
          return [0.5, 0.3, 0.7].map((f) => ({
            x: start[0] + (end[0] - start[0]) * f,
            y: start[1] + (end[1] - start[1]) * f,
            length,
          }));
        })
        .sort((a, b) => b.length - a.length);
      const position = candidates.find((p) => {
        const labelBox = { x: p.x - size.w / 2, y: p.y - size.h / 2, ...size };
        return (
          p.x > viewBox.x &&
          p.x < viewBox.x + viewBox.w &&
          p.y > viewBox.y &&
          p.y < viewBox.y + viewBox.h &&
          !boxes
            .map(ScreenAtlasConnections.padded)
            .concat(placed)
            .some((b) => overlap(labelBox, b))
        );
      });
      if (!position) continue;
      placed.push({
        x: position.x - size.w / 2,
        y: position.y - size.h / 2,
        ...size,
      });
      labels.push({ edge, position, width, height, lines, explanation });
    }
    for (const {
      edge,
      position,
      width,
      height,
      lines,
      explanation,
    } of labels) {
      const group = svg(
        "g",
        {
          class: `edge-label ${edge.mode}`,
          "data-connection": edge.id,
          transform: `translate(${position.x} ${position.y}) scale(${1 / scale})`,
        },
        $("edges"),
      );
      svg("title", {}, group).textContent = explanation;
      svg(
        "rect",
        { x: -width / 2, y: -height / 2, width, height, rx: 4 },
        group,
      );
      const text = svg("text", { x: 0, y: -(lines.length - 1) * 7 }, group);
      lines.forEach(
        (line, i) =>
          (svg("tspan", { x: 0, dy: i ? 14 : 0 }, text).textContent = line),
      );
      group.addEventListener("pointerenter", () => connectionFocus(edge.id));
      group.addEventListener("pointerleave", () => connectionFocus(null));
    }
    if (focusedConnection) connectionFocus(focusedConnection);
  }
  function select(id) {
    if (!nodes.has(id)) return;
    connectionFocus(null);
    if (selected !== id) connectionDirection = "outgoing";
    selected = id;
    if (!isVisible(nodes.get(id))) setNodeVisible(id, true);
    for (const [key, card] of cards)
      card.classList.toggle("selected", key === id);
    updateSidebarVisibility();
    renderInspector();
    drawEdges();
    drawMinimap();
    const url = new URL(location.href);
    url.hash = new URLSearchParams({ screen: id }).toString();
    history.replaceState(null, "", url);
  }
  function clearSelection() {
    connectionFocus(null);
    selected = null;
    for (const card of cards.values()) card.classList.remove("selected");
    renderInspector();
    updateSidebarVisibility();
    syncVisibilityURL();
    drawEdges();
    drawMinimap();
  }
  function drawCamera() {
    $("world").style.transform =
      `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    $("zoom-level").textContent = `${Math.round(camera.scale * 100)}%`;
    drawMinimapViewport();
    $("world").style.setProperty("--map-scale", camera.scale);
    scheduleEdges();
  }
  function fit(box = null) {
    const area = $("viewport").getBoundingClientRect(),
      target = box || bounds;
    camera.scale = Math.max(
      0.045,
      Math.min(
        box ? 1.3 : 1,
        Math.min((area.width - 100) / target.w, (area.height - 130) / target.h),
      ),
    );
    camera.x =
      (area.width - target.w * camera.scale) / 2 - target.x * camera.scale;
    camera.y =
      (area.height - target.h * camera.scale) / 2 - target.y * camera.scale + 8;
    drawCamera();
  }
  function zoom(factor, point = null) {
    const area = $("viewport").getBoundingClientRect(),
      p = point || { x: area.width / 2, y: area.height / 2 };
    const next = Math.max(0.045, Math.min(2.4, camera.scale * factor));
    camera.x = p.x - ((p.x - camera.x) * next) / camera.scale;
    camera.y = p.y - ((p.y - camera.y) * next) / camera.scale;
    camera.scale = next;
    drawCamera();
  }
  function drawMinimap() {
    const mini = $("minimap");
    mini.replaceChildren();
    mini.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`,
    );
    for (const node of visibleNodes()) {
      const b = rect(node);
      svg(
        "rect",
        {
          x: b.x,
          y: b.y,
          width: b.w,
          height: b.h,
          rx: 18,
          class: `mini-node${node.id === selected ? " selected" : ""}`,
        },
        mini,
      );
    }
    svg(
      "rect",
      {
        id: "mini-viewport",
        class: "mini-viewport",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
      mini,
    );
    drawMinimapViewport();
  }
  function drawMinimapViewport() {
    const area = $("viewport").getBoundingClientRect(),
      mini = $("mini-viewport");
    if (!mini) return;
    Object.entries({
      x: -camera.x / camera.scale,
      y: -camera.y / camera.scale,
      width: area.width / camera.scale,
      height: area.height / camera.scale,
    }).forEach(([key, value]) => mini.setAttribute(key, value));
  }

  function renderInspector() {
    const inspector = $("inspector"),
      node = nodes.get(selected);
    const expanded = new Set(
      inspector.dataset.node === node?.id
        ? [...inspector.querySelectorAll("details[open]")]
            .map((el) => el.className)
            .filter(Boolean)
        : [],
    );
    inspector.dataset.node = node?.id || "";
    inspector.hidden = !node;
    const previousForm = inspector.querySelector("#capture-form");
    if (previousForm?.dataset.dirty === "true")
      captureDraftForms.set(previousForm.dataset.node, previousForm);
    document.body.classList.toggle("has-selection", Boolean(node));
    inspector.replaceChildren();
    if (!node) return;
    const header = make("div", null, "inspector-heading"),
      close = button("", clearSelection, "close");
    close.append(icon("x"));
    close.setAttribute("aria-label", "Close screen details");
    header.append(make("h1", displayTitle(node.title)), close);
    inspector.append(
      header,
      make(
        "div",
        designFor(node.id).label === "Curated reference"
          ? "Reference"
          : designFor(node.id).label,
        "platform-label",
      ),
    );
    const design = designFor(node.id),
      preview = button("", () => openImage(node.id), "preview-box");
    if (design.hash) {
      const img = make("img");
      img.src = imageURL(design.hash);
      img.alt = displayTitle(node.title);
      preview.append(img);
    } else preview.append(make("span", "No visual reference yet", "no-image"));
    preview.setAttribute("aria-label", `Inspect ${displayTitle(node.title)}`);
    preview.classList.add("inspector-preview");
    const visual = make("details", null, "inspector-visual");
    visual.append(make("summary", "Preview"), preview);
    const actions = make("div", null, "button-row"),
      edit = button("Edit contract", () => openEditor(node.id)),
      feedback = button("Leave feedback", () =>
        beginComment({
          kind: "node",
          nodeId: node.id,
          imageSha256: design.hash,
          x: 0.5,
          y: 0.5,
        }),
      );
    edit.disabled = readonly();
    feedback.disabled = readonly() || !connected;
    actions.append(
      button("Inspect images", () => openImage(node.id), "primary"),
      edit,
      feedback,
    );

    if (design.kind === "proposed" || design.kind === "accepted")
      inspector.append(badge(design.label, design.kind));
    inspector.append(
      make(
        "p",
        node.contract.purpose ||
          "This screen's responsibility hasn't been described yet.",
      ),
    );
    const more = make("details", null, "inspector-more");
    more.append(make("summary", "More details"));
    const spec = make("details", null, "contract-details");
    spec.append(make("summary", "Contract details"));
    for (const [key, label] of Object.entries(contractFields).filter(
      ([key]) => key !== "purpose",
    )) {
      const detail = make("details"),
        summary = make("summary", label);
      detail.append(summary, make("p", node.contract[key] || "Unspecified"));
      spec.append(detail);
    }
    if (node.contract.actions.length) {
      const detail = make("details");
      detail.open = true;
      detail.append(make("summary", "Actions"));
      for (const action of node.contract.actions) {
        detail.append(
          make(
            "p",
            `${action.label}${action.to ? ` → ${displayTitle(nodes.get(action.to)?.title || action.to)}` : ""}${action.condition ? `\nWhen: ${action.condition}` : ""}${action.effect ? `\nEffect: ${action.effect}` : ""}`,
          ),
        );
      }
      spec.append(detail);
    }
    for (const id of node.contract.sources || []) {
      const doc = state.project.documents.find((doc) => doc.id === id);
      if (doc)
        spec.append(
          button(`${doc.title} ↗`, () => openDocument(doc), "source-link"),
        );
    }
    more.append(visual, spec);
    for (const [heading, outgoing] of [
      ["Outgoing", true],
      ["Incoming", false],
    ]) {
      const section = make(
        "details",
        null,
        `connection-details ${outgoing ? "outgoing" : "incoming"}`,
      );
      section.dataset.direction = outgoing ? "outgoing" : "incoming";
      section.open =
        connectionDirection === "all" ||
        connectionDirection === section.dataset.direction;
      const related = edges.filter(
        (edge) => (outgoing ? edge.from : edge.to) === node.id,
      );
      section.append(make("summary", `${heading} (${related.length})`));
      section.querySelector("summary").addEventListener("click", () => {
        if (section.open || connectionDirection === "all") return;
        connectionDirection = section.dataset.direction;
        connectionFocus(null);
        drawEdges();
        for (const other of inspector.querySelectorAll("[data-direction]"))
          if (other !== section) other.open = false;
      });
      for (const edge of related) {
        const target = nodes.get(outgoing ? edge.to : edge.from),
          item = button(
            edge.label,
            () => {
              select(target.id);
              fit(rect(target));
            },
            `connection-item ${outgoing ? "outgoing" : "incoming"}`,
          );
        item.append(
          make(
            "span",
            `${outgoing ? "To" : "From"} ${displayTitle(target.title)}${isVisible(target) ? "" : " (hidden)"}`,
          ),
        );
        const pair = JSON.stringify([edge.from, edge.to]);
        item.addEventListener("pointerenter", () => connectionFocus(pair));
        item.addEventListener("pointerleave", () => connectionFocus(null));
        item.addEventListener("focus", () => connectionFocus(pair));
        item.addEventListener("blur", () => connectionFocus(null));
        section.append(item);
      }
      if (!related.length) section.append(make("p", "No mapped connections."));
      inspector.append(section);
    }
    const localActions = node.contract.actions.filter((action) => !action.to);
    if (localActions.length) {
      const local = make("details", null, "connection-details");
      local.append(make("summary", "Local actions"));
      for (const action of localActions) {
        const item = button(
          action.label,
          () => openEditor(node.id),
          "connection-item",
        );
        item.disabled = readonly();
        local.append(item);
      }
      inspector.append(local);
    }
    inspector.append(actions, more);
    const section = make("details", null, "evidence-details");
    section.append(make("summary", "App screenshots"));
    const available = state.captures.filter((c) => c.node_id === node.id),
      latest = available[0];
    if (latest) {
      section.append(
        badge(statusLabels[latest.review.status], latest.review.status),
        make(
          "p",
          `${available.length} screenshot${available.length === 1 ? "" : "s"} / latest ${latest.state}\n${latest.device}\n${latest.build_revision ? `Build ${latest.build_revision}` : "Build identity unknown"}`,
        ),
      );
      if (latest.reference_changed)
        section.append(badge("Reference changed", "changed"));
      section.append(
        button("Compare screenshots", () => openImage(node.id, latest.id)),
      );
    } else section.append(make("p", "No app screenshots yet."));
    const add = make("details");
    add.append(make("summary", "Add an app screenshot"));
    const form = make("form", null, "capture-form");
    form.id = "capture-form";
    form.dataset.node = node.id;
    const fields = [
      ["file", "PNG screenshot", "file"],
      ["state", "Screen state", "text"],
      ["device", "Device & OS", "text"],
      ["buildRevision", "Build revision (optional)", "text"],
      ["capturedAt", "Captured at (optional)", "text"],
      ["note", "Notes & limitations", "text"],
    ];
    for (const [name, label, type] of fields) {
      const l = make("label", label),
        input = make("input");
      input.name = name;
      input.type = type;
      input.required = ["file", "state", "device"].includes(name);
      if (type === "file") input.accept = "image/png";
      else input.maxLength = name === "note" ? 4000 : 200;
      l.append(input);
      form.append(l);
    }
    const sourceLabel = make("label", "Source"),
      source = make("select");
    source.name = "source";
    source.append(
      new Option("Physical device", "device"),
      new Option("Simulator / browser", "simulator"),
      new Option("Historical archive", "archive"),
    );
    sourceLabel.append(source);
    form.append(sourceLabel);
    const save = make("button", "Save screenshot locally", "primary");
    save.type = "submit";
    save.disabled = readonly() || !connected || uploadBusy;
    form.append(save);
    const discardCapture = button("Discard screenshot draft", () => {
      captureDraftForms.delete(node.id);
      delete form.dataset.dirty;
      renderInspector();
    });
    discardCapture.disabled = readonly();
    form.append(discardCapture);
    const message = make("p", "", "error");
    form.append(message);
    let saveId = null,
      opId = null;
    form.addEventListener("input", () => {
      saveId = null;
      opId = null;
      form.dataset.dirty = "true";
      captureDraftForms.set(node.id, form);
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (uploadBusy) return;
      const values = new FormData(form),
        file = values.get("file");
      saveId ||= uuid();
      opId ||= uuid();
      uploadBusy = true;
      [...form.elements].forEach((el) => (el.disabled = true));
      message.textContent = "Saving…";
      try {
        const entry = {
          id: saveId,
          nodeId: node.id,
          referenceSha256: node.reference?.sha256 || null,
        };
        for (const key of [
          "state",
          "device",
          "buildRevision",
          "capturedAt",
          "note",
          "source",
        ])
          entry[key] = values.get(key);
        entry.png = await filePNG(file);
        await command("import-captures", {
          operationId: opId,
          entries: [entry],
        });
        uploadBusy = false;
        delete form.dataset.dirty;
        captureDraftForms.delete(node.id);
        await refresh();
        openImage(node.id, saveId);
        toast("Screenshot saved. It has its own appearance review.");
      } catch (error) {
        message.textContent = `Save not confirmed: ${error.message}. Retry keeps the same capture identity.`;
      } finally {
        uploadBusy = false;
        [...form.elements].forEach((el) => (el.disabled = false));
      }
    });
    const keptForm = captureDraftForms.get(node.id);
    if (keptForm) {
      add.open = true;
      section.open = true;
      more.open = true;
      add.append(keptForm);
    } else add.append(form);
    section.append(
      add,
      make(
        "p",
        "Appearance review does not prove behavior or release readiness.",
        "small-note",
      ),
    );
    more.append(section);
    const feedbackSection = make("details", null, "feedback-details");
    feedbackSection.append(make("summary", "Feedback"));
    const threads = state.threads.filter(
      (t) => t.node_id === node.id && t.status !== "resolved",
    );
    feedbackSection.append(
      make(
        "p",
        `${threads.length} active thread${threads.length === 1 ? "" : "s"}`,
      ),
      button("Open review", () => openReview(threads[0]?.id)),
    );
    more.append(feedbackSection);
    for (const el of inspector.querySelectorAll("details"))
      if (expanded.has(el.className)) el.open = true;
  }

  function field(form, name) {
    return form.elements.namedItem(name);
  }
  async function openGuide() {
    $("guide-dialog").showModal();
    $("copy-codex-prompt").disabled = true;
    $("handoff-status").textContent = "";
    $("codex-prompt").value = "";
    if (readonly()) {
      $("handoff-project").textContent = "This is a read-only export.";
      $("handoff-status").textContent =
        "Open the local project to copy its Codex setup prompt.";
      return;
    }
    $("handoff-project").textContent = "Preparing your project prompt…";
    try {
      const handoff = await request("/api/onboarding");
      $("codex-prompt").value = handoff.prompt;
      $("handoff-project").textContent =
        `For ${handoff.projectName}.${state.project.nodes.length ? " Continues this map; use Start a different project below for a new app." : " Send it as-is. Codex will ask about your app."}`;
      $("copy-codex-prompt").disabled = false;
    } catch (error) {
      $("handoff-project").textContent = "Could not load the project prompt.";
      $("handoff-status").textContent =
        `${error.message} Close this guide and try again.`;
    }
  }
  async function copyCodexPrompt() {
    try {
      await navigator.clipboard.writeText($("codex-prompt").value);
      $("handoff-status").textContent =
        "Copied. Paste into Codex and send. It will ask about your app and inspiration images.";
    } catch {
      $("codex-prompt").focus();
      $("codex-prompt").select();
      $("handoff-status").textContent =
        "Copy the selected prompt, paste into Codex, and send. It will guide you from there.";
    }
  }
  function blankContract() {
    return {
      ...Object.fromEntries(
        Object.keys(contractFields).map((key) => [key, ""]),
      ),
      actions: [],
      sources: [],
    };
  }
  function slug(value) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "screen"
    );
  }
  function openEditor(id = null) {
    if (readonly()) return;
    const saved = readDraft(`screen:${id || "new"}`),
      node = id
        ? nodes.get(id)
        : {
            id: "",
            title: "",
            group:
              nodes.get(selected)?.group ||
              [...enabled][0] ||
              state.project.groups[0]?.id,
            platform: state.project.platforms[0] || "",
            kind: "screen",
            x: 80,
            y: 100,
            w: 240,
            h: 420,
            reference: null,
            contract: blankContract(),
          };
    if (!node.group) {
      toast("Add a group in Project settings first.");
      return;
    }
    const groupNodes = [...nodes.values()].filter(
      (n) => n.group === node.group && !n.retired,
    );
    if (!id) node.x = 80 + groupNodes.length * 330;
    editor = saved || { node: clone(node), etag: state.etag, originalId: id };
    const form = $("screen-form");
    form.reset();
    $("editor-error").textContent = saved
      ? "Recovered an unsaved draft. If the project changed, reconcile it before saving."
      : "";
    $("editor-title").textContent = id
      ? "Edit screen & contract"
      : "Add a screen";
    delete field(form, "id").dataset.manuallyEdited;
    field(form, "group").replaceChildren(
      ...state.project.groups.map((g) => new Option(g.title, g.id)),
    );
    field(form, "sources").replaceChildren(
      ...state.project.documents.map((doc) => new Option(doc.title, doc.id)),
    );
    $("platform-options").replaceChildren(
      ...state.project.platforms.map((p) => {
        const o = make("option");
        o.value = p;
        return o;
      }),
    );
    for (const name of [
      "id",
      "title",
      "group",
      "platform",
      "kind",
      "x",
      "y",
      "w",
      "h",
    ])
      field(form, name).value = editor.node[name] ?? "";
    field(form, "id").disabled = Boolean(id);
    field(form, "retired").checked = Boolean(editor.node.retired);
    for (const name of Object.keys(contractFields))
      field(form, name).value = editor.node.contract[name] || "";
    for (const option of field(form, "sources").options)
      option.selected = (editor.node.contract.sources || []).includes(
        option.value,
      );
    renderActionFields();
    $("editor-dialog").showModal();
  }
  function renderActionFields() {
    $("action-fields").replaceChildren();
    for (const action of editor.node.contract.actions) {
      const row = make("div", null, "action-fields"),
        first = make("div", null, "field-pair"),
        second = make("div", null, "field-pair");
      for (const [key, label] of [
        ["label", "Action label"],
        ["to", "Destination"],
        ["condition", "When available"],
        ["effect", "Effect / outcome"],
      ]) {
        const l = make("label", label);
        let input;
        if (key === "to") {
          input = make("select");
          input.append(
            new Option("Stays on this screen / no destination", ""),
            ...state.project.nodes
              .filter((n) => !n.retired)
              .map((n) => new Option(displayTitle(n.title), n.id)),
          );
        } else input = make("input");
        input.value = action[key] || "";
        if (key === "label") input.required = true;
        input.addEventListener("input", () => {
          action[key] = input.value || (key === "to" ? null : "");
          persistEditor();
        });
        l.append(input);
        (key === "label" || key === "to" ? first : second).append(l);
      }
      const kindLabel = make("label", "Connection type"),
        kind = make("select");
      for (const k of [
        "navigation",
        "state",
        "return",
        "system",
        "reference",
        "motion",
        "proposal",
      ])
        kind.append(new Option(k, k));
      kind.value = action.kind || "navigation";
      kind.addEventListener("change", () => {
        action.kind = kind.value;
        persistEditor();
      });
      kindLabel.append(kind);
      row.append(
        first,
        second,
        kindLabel,
        button(
          "Remove action",
          () => {
            editor.node.contract.actions = editor.node.contract.actions.filter(
              (a) => a !== action,
            );
            renderActionFields();
            persistEditor();
          },
          "remove",
        ),
      );
      $("action-fields").append(row);
    }
  }
  function collectEditor() {
    const form = $("screen-form"),
      node = editor.node;
    for (const name of ["id", "title", "group", "platform", "kind"])
      node[name] = field(form, name).value;
    for (const name of ["x", "y", "w", "h"])
      node[name] = Number(field(form, name).value);
    node.retired = field(form, "retired").checked;
    for (const name of Object.keys(contractFields))
      node.contract[name] = field(form, name).value;
    node.contract.sources = [...field(form, "sources").selectedOptions].map(
      (option) => option.value,
    );
    return editor;
  }
  function persistEditor() {
    if (editor)
      saveDraft(`screen:${editor.originalId || "new"}`, collectEditor());
  }
  async function saveEditor(event) {
    event.preventDefault();
    const draft = collectEditor(),
      project = clone(state.project),
      submit = event.submitter;
    submit.disabled = true;
    try {
      if (draft.originalId) {
        const index = project.nodes.findIndex((n) => n.id === draft.originalId);
        project.nodes[index] = {
          ...clone(draft.node),
          reference: project.nodes[index].reference,
        };
      } else {
        if (nodes.has(draft.node.id))
          throw new Error("This stable screen ID is already in use.");
        project.nodes.push(clone(draft.node));
      }
      await projectSave(project, draft.etag);
      saveDraft(`screen:${draft.originalId || "new"}`, null);
      $("editor-dialog").close();
      editor = null;
      if (!draft.node.retired) {
        select(draft.node.id);
        fit(rect(nodes.get(draft.node.id)));
      }
      toast("Screen contract saved.");
    } catch (error) {
      persistEditor();
      $("editor-error").textContent =
        `${error.message} Your draft is kept. Reopen this editor after reviewing changes; use the current project version only when reconciled.`;
      const reconcile = button(
        "Use current project version for this draft",
        () => {
          if (
            confirm(
              "Keep your draft and apply it over the current screen contract? Review any concurrent edits first.",
            )
          ) {
            editor.etag = state.etag;
            persistEditor();
            $("editor-error").textContent =
              "Draft is ready to save against the current project version.";
          }
        },
      );
      $("editor-error").append(reconcile);
    } finally {
      submit.disabled = false;
    }
  }
  function openSettings() {
    if (readonly()) return;
    settings = { project: clone(state.project), etag: state.etag };
    const form = $("settings-form");
    field(form, "name").value = settings.project.name;
    field(form, "description").value = settings.project.description || "";
    field(form, "platforms").value = settings.project.platforms.join(", ");
    $("settings-error").textContent = "";
    renderSettingsFields();
    $("settings-dialog").showModal();
  }
  function renderSettingsFields() {
    $("group-fields").replaceChildren();
    for (const group of settings.project.groups) {
      const row = make("div", null, "chapter-fields"),
        title = make("label", "Group title"),
        name = make("input");
      name.value = group.title;
      name.required = true;
      name.addEventListener("input", () => (group.title = name.value));
      title.append(name);
      row.append(title);
      const coords = make("div", null, "field-four");
      for (const key of ["x", "y", "w", "h"]) {
        const label = make("label", key.toUpperCase()),
          input = make("input");
        input.type = "number";
        input.min = key === "w" || key === "h" ? 1 : 0;
        input.value = group[key];
        input.addEventListener(
          "input",
          () => (group[key] = Number(input.value)),
        );
        label.append(input);
        coords.append(label);
      }
      row.append(coords);
      $("group-fields").append(row);
    }
    $("document-fields").replaceChildren();
    for (const document of settings.project.documents) {
      const row = make("div", null, "document-fields"),
        label = make("label", "Document title"),
        name = make("input");
      name.value = document.title;
      name.required = true;
      name.addEventListener("input", () => (document.title = name.value));
      label.append(name);
      row.append(label);
      if (document.path) {
        row.append(
          make("p", `Linked project file: ${document.path}`, "small-note"),
          button("Read document", () => openDocument(document)),
        );
      } else {
        const bodyLabel = make("label", "Content"),
          body = make("textarea");
        body.rows = 5;
        body.value = document.body;
        body.addEventListener("input", () => (document.body = body.value));
        bodyLabel.append(body);
        row.append(bodyLabel);
      }
      $("document-fields").append(row);
    }
  }
  async function saveSettings(event) {
    event.preventDefault();
    const submit = event.submitter;
    submit.disabled = true;
    try {
      const form = $("settings-form");
      settings.project.name = field(form, "name").value;
      settings.project.description = field(form, "description").value;
      settings.project.platforms = field(form, "platforms")
        .value.split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      await projectSave(settings.project, settings.etag);
      $("settings-dialog").close();
      settings = null;
      toast("Project settings saved.");
    } catch (error) {
      $("settings-error").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }
  async function openDocument(document) {
    try {
      const result = readonly()
        ? document
        : await request(`/api/documents/${encodeURIComponent(document.id)}`);
      $("document-title").textContent = result.title;
      $("document-body").textContent = result.body;
      $("document-dialog").showModal();
    } catch (error) {
      toast(error.message);
    }
  }

  function openImage(id, captureId = null, versionId = null) {
    if (!nodes.has(id)) return;
    select(id);
    const design = designFor(id);
    view = {
      nodeId: id,
      captureId: captureId || latestCapture(id)?.id || null,
      mode: captureId ? "side" : "design",
      designKey: captureId
        ? "capture-reference"
        : versionId
          ? `version:${versionId}`
          : design.version
            ? `version:${design.version.id}`
            : "published",
    };
    renderImage();
    if (!$("image-dialog").open) $("image-dialog").showModal();
    requestAnimationFrame(drawImagePins);
  }
  function referenceProvenance(node, hash) {
    if (!hash) return null;
    if (node.reference?.sha256 === hash) return node.reference.provenance;
    return (
      (state.referenceSnapshots || []).findLast(
        (reference) =>
          reference.node_id === node.id && reference.sha256 === hash,
      )?.reference.provenance || null
    );
  }
  function displayedDesign() {
    if (!view) return null;
    const node = nodes.get(view.nodeId),
      c = capture(view.captureId);
    if (view.designKey === "capture-reference")
      return {
        hash: c?.reference_sha256 || null,
        label: "Reference frozen with this capture",
        provenance: referenceProvenance(node, c?.reference_sha256),
      };
    if (view.designKey.startsWith("historical:"))
      return {
        hash: view.designKey.slice(11),
        label: "Earlier curated reference",
        provenance: referenceProvenance(node, view.designKey.slice(11)),
      };
    if (view.designKey.startsWith("version:")) {
      const v = version(view.designKey.slice(8));
      return v
        ? {
            hash: v.sha256,
            label:
              designState(node.id)?.proposed_id === v.id
                ? "Proposed design"
                : designState(node.id)?.accepted_id === v.id
                  ? "Accepted design"
                  : state.acceptances.some(
                        (acceptance) => acceptance.version_id === v.id,
                      )
                    ? "Earlier accepted design"
                    : "Earlier design candidate",
            version: v,
            provenance: v.provenance,
          }
        : null;
    }
    return {
      hash: node?.reference?.sha256 || null,
      label: "Curated reference",
      provenance: node?.reference?.provenance,
    };
  }
  function setImage(id, hash) {
    const image = $(id);
    if (hash) {
      const url = imageURL(hash);
      if (image.getAttribute("src") !== url) {
        image.src = url;
        image.dataset.loaded = "false";
      }
      image.dataset.hash = hash;
      image.hidden = false;
    } else {
      image.removeAttribute("src");
      delete image.dataset.hash;
      image.dataset.loaded = "false";
      image.hidden = true;
    }
  }
  function renderImage() {
    if (!view || !nodes.has(view.nodeId)) return;
    const node = nodes.get(view.nodeId),
      available = state.captures.filter((c) => c.node_id === node.id),
      c = capture(view.captureId);
    $("image-title").textContent = displayTitle(node.title);
    const controls = $("image-controls");
    controls.replaceChildren();
    const designLabel = make("label", "Design version"),
      choice = make("select");
    choice.append(
      new Option(
        node.reference ? "Curated reference" : "No curated reference",
        "published",
      ),
    );
    if (c?.reference_sha256)
      choice.append(
        new Option("Frozen reference for this screenshot", "capture-reference"),
      );
    const baselines = new Set(
      state.versions
        .filter((v) => v.node_id === node.id)
        .map((v) => v.baseline_sha256)
        .filter(Boolean),
    );
    for (const reference of state.referenceSnapshots || [])
      if (reference.node_id === node.id) baselines.add(reference.sha256);
    if (view.designKey.startsWith("historical:"))
      baselines.add(view.designKey.slice(11));
    baselines.delete(node.reference?.sha256);
    let baselineNumber = 0;
    for (const hash of baselines)
      choice.append(
        new Option(
          `Earlier curated reference / ${++baselineNumber}`,
          `historical:${hash}`,
        ),
      );
    for (const v of state.versions
      .filter((v) => v.node_id === node.id)
      .reverse()) {
      const s = designState(node.id),
        label =
          s?.proposed_id === v.id
            ? "Proposed"
            : s?.accepted_id === v.id
              ? "Accepted"
              : state.acceptances.some(
                    (acceptance) => acceptance.version_id === v.id,
                  )
                ? "Earlier accepted"
                : "Earlier candidate";
      choice.append(
        new Option(`${label} / ${date(v.created_at)}`, `version:${v.id}`),
      );
    }
    if (![...choice.options].some((option) => option.value === view.designKey))
      view.designKey = "published";
    choice.value = view.designKey;
    choice.addEventListener("change", () => {
      view.designKey = choice.value;
      renderImage();
    });
    designLabel.append(choice);
    controls.append(designLabel);
    const captureLabel = make("label", "App screenshot"),
      captureChoice = make("select");
    captureChoice.append(new Option("No screenshot selected", ""));
    for (const item of available)
      captureChoice.append(
        new Option(
          `${item.state} / ${statusLabels[item.review.status]} / ${date(item.captured_at || item.created_at)}`,
          item.id,
        ),
      );
    captureChoice.value = c?.id || "";
    captureChoice.addEventListener("change", () => {
      view.captureId = captureChoice.value || null;
      view.designKey = view.captureId ? "capture-reference" : "published";
      if (!view.captureId) view.mode = "design";
      renderImage();
    });
    captureLabel.append(captureChoice);
    controls.append(captureLabel);
    const modes = make("div", null, "view-switch");
    for (const [mode, label] of [
      ["design", "Design"],
      ["app", "App"],
      ["side", "Side by side"],
    ]) {
      const b = button(label, () => {
        view.mode = mode;
        renderImage();
      });
      b.disabled = mode !== "design" && !c;
      b.setAttribute("aria-pressed", String(mode === view.mode));
      modes.append(b);
    }
    controls.append(modes);
    const design = displayedDesign();
    $("design-pane").hidden = view.mode === "app";
    $("capture-pane").hidden = view.mode === "design";
    $("design-label").textContent = design?.label || "No reference";
    $("capture-label").textContent = c
      ? `${c.state} / ${c.source} / ${c.build_revision ? "Build recorded" : "Build unknown"}`
      : "No app screenshot";
    setImage("design-image", design?.hash);
    setImage("capture-image", c?.sha256);
    renderImageDecisions();
    requestAnimationFrame(drawImagePins);
  }
  function loaded(id, hash) {
    const image = $(id);
    return Boolean(
      hash &&
        image.dataset.hash === hash &&
        image.getAttribute("src") === imageURL(hash) &&
        image.complete &&
        image.naturalWidth > 0 &&
        image.dataset.loaded !== "error",
    );
  }
  function renderImageDecisions() {
    if (!view) return;
    const container = $("image-decisions");
    container.replaceChildren();
    const node = nodes.get(view.nodeId),
      s = designState(node.id),
      design = displayedDesign(),
      c = capture(view.captureId),
      v = design?.version;
    const addFeedback = button("Pin feedback (C)", () => {
      const app = view.mode === "app" || (view.mode === "side" && c);
      beginComment(
        app
          ? {
              kind: "capture",
              nodeId: node.id,
              captureId: c.id,
              imageSha256: c.sha256,
              x: 0.5,
              y: 0.5,
            }
          : {
              kind: design?.hash ? "image" : "node",
              nodeId: node.id,
              imageSha256: design?.hash || null,
              x: 0.5,
              y: 0.5,
            },
      );
    });
    addFeedback.disabled = readonly() || !connected;
    container.append(addFeedback);
    if (v && s?.proposed_id === v.id && view.mode !== "app") {
      const accept = button(
        imageBusy ? "Saving…" : "Accept this proposal",
        () =>
          imageAction("accept", {
            id: node.id,
            versionId: v.id,
            imageSha256: v.sha256,
            revision: s.revision,
          }),
      );
      accept.disabled =
        readonly() ||
        !connected ||
        imageBusy ||
        !loaded("design-image", v.sha256);
      container.append(accept);
      container.append(
        make(
          "p",
          "Acceptance records this exact candidate. Promoting it to the project reference is a separate action.",
        ),
      );
    }
    if (
      v &&
      s?.accepted_id === v.id &&
      node.reference?.provenance?.acceptedVersion !== v.id &&
      view.mode !== "app"
    ) {
      const promote = button(
        "Promote to reference",
        () => {
          if (
            confirm(
              "Make this accepted design the curated reference? Earlier screenshots and feedback keep their original image identities.",
            )
          )
            imageAction("promote", {
              id: node.id,
              versionId: v.id,
              etag: state.etag,
            });
        },
        "primary",
      );
      promote.disabled = readonly() || !connected || imageBusy;
      container.append(promote);
    }
    if (c && view.mode !== "design") {
      container.append(badge(statusLabels[c.review.status], c.review.status));
      for (const [status, label] of [
        ["approved", "Approve appearance"],
        ["changes_requested", "Request changes"],
        ["pending", "Reopen review"],
      ]) {
        const b = button(label, () =>
          imageAction("decide", {
            id: c.id,
            status,
            revision: c.review.revision,
            imageSha256: c.sha256,
            referenceSha256: c.reference_sha256,
          }),
        );
        b.disabled =
          readonly() ||
          !connected ||
          imageBusy ||
          c.review.status === status ||
          !loaded("capture-image", c.sha256) ||
          (status === "approved" &&
            (!c.reference_sha256 ||
              c.reference_changed ||
              design?.hash !== c.reference_sha256 ||
              !loaded("design-image", c.reference_sha256) ||
              view.mode !== "side"));
        container.append(b);
      }
      container.append(
        make(
          "p",
          `${c.state} / ${c.source} / ${c.device} / ${c.build_revision ? `Build: ${c.build_revision}` : "Build identity unknown"} / ${c.captured_at || "Capture time unknown"}${c.note ? `\n${c.note}` : ""}${c.reference_changed ? "\nCurated reference changed. This capture keeps its earlier reference and cannot receive a new approval against the current reference." : ""}${c.contract_changed ? "\nThe behavior contract changed since this capture." : ""}\nAppearance review applies only to this screenshot. Compare it side by side with its frozen reference before approving.`,
        ),
      );
    }
    if (design?.hash) {
      const details = make("details");
      details.append(
        make("summary", "Image identity, generation prompt & provenance"),
        make(
          "pre",
          `${design.hash}\n\n${v?.prompt || design.provenance?.prompt || "No generation prompt recorded for this reference."}\n\n${JSON.stringify(design.provenance || {}, null, 2)}`,
        ),
      );
      container.append(details);
    }
    if (readonly())
      container.append(
        make(
          "p",
          "Read-only export. Open the local ScreenAtlas project to add feedback or make decisions.",
        ),
      );
  }
  async function imageAction(name, payload) {
    imageBusy = true;
    renderImageDecisions();
    const operationId = uuid();
    try {
      await command(name, { ...payload, operationId });
      await refresh();
      toast(
        name === "accept"
          ? "Exact proposal accepted. Promotion remains separate."
          : name === "promote"
            ? "Accepted design promoted to the project reference."
            : "Appearance decision saved for this capture.",
      );
    } catch (error) {
      toast(
        `Decision not confirmed: ${error.message}. Refresh before deciding again.`,
        true,
      );
      await refresh();
    } finally {
      imageBusy = false;
      renderImageDecisions();
    }
  }

  function imageBounds(image) {
    if (!image?.naturalWidth || image.hidden) return null;
    const r = image.getBoundingClientRect(),
      scale = Math.min(
        r.width / image.naturalWidth,
        r.height / image.naturalHeight,
      ),
      width = image.naturalWidth * scale,
      height = image.naturalHeight * scale;
    return {
      left: r.left + (r.width - width) / 2,
      top: r.top + (r.height - height) / 2,
      width,
      height,
    };
  }
  function contains(r, p) {
    return (
      r &&
      p &&
      p.x >= r.left &&
      p.y >= r.top &&
      p.x <= r.left + r.width &&
      p.y <= r.top + r.height
    );
  }
  function anchorAt(p) {
    if ($("image-dialog").open && view) {
      for (const [id, app] of [
        ["capture-image", true],
        ["design-image", false],
      ]) {
        if ($(app ? "capture-pane" : "design-pane").hidden) continue;
        const r = imageBounds($(id));
        if (contains(r, p)) {
          const c = capture(view.captureId),
            d = displayedDesign();
          return {
            kind: app ? "capture" : "image",
            nodeId: view.nodeId,
            ...(app ? { captureId: c.id } : {}),
            imageSha256: app ? c.sha256 : d.hash,
            x: (p.x - r.left) / r.width,
            y: (p.y - r.top) / r.height,
          };
        }
      }
      return null;
    }
    const r = $("viewport").getBoundingClientRect();
    if (!contains(r, p)) return null;
    const target = document.elementFromPoint(p.x, p.y),
      card = target?.closest(".screen-card");
    if (card) {
      const node = nodes.get(card.dataset.node),
        image = card.querySelector(".card-image"),
        ib = imageBounds(image),
        area = contains(ib, p) ? ib : card.getBoundingClientRect();
      return {
        kind: area === ib ? "image" : "node",
        nodeId: node.id,
        imageSha256: designFor(node.id).hash,
        x: (p.x - area.left) / area.width,
        y: (p.y - area.top) / area.height,
      };
    }
    if (target?.closest("button,#minimap,.map-toolbar")) return null;
    const x = (p.x - r.left - camera.x) / camera.scale,
      y = (p.y - r.top - camera.y) / camera.scale;
    return x >= 0 && y >= 0 ? { kind: "canvas", nodeId: null, x, y } : null;
  }
  function beginComment(anchor) {
    if (readonly() || !connected) return;
    if (!anchor) {
      toast("Point at a screen, image, or canvas location and press C.");
      return;
    }
    const recovered = readDraft("comment");
    commentDraft = recovered || {
      id: uuid(),
      operationId: uuid(),
      anchor,
      body: "",
    };
    $("comment-body").value = commentDraft.body;
    $("comment-error").textContent = recovered
      ? "Recovered your unsaved feedback. It keeps its original image and anchor."
      : "";
    const node = nodes.get(commentDraft.anchor.nodeId);
    $("comment-title").textContent = displayTitle(
      node?.title || "Canvas feedback",
    );
    $("comment-context").textContent =
      commentDraft.anchor.kind === "capture"
        ? "Pinned to this exact app screenshot."
        : commentDraft.anchor.imageSha256
          ? "Pinned to this exact design image."
          : "Pinned to this screen or canvas location.";
    $("comment-dialog").showModal();
    $("comment-body").focus();
    saveDraft("comment", commentDraft);
  }
  function pin(thread, x, y, parent) {
    const b = button(
      String(state.threads.indexOf(thread) + 1),
      (event) => {
        event.stopPropagation();
        openReview(thread.id);
      },
      `pin ${thread.status}`,
    );
    b.setAttribute(
      "aria-label",
      `Feedback: ${thread.messages[0]?.body || thread.title}`,
    );
    Object.assign(b.style, { left: `${x}px`, top: `${y}px` });
    parent.append(b);
  }
  function drawPins() {
    $("canvas-pins").replaceChildren();
    for (const thread of state.threads.filter(
      (t) => t.status !== "resolved" && !t.capture_id,
    )) {
      if (thread.anchor_kind === "canvas") {
        pin(thread, thread.x, thread.y, $("canvas-pins"));
        continue;
      }
      const node = nodes.get(thread.node_id);
      if (
        !node ||
        !cards.has(node.id) ||
        thread.image_sha256 !== designFor(node.id).hash
      )
        continue;
      const r = rect(node);
      if (thread.anchor_kind === "node")
        pin(
          thread,
          r.x + thread.x * r.w,
          r.y + thread.y * r.h,
          $("canvas-pins"),
        );
      else {
        const image = cards.get(node.id).querySelector("img"),
          b = imageBounds(image),
          area = $("viewport").getBoundingClientRect();
        if (b)
          pin(
            thread,
            (b.left - area.left - camera.x + thread.x * b.width) / camera.scale,
            (b.top - area.top - camera.y + thread.y * b.height) / camera.scale,
            $("canvas-pins"),
          );
      }
    }
  }
  function drawImagePins() {
    for (const [layer, img, app] of [
      ["design-pins", "design-image", false],
      ["capture-pins", "capture-image", true],
    ]) {
      const parent = $(layer);
      parent.replaceChildren();
      if (!view || !$("image-dialog").open) continue;
      const r = imageBounds($(img)),
        bounds = parent.getBoundingClientRect();
      if (!r) continue;
      for (const thread of state.threads.filter(
        (t) =>
          t.status !== "resolved" &&
          t.node_id === view.nodeId &&
          (app
            ? t.capture_id === view.captureId
            : !t.capture_id &&
              t.anchor_kind === "image" &&
              t.image_sha256 === displayedDesign()?.hash),
      )) {
        pin(
          thread,
          r.left - bounds.left + thread.x * r.width,
          r.top - bounds.top + thread.y * r.height,
          parent,
        );
      }
    }
  }
  function openReview(id = null) {
    if (id) selectedThread = id;
    renderReview();
    if (!$("review-dialog").open) $("review-dialog").showModal();
  }
  function renderReview() {
    const list = $("thread-list");
    list.replaceChildren();
    const filter = $("review-filter").value,
      threads = state.threads.filter(
        (t) =>
          filter === "all" ||
          (filter === "active" ? t.status !== "resolved" : t.status === filter),
      );
    for (const thread of threads) {
      const item = button(
        "",
        () => {
          selectedThread = thread.id;
          renderReview();
        },
        `thread-item${selectedThread === thread.id ? " selected" : ""}`,
      );
      item.append(
        badge(statusLabels[thread.status], thread.status),
        make("strong", displayTitle(thread.title)),
        make("p", thread.messages[0]?.body || ""),
      );
      list.append(item);
    }
    if (!threads.length)
      list.append(
        make(
          "p",
          "No feedback in this view. Press C over a screen to leave some.",
          "small-note",
        ),
      );
    const detail = $("thread-detail"),
      thread = state.threads.find((t) => t.id === selectedThread);
    detail.replaceChildren();
    if (!thread) {
      detail.append(
        make(
          "div",
          "Select feedback to read the conversation.",
          "empty-detail",
        ),
      );
      return;
    }
    detail.append(
      make("h2", displayTitle(thread.title), "thread-title"),
      make(
        "p",
        `${thread.capture_id ? "App screenshot feedback" : "Design / map feedback"}${thread.reference_changed ? " / reference changed since this feedback" : ""}`,
        "small-note",
      ),
    );
    if (thread.node_id)
      detail.append(
        button("Show anchored image", () => {
          $("review-dialog").close();
          if (thread.capture_id) openImage(thread.node_id, thread.capture_id);
          else {
            const v = state.versions.find(
              (v) =>
                v.node_id === thread.node_id &&
                v.sha256 === thread.image_sha256,
            );
            openImage(thread.node_id, null, v?.id);
            if (
              !v &&
              thread.image_sha256 &&
              nodes.get(thread.node_id)?.reference?.sha256 !==
                thread.image_sha256
            ) {
              view.designKey = `historical:${thread.image_sha256}`;
              view.mode = "design";
              renderImage();
            }
          }
        }),
      );
    for (const message of thread.messages) {
      const card = make("article", null, "message");
      card.append(
        make(
          "header",
          `${message.author === "assistant" ? "Agent" : "Reviewer"} / ${date(message.created_at)}`,
        ),
        make("p", message.body),
      );
      if (message.preview_sha256) {
        const image = make("img");
        image.src = imageURL(message.preview_sha256);
        image.alt =
          "Reply preview attachment — not a registered or accepted design";
        card.append(
          image,
          make("p", "Reply preview / not a registered proposal", "small-note"),
        );
      }
      detail.append(card);
    }
    const form = make("form"),
      label = make("label", "Reply"),
      body = make("textarea"),
      saved = readDraft(`reply:${thread.id}`);
    body.rows = 3;
    body.required = true;
    body.maxLength = 20000;
    body.value = saved?.body || "";
    label.append(body);
    form.append(label);
    const submit = make("button", "Save reply", "primary");
    submit.type = "submit";
    submit.disabled = readonly() || !connected;
    form.append(submit);
    const error = make("p", "", "error");
    form.append(error);
    let draft = saved || {
      body: "",
      operationId: uuid(),
      revision: thread.revision,
    };
    body.addEventListener("input", () => {
      if (draft.body !== body.value)
        draft = {
          body: body.value,
          operationId: uuid(),
          revision: thread.revision,
        };
      saveDraft(`reply:${thread.id}`, draft);
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        await command("reply", {
          operationId: draft.operationId,
          id: thread.id,
          revision: draft.revision,
          body: body.value,
        });
        saveDraft(`reply:${thread.id}`, null);
        body.value = "";
        await refresh();
        renderReview();
      } catch (failure) {
        error.textContent = `${failure.message} Your reply draft is kept.`;
        await refresh();
        const retry = button("Review latest replies and retry my draft", () => {
          draft.revision = state.threads.find(
            (t) => t.id === thread.id,
          ).revision;
          draft.operationId = uuid();
          saveDraft(`reply:${thread.id}`, draft);
          renderReview();
        });
        error.append(retry);
      } finally {
        submit.disabled = readonly();
      }
    });
    detail.append(form);
    const actions = make("div", null, "thread-actions"),
      status = make("select");
    status.setAttribute("aria-label", "Feedback status");
    for (const value of ["open", "in_progress", "ready", "resolved"])
      status.append(new Option(statusLabels[value], value));
    status.value = thread.status;
    const update = button("Update status", async () => {
      update.disabled = true;
      try {
        await command("status", {
          operationId: uuid(),
          id: thread.id,
          revision: thread.revision,
          status: status.value,
        });
        await refresh();
        renderReview();
      } catch (error) {
        toast(error.message);
      } finally {
        update.disabled = readonly();
      }
    });
    update.disabled = readonly() || !connected;
    actions.append(status, update);
    detail.append(
      actions,
      make(
        "p",
        "Resolving feedback does not accept a design or approve a screenshot.",
        "small-note",
      ),
    );
  }
  function renderHistory() {
    const content = $("history-content");
    content.replaceChildren();
    content.append(
      make(
        "p",
        "Image versions and decisions remain attached to their exact evidence. Older versions stay available even after promotion.",
        "small-note",
      ),
    );
    const events = [
      ...state.versions.map((v) => ({
        type: "Design candidate",
        nodeId: v.node_id,
        time: v.created_at,
        hash: v.sha256,
        value: v,
      })),
      ...state.acceptances.map((a) => ({
        type: "Design accepted",
        nodeId: a.node_id,
        time: a.created_at,
        value: a,
      })),
      ...state.promotions.map((p) => ({
        type: "Reference promoted",
        nodeId: p.node_id,
        time: p.created_at,
        value: p,
      })),
      ...state.captures.map((c) => ({
        type: "App screenshot",
        nodeId: c.node_id,
        time: c.created_at,
        hash: c.sha256,
        value: c,
      })),
    ].sort((a, b) => b.time.localeCompare(a.time));
    if (!events.length)
      content.append(
        make(
          "p",
          "No review history yet. Curated example references are project inputs, not recorded reviewer decisions.",
        ),
      );
    for (const event of events) {
      const item = make("div", null, "history-item");
      if (event.hash) {
        const image = make("img");
        image.src = imageURL(event.hash);
        image.alt = event.type;
        image.loading = "lazy";
        item.append(image);
      }
      const description = make("div");
      description.append(
        make(
          "strong",
          `${event.type} / ${displayTitle(nodes.get(event.nodeId)?.title || "Retired screen")}`,
        ),
        make("p", date(event.time)),
      );
      if (event.type === "Design candidate") {
        description.append(
          button("Inspect version", () => {
            $("history-dialog").close();
            openImage(event.nodeId, null, event.value.id);
          }),
        );
        const details = make("details");
        details.append(
          make("summary", "Generation prompt & identity"),
          make("pre", `${event.value.sha256}\n${event.value.prompt}`),
        );
        description.append(details);
      }
      if (event.type === "App screenshot") {
        description.append(
          make(
            "p",
            `${event.value.device} / ${event.value.build_revision || "build unknown"} / ${statusLabels[event.value.review.status]}`,
          ),
          button("Inspect capture", () => {
            $("history-dialog").close();
            openImage(event.nodeId, event.value.id);
          }),
        );
      }
      item.append(description);
      content.append(item);
    }
    const retired = [...nodes.values()].filter((n) => n.retired);
    if (retired.length) {
      content.append(make("h3", "Retired screens"));
      for (const node of retired) {
        const row = make("p", displayTitle(node.title));
        const edit = button("Edit / restore", () => {
          $("history-dialog").close();
          openEditor(node.id);
        });
        edit.disabled = readonly();
        row.append(edit);
        content.append(row);
      }
    }
  }

  async function filePNG(file) {
    if (!(file instanceof Blob) || !file.size || file.size > 30 * 1024 * 1024)
      throw new Error("Choose a PNG of at most 30 MiB.");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Could not read the PNG file."));
      reader.readAsDataURL(file);
    });
  }
  async function moveNode(id, x, y) {
    const project = clone(state.project),
      node = project.nodes.find((n) => n.id === id);
    node.x = Math.max(0, Math.round(x / 20) * 20);
    node.y = Math.max(0, Math.round(y / 20) * 20);
    try {
      await projectSave(project, state.etag);
      toast("Map position saved.");
    } catch (error) {
      saveDraft("layout", { project, etag: state.etag });
      renderMap();
      toast(`${error.message} Layout draft kept in this browser.`, true);
    }
  }
  function bindNavigation() {
    $("viewport").addEventListener(
      "wheel",
      (event) => {
        if (event.target.closest("button,#minimap")) return;
        event.preventDefault();
        if (event.shiftKey) {
          camera.x -= event.deltaX || event.deltaY;
          camera.y -= event.deltaX ? event.deltaY : 0;
          drawCamera();
        } else {
          const r = $("viewport").getBoundingClientRect();
          zoom(Math.exp(-event.deltaY * 0.0015), {
            x: event.clientX - r.left,
            y: event.clientY - r.top,
          });
        }
      },
      { passive: false },
    );
    const touches = new Map();
    $("viewport").addEventListener("pointerdown", (event) => {
      if (
        event.button !== 0 ||
        event.target.closest("button,#minimap,.map-toolbar")
      )
        return;
      const viewport = $("viewport"),
        r = viewport.getBoundingClientRect();
      touches.set(event.pointerId, {
        x: event.clientX - r.left,
        y: event.clientY - r.top,
      });
      const card = event.target.closest(".screen-card"),
        moving =
          layoutEdit && event.target.closest(".card-heading") && card
            ? card.dataset.node
            : null;
      // Keep clicks on a card addressed to that card while allowing its drag
      // to continue outside its bounds. Capturing on the viewport retargets
      // the eventual click and prevents card selection and double-clicks.
      (card || viewport).setPointerCapture(event.pointerId);
      gesture = {
        startX: event.clientX,
        startY: event.clientY,
        x: camera.x,
        y: camera.y,
        scale: camera.scale,
        moved: false,
        moving,
        original: moving ? rect(nodes.get(moving)) : null,
      };
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        gesture.pinch = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        };
      }
    });
    $("viewport").addEventListener("pointermove", (event) => {
      if (!gesture || !touches.has(event.pointerId)) return;
      const r = $("viewport").getBoundingClientRect();
      touches.set(event.pointerId, {
        x: event.clientX - r.left,
        y: event.clientY - r.top,
      });
      const dx = event.clientX - gesture.startX,
        dy = event.clientY - gesture.startY;
      if (Math.hypot(dx, dy) > 4) gesture.moved = true;
      if (touches.size === 2 && gesture.pinch) {
        const [a, b] = [...touches.values()],
          p = gesture.pinch,
          next = Math.max(
            0.045,
            Math.min(
              2.4,
              (gesture.scale * Math.hypot(a.x - b.x, a.y - b.y)) /
                Math.max(1, p.distance),
            ),
          );
        camera.x = (a.x + b.x) / 2 - ((p.x - gesture.x) * next) / gesture.scale;
        camera.y = (a.y + b.y) / 2 - ((p.y - gesture.y) * next) / gesture.scale;
        camera.scale = next;
        gesture.moved = true;
        drawCamera();
      } else if (gesture.moving) {
        const card = cards.get(gesture.moving);
        card.classList.add("dragging");
        card.style.left = `${gesture.original.x + dx / camera.scale}px`;
        card.style.top = `${gesture.original.y + dy / camera.scale}px`;
      } else {
        camera.x = gesture.x + dx;
        camera.y = gesture.y + dy;
        drawCamera();
      }
    });
    const end = (event) => {
      if (!gesture) return;
      const current = gesture;
      touches.delete(event.pointerId);
      const captureTarget =
        event.target.closest(".screen-card") || $("viewport");
      if (captureTarget.hasPointerCapture(event.pointerId))
        captureTarget.releasePointerCapture(event.pointerId);
      if (current.moving && current.moved) {
        const card = cards.get(current.moving),
          node = nodes.get(current.moving),
          group = groups.get(node.group);
        card.dataset.justDragged = "true";
        moveNode(
          current.moving,
          parseFloat(card.style.left) - group.x,
          parseFloat(card.style.top) - group.y,
        );
        setTimeout(() => delete card.dataset.justDragged, 100);
      }
      if (!touches.size) {
        if (current.moved) $("viewport").dataset.justPanned = "true";
        setTimeout(() => {
          gesture = null;
          delete $("viewport").dataset.justPanned;
        }, 0);
      } else {
        const remaining = [...touches.values()][0],
          r = $("viewport").getBoundingClientRect();
        gesture = {
          startX: remaining.x + r.left,
          startY: remaining.y + r.top,
          x: camera.x,
          y: camera.y,
          scale: camera.scale,
          moved: true,
        };
      }
    };
    $("viewport").addEventListener("pointerup", end);
    $("viewport").addEventListener("pointercancel", end);
    $("viewport").addEventListener("click", (event) => {
      if (
        !gesture?.moved &&
        !$("viewport").dataset.justPanned &&
        !event.target.closest(".screen-card,button,#minimap,.map-toolbar,.pin")
      )
        clearSelection();
    });
    $("minimap").addEventListener("click", (event) => {
      const svgElement = $("minimap"),
        point = svgElement.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const p = point.matrixTransform(svgElement.getScreenCTM().inverse()),
        r = $("viewport").getBoundingClientRect();
      camera.x = r.width / 2 - p.x * camera.scale;
      camera.y = r.height / 2 - p.y * camera.scale;
      drawCamera();
    });
    $("minimap-toggle").addEventListener("click", () => {
      const hidden = !$("minimap").hasAttribute("hidden");
      $("minimap").toggleAttribute("hidden", hidden);
      $("minimap-toggle").setAttribute("aria-expanded", String(!hidden));
    });
    document.addEventListener(
      "pointermove",
      (event) => (pointer = { x: event.clientX, y: event.clientY }),
      { passive: true },
    );
    document.addEventListener("keydown", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target.closest("input,textarea,select,[contenteditable]")
      )
        return;
      if (
        event.key.toLowerCase() === "c" &&
        !event.repeat &&
        !document.querySelector("dialog[open]:not(#image-dialog)")
      ) {
        event.preventDefault();
        beginComment(
          pointer
            ? anchorAt(pointer)
            : selected
              ? {
                  kind: "node",
                  nodeId: selected,
                  imageSha256: designFor(selected).hash,
                  x: 0.5,
                  y: 0.5,
                }
              : null,
        );
        return;
      }
      if (document.querySelector("dialog[open]")) return;
      const moves = {
        ArrowLeft: [80, 0],
        ArrowRight: [-80, 0],
        ArrowUp: [0, 80],
        ArrowDown: [0, -80],
      };
      if (moves[event.key]) {
        event.preventDefault();
        camera.x += moves[event.key][0];
        camera.y += moves[event.key][1];
        drawCamera();
      } else if (event.key === "0") {
        event.preventDefault();
        fit();
      } else if (event.key.toLowerCase() === "f" && selected) {
        event.preventDefault();
        fit(rect(nodes.get(selected)));
      } else if (["+", "="].includes(event.key)) {
        event.preventDefault();
        zoom(1.2);
      } else if (event.key === "-") {
        event.preventDefault();
        zoom(1 / 1.2);
      } else if (event.key === "/") {
        event.preventDefault();
        $("search").focus();
      } else if (event.key === "Escape") clearSelection();
    });
    new ResizeObserver(() => {
      drawMinimapViewport();
      drawImagePins();
      scheduleEdges();
    }).observe($("viewport"));
  }
  async function start() {
    document
      .querySelectorAll("[data-close]")
      .forEach((b) =>
        b.addEventListener("click", () => $(b.dataset.close).close()),
      );
    $("retry-load").addEventListener("click", refresh);
    $("search").addEventListener("input", renderScreenList);
    $("all-groups").addEventListener("click", showAll);
    $("show-hidden").addEventListener("click", showAll);
    $("map-tab").addEventListener("click", () => {
      document
        .querySelectorAll("dialog[open]")
        .forEach((dialog) => dialog.close());
      fit();
    });
    $("guide-open").addEventListener("click", openGuide);
    $("empty-start").addEventListener("click", openGuide);
    $("copy-codex-prompt").addEventListener("click", copyCodexPrompt);
    $("add-screen").addEventListener("click", () => openEditor());
    $("empty-add").addEventListener("click", () => openEditor());
    $("project-settings").addEventListener("click", openSettings);
    $("layout-toggle").addEventListener("click", () => {
      layoutEdit = !layoutEdit;
      $("layout-toggle").setAttribute("aria-pressed", String(layoutEdit));
      document.body.classList.toggle("layout-edit", layoutEdit);
      toast(
        layoutEdit
          ? "Drag a card's heading to arrange it. Screen placement fields also work with a keyboard."
          : "Layout saved. Drag the canvas to explore.",
      );
      const saved = readDraft("layout");
      if (
        layoutEdit &&
        saved &&
        confirm(
          "A layout draft was kept after a failed save. Apply its positions to the current map?",
        )
      ) {
        const project = clone(state.project);
        for (const n of project.nodes) {
          const old = saved.project.nodes.find((v) => v.id === n.id);
          if (old) {
            n.x = old.x;
            n.y = old.y;
          }
        }
        projectSave(project, state.etag)
          .then(() => saveDraft("layout", null))
          .catch((error) => toast(error.message));
      }
    });
    $("zoom-in").addEventListener("click", () => zoom(1.2));
    $("zoom-out").addEventListener("click", () => zoom(1 / 1.2));
    $("fit").addEventListener("click", () => fit());
    $("fit-connections").addEventListener("click", fitConnections);
    for (const mode of ["outgoing", "incoming", "all"])
      $(`connections-${mode}`).addEventListener("click", () => {
        connectionDirection = mode;
        connectionFocus(null);
        drawEdges();
        for (const section of $("inspector").querySelectorAll(
          "[data-direction]",
        ))
          section.open = mode === "all" || mode === section.dataset.direction;
      });
    $("focus").addEventListener("click", () => {
      if (selected) fit(rect(nodes.get(selected)));
    });
    $("review-open").addEventListener("click", () => openReview());
    $("review-filter").addEventListener("change", renderReview);
    $("history-open").addEventListener("click", () => {
      renderHistory();
      $("history-dialog").showModal();
    });
    $("screen-form").addEventListener("input", (event) => {
      if (
        !editor.originalId &&
        event.target === field($("screen-form"), "title") &&
        !field($("screen-form"), "id").dataset.manuallyEdited
      )
        field($("screen-form"), "id").value = slug(event.target.value);
      if (event.target === field($("screen-form"), "id"))
        event.target.dataset.manuallyEdited = "true";
      persistEditor();
    });
    $("screen-form").addEventListener("submit", saveEditor);
    $("editor-dialog").addEventListener("close", persistEditor);
    $("action-add").addEventListener("click", () => {
      editor.node.contract.actions.push({
        id: `action-${uuid().slice(0, 8)}`,
        label: "",
        to: null,
        condition: "",
        effect: "",
        kind: "navigation",
      });
      renderActionFields();
      persistEditor();
    });
    $("editor-discard").addEventListener("click", () => {
      if (
        confirm(
          "Discard this browser draft? Saved project contracts stay unchanged.",
        )
      ) {
        saveDraft(`screen:${editor.originalId || "new"}`, null);
        editor = null;
        $("editor-dialog").close();
      }
    });
    $("settings-form").addEventListener("submit", saveSettings);
    $("group-add").addEventListener("click", () => {
      const last = settings.project.groups.at(-1);
      settings.project.groups.push({
        id: `chapter-${uuid().slice(0, 8)}`,
        title: "New group",
        note: "",
        x: last ? last.x + last.w + 140 : 80,
        y: 80,
        w: 1800,
        h: 700,
      });
      renderSettingsFields();
    });
    $("document-add").addEventListener("click", () => {
      settings.project.documents.push({
        id: `document-${uuid().slice(0, 8)}`,
        title: "New document",
        body: "",
      });
      renderSettingsFields();
    });
    $("comment-body").addEventListener("input", () => {
      if (commentDraft) {
        if (commentDraft.body !== $("comment-body").value) {
          commentDraft.body = $("comment-body").value;
          commentDraft.operationId = uuid();
        }
        saveDraft("comment", commentDraft);
      }
    });
    $("comment-discard").addEventListener("click", () => {
      saveDraft("comment", null);
      commentDraft = null;
      $("comment-body").value = "";
      $("comment-dialog").close();
    });
    $("comment-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = event.submitter;
      submit.disabled = true;
      try {
        commentDraft.body = $("comment-body").value;
        await command("comment", commentDraft);
        saveDraft("comment", null);
        const id = commentDraft.id;
        commentDraft = null;
        $("comment-dialog").close();
        await refresh();
        openReview(id);
      } catch (error) {
        $("comment-error").textContent =
          `Save not confirmed: ${error.message}. Your draft and save identity are kept.`;
      } finally {
        submit.disabled = false;
      }
    });
    for (const id of ["design-image", "capture-image"]) {
      $(id).addEventListener("load", () => {
        $(id).dataset.loaded = "true";
        renderImageDecisions();
        drawImagePins();
      });
      $(id).addEventListener("error", () => {
        $(id).dataset.loaded = "error";
        renderImageDecisions();
        toast(
          "Image missing or unreadable. Restore its exact bytes before reviewing.",
          true,
        );
      });
    }
    $("cards").addEventListener("load", drawPins, true);
    bindNavigation();
    window.addEventListener("beforeunload", (event) => {
      if (
        editor ||
        commentDraft ||
        captureDraftForms.size ||
        $("thread-detail").querySelector("textarea")?.value
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    await refresh();
    async function poll() {
      if (!readonly()) await refresh();
      pollTimer = setTimeout(poll, document.hidden ? 15000 : 4000);
    }
    if (!readonly()) pollTimer = setTimeout(poll, 4000);
    // Read-only diagnostics support performance checks without exposing writes.
    window.ATLAS_DIAGNOSTICS = () => ({
      screens: nodes.size,
      mountedCards: cards.size,
      loadedThumbnails: [...$("cards").querySelectorAll("img[src]")].length,
      selected,
      enabledGroups: [...enabled],
      routedConnections: $("edges").querySelectorAll(".edge-path").length,
      readonly: readonly(),
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
