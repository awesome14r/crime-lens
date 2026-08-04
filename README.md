# CrimeLens — Crime Investigation Dashboard

A dark-mode, high-density intelligence dashboard for connecting suspects, evidence,
incidents, and locations across a case. Built with React 18, Vite, Tailwind CSS,
React-Leaflet, React Flow, and D3-Force.

> All case data, names, and imagery placeholders in this project are fictional
> mock data for demonstration purposes.

---

## Features

- **Global header** — case switcher, global search (highlights matches across the
  map, graph, suspect matrix, and evidence wall), a command palette trigger,
  theme toggle, and a JSON case briefing export.
- **Command Palette** (`⌘K` / `Ctrl+K`) — jump straight to any suspect, location,
  evidence item, or tab by typing a few characters. Arrow keys to navigate,
  `Enter` to jump, `Esc` to close.
- **Temporal Scrubber / Case Replay** — a global timeline slider (visible on
  Map, Graph, and Timeline) that reveals pins, graph nodes, and edges in
  chronological order as you drag it, or hit ▶ to auto-play the case unfolding
  from open to present. "Full Case" resets to the unfiltered view.
- **Interactive Crime Map** (`Map View`) — dark tactical tile layer, color-coded
  pins for incidents / evidence drops / suspect sightings, a density heatmap
  toggle, and a layer filter. Clicking a pin opens the entity inspector and
  cross-highlights the network graph. Respects the temporal scrubber.
- **Entity Relationship Network Graph** (`Graph View`) — force-directed layout
  (computed with `d3-force`, then made fully interactive by React Flow): drag
  nodes, zoom/pan, hover a node to highlight its first-degree connections, click
  a node to open its detail drawer.
  - **Corkboard mode** — toggle to an alternate red-string corkboard
    visualization of the exact same graph model: polaroid/index-card style
    nodes pinned to a cork background, connected by sagging red string. Pan by
    dragging, zoom with the scroll wheel.
  - **Connection Finder** — pick any two suspects and it runs a breadth-first
    search across the full entity graph (suspects, locations, evidence all
    count as hops) and highlights the shortest connecting chain, in both graph
    modes.
- **Suspect Matrix** (`Suspect Matrix`) — searchable, filterable (threat level,
  status) profile cards with linked-evidence counts and primary connections.
- **Evidence Wall** (`Evidence Wall`) — categorized evidence (Digital / Physical /
  Document) with confidence scores, chain-of-custody state, and tag badges.
- **Timeline** (`Timeline`) — horizontal, filterable case timeline plus a case
  progress tracker (Evidence Collection → Warrant Issued → Suspect Interrogated →
  Case Closed, etc). Clicking any event jumps the global replay cursor to it.
- **AI Insights** (`AI Insights`) — two layers of analysis:
  1. **Local pattern analysis** runs instantly, no API key required: most-connected
     suspect, overlapping activity windows between suspects, strongest/weakest
     evidence, and high-priority at-large suspects.
  2. **Live AI analysis** (optional) — paste your own Anthropic API key to have
     Claude generate a plain-English case summary plus additional flagged
     insights, called directly from the browser. See the security note below
     before using this in anything other than local/demo use.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later (comes with Node.js)

## Installation

```bash
# 1. Unzip the project, then move into the folder
cd crimelens

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`) — open it in
your browser.

### Production build

```bash
npm run build      # outputs static files to ./dist
npm run preview    # serve the production build locally to sanity-check it
```

---

## Project structure

```
crimelens/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Layout shell + tab navigation
    ├── index.css                 # Tailwind layers + Leaflet/React Flow overrides
    ├── theme.js                   # Dark/light class-token helper
    ├── context/
    │   └── CaseContext.jsx       # Global state: active case, selection, search,
    │                              #  temporal scrubber, command palette, theme
    ├── data/
    │   └── mockData.js            # Two fictional cases: suspects, locations,
    │                              #  evidence, graph edges, timeline, milestones
    ├── utils/
    │   ├── date.js                # Case date parsing + timeline range helpers
    │   └── graphLayout.js         # Shared d3-force layout model + BFS pathfinder,
    │                              #  reused by the force graph and corkboard views
    ├── services/
    │   └── insights.js            # Heuristic insight engine + live Claude API call
    └── components/
        ├── Header.jsx
        ├── CommandPalette.jsx
        ├── TemporalScrubber.jsx
        ├── CrimeMap.jsx
        ├── GraphViewTab.jsx        # Wraps the graph views + connection finder
        ├── NetworkGraph.jsx        # Force-directed graph (React Flow)
        ├── CorkboardView.jsx       # Red-string corkboard alt view
        ├── PathFinder.jsx          # Suspect-to-suspect connection finder panel
        ├── Timeline.jsx
        ├── SuspectDirectory.jsx
        ├── EvidenceLocker.jsx
        ├── AIInsights.jsx
        └── EntityDrawer.jsx        # Shared detail drawer for suspects/locations/evidence
```

## Notes on the mock data

Everything in `src/data/mockData.js` is invented for this demo — two cases,
6 suspects each, 6–7 locations/incidents, 8–10 evidence items, and 15–19 graph
relationships per case. Swap in real data by matching the same shape, or wire
`CaseContext.jsx` up to a real API.

## About the live AI analysis feature

The "Run Live AI Analysis" button in the AI Insights tab calls
`https://api.anthropic.com/v1/messages` **directly from the browser**, using
the `anthropic-dangerous-direct-browser-access` header that Anthropic's API
supports for exactly this "bring your own key" pattern (see
[Anthropic's docs](https://docs.claude.com)). A few things worth knowing:

- Your API key is only ever sent to `api.anthropic.com`. It's stored in this
  browser's `localStorage` (`crimelens_anthropic_api_key`) purely for
  convenience across reloads — nothing else reads or transmits it.
- Because the call is made client-side, **do not** deploy this app publicly
  with your own key hardcoded, and don't paste a production key into a shared
  or hosted demo — anyone with browser dev tools could read it back out. This
  pattern is intended for local development and live demos only. For a real
  deployment, proxy the call through your own backend instead.
- If no key is provided, the tab still works fully via the local heuristic
  engine — the live call is additive, not required.

## Customizing the theme

Color tokens (`void` background scale and `signal` accent colors), fonts, and
the glow/scanline effects all live in `tailwind.config.js`. The dark/light
toggle is driven by `src/theme.js` — extend that file if you want a fuller
light-mode redesign.
