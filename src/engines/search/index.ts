/*
 * Grid route search for lesson 1: BFS, Dijkstra, A* and Greedy best-first on a small city.
 * Same city and the same search logic as the legacy page, so the numbers match.
 */

export const W = 33;
export const H = 21;

export const ROAD = 0;
export const BUILDING = 1;
export const WATER = 2;
export const BRIDGE = 3;
export const CONGESTED = 4;
export const BLOCKED = 5;
export type Tile = 0 | 1 | 2 | 3 | 4 | 5;

export const BRIDGES_X = [4, 24];

export interface Cell {
  x: number;
  y: number;
}

export interface City {
  grid: Tile[][];
  start: Cell;
  goal: Cell;
  /** What a blocked cell was before it was blocked, by key y*W+x. */
  original: Record<number, Tile>;
}

export type Alg = 'bfs' | 'dijkstra' | 'astar' | 'greedy';
export const ALGS: Alg[] = ['bfs', 'dijkstra', 'astar', 'greedy'];

export interface SearchResult {
  alg: Alg;
  /** Cell keys in the order they were checked. */
  order: number[];
  /** Cell keys of the route, start to goal; empty when there is none. */
  path: number[];
  /** Trip time in minutes. */
  travel: number;
  jam: number;
  clear: number;
  /** Minutes so far at each step of the path. */
  cum: number[];
  found: boolean;
}

export const key = (x: number, y: number) => y * W + x;
export const cellOf = (k: number): Cell => ({ x: k % W, y: Math.floor(k / W) });

export function buildCity(): City {
  const grid: Tile[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < W; x++) row.push(x % 4 === 0 || y % 4 === 0 ? ROAD : BUILDING);
    grid.push(row);
  }
  for (let x = 0; x < W; x++)
    for (let y = 9; y <= 11; y++) grid[y][x] = BRIDGES_X.includes(x) ? BRIDGE : WATER;
  // A jammed market district (south side) and a busy road (north side).
  for (let y = 13; y <= 19; y++) for (let x = 4; x < W; x++) if (grid[y][x] === ROAD) grid[y][x] = CONGESTED;
  for (let x = 0; x <= 12; x++) if (grid[4][x] === ROAD) grid[4][x] = CONGESTED;
  return { grid, start: { x: 0, y: 0 }, goal: { x: 32, y: 20 }, original: {} };
}

export const cost = (t: Tile) => (t === CONGESTED ? 4 : 1);

export function passable(city: City, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const t = city.grid[y][x];
  return t === ROAD || t === BRIDGE || t === CONGESTED;
}

export function search(city: City, alg: Alg): SearchResult {
  const { grid, start, goal } = city;
  const h = (x: number, y: number) => Math.abs(x - goal.x) + Math.abs(y - goal.y);
  const g: Record<number, number> = {};
  const prev: Record<number, number> = {};
  const closed: Record<number, boolean> = {};
  const order: number[] = [];
  const open = [{ x: start.x, y: start.y, f: 0, n: 0 }];
  let counter = 0;
  g[key(start.x, start.y)] = 0;
  while (open.length) {
    let bi = 0;
    if (alg !== 'bfs')
      for (let i = 1; i < open.length; i++)
        if (open[i].f < open[bi].f || (open[i].f === open[bi].f && open[i].n < open[bi].n)) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.x, cur.y);
    if (closed[ck]) continue;
    closed[ck] = true;
    order.push(ck);
    if (cur.x === goal.x && cur.y === goal.y) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!passable(city, nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed[nk]) continue;
      const ng = g[ck] + (alg === 'bfs' ? 1 : cost(grid[ny][nx]));
      if (g[nk] == null || ng < g[nk]) {
        if (alg === 'bfs' && g[nk] != null) continue;
        g[nk] = ng;
        prev[nk] = ck;
        const f =
          alg === 'dijkstra' ? ng : alg === 'astar' ? ng + h(nx, ny) : alg === 'greedy' ? h(nx, ny) : 0;
        open.push({ x: nx, y: ny, f, n: counter++ });
      }
    }
  }
  const gk = key(goal.x, goal.y);
  const path: number[] = [];
  if (closed[gk]) for (let k: number | undefined = gk; k != null; k = prev[k]) path.unshift(k);
  let travel = 0;
  let jam = 0;
  let clear = 0;
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    const c = cost(grid[Math.floor(path[i] / W)][path[i] % W]);
    travel += c;
    cum.push(travel);
    if (c > 1) jam++;
    else clear++;
  }
  return { alg, order, path, travel, jam, clear, cum, found: path.length > 0 };
}

const cloneCity = (c: City): City => ({
  grid: c.grid.map((r) => r.slice()),
  start: { ...c.start },
  goal: { ...c.goal },
  original: { ...c.original },
});

/** Close a bridge for repairs (all three of its cells). */
export function blockBridge(city: City, bx: number): City {
  const c = cloneCity(city);
  for (let y = 9; y <= 11; y++)
    if (c.grid[y][bx] === BRIDGE) {
      c.original[key(bx, y)] = BRIDGE;
      c.grid[y][bx] = BLOCKED;
    }
  return c;
}

export const isEnd = (city: City, p: Cell) =>
  (p.x === city.start.x && p.y === city.start.y) || (p.x === city.goal.x && p.y === city.goal.y);

/** Block an open road or bridge cell, or reopen a blocked one. Returns the same city if nothing changed. */
export function setBlocked(city: City, p: Cell, blocked: boolean): City {
  if (p.x < 0 || p.y < 0 || p.x >= W || p.y >= H || isEnd(city, p)) return city;
  const t = city.grid[p.y][p.x];
  const k = key(p.x, p.y);
  if (blocked && (t === ROAD || t === BRIDGE || t === CONGESTED)) {
    const c = cloneCity(city);
    c.original[k] = t;
    c.grid[p.y][p.x] = BLOCKED;
    return c;
  }
  if (!blocked && t === BLOCKED) {
    const c = cloneCity(city);
    c.grid[p.y][p.x] = city.original[k] ?? ROAD;
    return c;
  }
  return city;
}

export function moveEnd(city: City, which: 'start' | 'goal', p: Cell): City {
  if (!passable(city, p.x, p.y)) return city;
  const c = cloneCity(city);
  c[which] = { ...p };
  return c;
}
