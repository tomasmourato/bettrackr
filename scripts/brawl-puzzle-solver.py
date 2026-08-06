#!/usr/bin/env python3
"""
Resolvedor do "Quebra-Cabeca da Imagem" (Missao Fuga da Piramide) do Brawl Stars.

Recebe um screenshot do puzzle 4x4 (um 15-puzzle deslizante) e devolve a ordem
exacta das jogadas: que peca tocar, uma a uma, ate a imagem ficar completa.

Como funciona:
  1. Localiza a grelha 4x4 no screenshot (pecas claras sobre o fundo escuro).
  2. Corta as 16 celulas e deteta qual esta vazia.
  3. Descobre a imagem original por edge-matching com a metrica MGC
     (Mahalanobis Gradient Compatibility) -> onde cada peca pertence.
  4. Resolve o 15-puzzle com IDA* (Manhattan + linear conflict) -> sequencia
     minima de movimentos.
  5. Imprime a ordem das jogadas (linha/coluna + coordenadas de ecra) e grava
     imagens de verificacao (objectivo.png / atual.png) e um taps.sh para adb.

Uso:
  python3 scripts/brawl-puzzle-solver.py screenshot.jpg
  python3 scripts/brawl-puzzle-solver.py screenshot.jpg --out puzzle-out
  python3 scripts/brawl-puzzle-solver.py shot.jpg --grid 869,239,152,146
"""

import argparse
import itertools
import os

import numpy as np
from PIL import Image

N = 4          # grelha 4x4
INSET = 3      # px ignorados no rebordo claro de cada peca
CORNER = 12    # px ignorados nas pontas (cantos arredondados)


# --------------------------------------------------------------------------
# 1. Localizar a grelha e cortar as pecas
# --------------------------------------------------------------------------
def _bands(profile, thr, min_len):
    """Intervalos contiguos onde profile > thr, com comprimento minimo."""
    out, start = [], None
    for i, v in enumerate(profile):
        if v > thr and start is None:
            start = i
        elif v <= thr and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(profile)))
    return [b for b in out if b[1] - b[0] >= min_len]


def find_grid(img):
    """Devolve (x0, y0, pitch, tile): canto da peca (1,1), passo da grelha e
    lado da peca, em pixeis do screenshot.

    As pecas sao claras e estao separadas por goteiras escuras. Primeiro
    delimitamos a grelha em grosso, depois medimos as faixas dentro dessa
    caixa - so ai o contraste peca/goteira e limpo. O passo vem da distancia
    entre inicios de faixa (nao da extensao total, que inclui goteiras).
    """
    a = np.asarray(img.convert("L")).astype(float)
    h, w = a.shape
    y_lo, y_hi = int(h * 0.10), int(h * 0.95)
    x_lo, x_hi = int(w * 0.28), int(w * 0.72)
    sub = a[y_lo:y_hi, x_lo:x_hi]
    mask = sub > np.percentile(sub, 70) * 0.80

    # passo 1: caixa aproximada da grelha
    xs = _bands(mask.mean(axis=0), 0.35, 20)
    ys = _bands(mask.mean(axis=1), 0.35, 20)
    if not xs or not ys:
        raise SystemExit("nao consegui localizar a grelha; passa --grid")
    bx0, bx1 = x_lo + xs[0][0], x_lo + xs[-1][1]
    by0, by1 = y_lo + ys[0][0], y_lo + ys[-1][1]

    # passo 2: faixas medidas so dentro da caixa
    box = a[by0:by1, bx0:bx1]
    bmask = box > np.percentile(box, 70) * 0.80
    approx = min(bx1 - bx0, by1 - by0) / N

    def axis(profile):
        bands = _bands(profile, 0.5, int(approx * 0.5))
        if not bands:
            raise SystemExit("nao consegui medir a grelha; passa --grid")
        starts = [b[0] for b in bands]
        # o inicio de cada faixa cai em start0 + k*pitch; usa o maior vao
        # disponivel para estimar o passo com precisao
        span = starts[-1] - starts[0]
        k = max(1, round(span / approx))
        pitch = span / k if span else approx
        return starts[0], pitch, max(b[1] - b[0] for b in bands)

    ox, px, tx = axis(bmask.mean(axis=0))
    oy, py, ty = axis(bmask.mean(axis=1))
    pitch = (px + py) / 2
    tile = min(max(tx, ty), pitch - 2)
    return float(bx0 + ox), float(by0 + oy), float(pitch), float(tile)


def cut_tiles(img, x0, y0, pitch, tile):
    """Corta as 16 celulas (interior da peca, sem o rebordo claro)."""
    tiles = []
    side = int(round(tile)) - 2 * INSET
    for pos in range(N * N):
        r, c = divmod(pos, N)
        left = int(round(x0 + c * pitch)) + INSET
        top = int(round(y0 + r * pitch)) + INSET
        cell = img.crop((left, top, left + side, top + side))
        tiles.append(np.asarray(cell.convert("RGB")).astype(float))
    return tiles


def detect_blank(tiles):
    """A celula vazia mostra o fundo escuro do portao: e a mais escura e a de
    menor variacao interna."""
    return int(np.argmin([t.mean() + t.std() for t in tiles]))


# --------------------------------------------------------------------------
# 2. Descobrir a imagem original (edge-matching com MGC)
# --------------------------------------------------------------------------
def mgc(A, B):
    """Mahalanobis Gradient Compatibility de A|B (A a esquerda, B a direita).

    Em vez de comparar cores directamente (fraco em arte com gradientes suaves
    e padroes repetidos), modela o gradiente esperado no bordo de A e mede
    quao improvavel e o gradiente que a costura A|B produz. Simetrico.
    """
    def half(A, B):
        s = A.shape[0]
        expected = A[CORNER:s - CORNER, -1] - A[CORNER:s - CORNER, -2]
        mu = expected.mean(axis=0)
        cov = np.cov(expected.T) + np.eye(3)
        actual = B[CORNER:s - CORNER, 0] - A[CORNER:s - CORNER, -1]
        d = actual - mu
        m = (d @ np.linalg.inv(cov) * d).sum(axis=1)
        return np.sqrt(np.maximum(m, 0)).mean()

    # o segundo termo e o mesmo teste visto de B para A (bordos espelhados)
    return half(A, B) + half(B[:, ::-1], A[:, ::-1])


def seam_costs(tiles, pieces):
    """right[i][j] = custo de por j a direita de i; below[i][j] = j abaixo."""
    n = len(pieces)
    right = np.full((n, n), np.inf)
    below = np.full((n, n), np.inf)
    for i, a in enumerate(pieces):
        for j, b in enumerate(pieces):
            if i == j:
                continue
            right[i, j] = mgc(tiles[a], tiles[b])
            below[i, j] = mgc(tiles[a].transpose(1, 0, 2),
                              tiles[b].transpose(1, 0, 2))
    return right, below


def solve_layout(tiles, blank, beam=20000):
    """Arrumacao que minimiza o custo total das costuras, em beam search por
    ordem raster. O buraco pode cair em qualquer slot (o jogo esconde uma peca
    da imagem original). Devolve (layout, custo) onde layout[pos] = indice da
    celula actual que pertence a pos (ou None para o buraco)."""
    pieces = [i for i in range(N * N) if i != blank]
    right, below = seam_costs(tiles, pieces)
    n = len(pieces)

    states = [(0.0, ())]
    for pos in range(N * N):
        r, c = divmod(pos, N)
        nxt = []
        for cost, placed in states:
            used = {p for p in placed if p >= 0}
            has_hole = any(p < 0 for p in placed)
            cands = [p for p in range(n) if p not in used]
            if not has_hole:
                cands.append(-1)
            left = placed[pos - 1] if c > 0 else None
            up = placed[pos - N] if r > 0 else None
            for p in cands:
                extra = 0.0
                if p >= 0:
                    if left is not None and left >= 0:
                        extra += right[left, p]
                    if up is not None and up >= 0:
                        extra += below[up, p]
                nxt.append((cost + extra, placed + (p,)))
        # descarta estados que ja nao conseguem preencher os slots restantes
        rem = N * N - pos - 1
        nxt = [
            s for s in nxt
            if (n - sum(1 for p in s[1] if p >= 0))
            + (0 if any(p < 0 for p in s[1]) else 1) <= rem
        ]
        nxt.sort(key=lambda s: s[0])
        states = nxt[:beam]

    cost, placed = min(states, key=lambda s: s[0])
    return [None if p < 0 else pieces[p] for p in placed], cost


# --------------------------------------------------------------------------
# 3. Resolver o 15-puzzle (IDA* com Manhattan + linear conflict)
# --------------------------------------------------------------------------
def heuristic(state, goal_of):
    h = 0
    rows = [[] for _ in range(N)]
    cols = [[] for _ in range(N)]
    for pos, v in enumerate(state):
        if v is None:
            continue
        r, c = divmod(pos, N)
        gr, gc = divmod(goal_of[v], N)
        h += abs(r - gr) + abs(c - gc)
        if r == gr:
            rows[r].append((c, gc))
        if c == gc:
            cols[c].append((r, gr))
    for group in rows + cols:
        group.sort()
        for (_, ga), (_, gb) in itertools.combinations(group, 2):
            if ga > gb:
                h += 2   # conflito linear: uma das duas tem de sair e voltar
    return h


def neighbours(blank):
    """Vizinhos do buraco: (posicao da peca que se move, direccao do movimento
    dessa peca)."""
    r, c = divmod(blank, N)
    if r > 0:
        yield blank - N, "baixo"
    if r < N - 1:
        yield blank + N, "cima"
    if c > 0:
        yield blank - 1, "direita"
    if c < N - 1:
        yield blank + 1, "esquerda"


def solvable(start, goal):
    """Cada jogada troca o buraco com uma vizinha: inverte a paridade da
    permutacao e muda a distancia do buraco em 1. Logo (inversoes + distancia do
    buraco) tem paridade constante, e no objectivo vale zero.

    A permutacao tem de incluir o buraco. Contar so as 15 pecas da a paridade
    errada sempre que o buraco muda de casa - metade dos casos - e ai o
    resolvedor ou rejeita um puzzle bom ou persegue um objectivo inalcancavel.
    """
    order = {v: i for i, v in enumerate(goal)}   # o buraco (None) tambem conta
    perm = [order[v] for v in start]
    inv = sum(1 for i in range(len(perm)) for j in range(i + 1, len(perm))
              if perm[i] > perm[j])
    sb, gb = start.index(None), goal.index(None)
    dist = abs(sb // N - gb // N) + abs(sb % N - gb % N)
    return inv % 2 == dist % 2


def solve_puzzle(start, goal, max_depth=80):
    """IDA*. Devolve a lista minima de (posicao tocada, direccao)."""
    goal_of = {v: i for i, v in enumerate(goal) if v is not None}
    state = list(start)
    path = []

    def dfs(blank, g, bound, prev):
        h = heuristic(state, goal_of)
        if g + h > bound:
            return g + h
        if h == 0:
            return True
        best = float("inf")
        scored = []
        for src, direction in neighbours(blank):
            if src == prev:
                continue          # nao desfazer a jogada anterior
            state[blank], state[src] = state[src], None
            scored.append((heuristic(state, goal_of), src, direction))
            state[src], state[blank] = state[blank], None
        for _, src, direction in sorted(scored):
            state[blank], state[src] = state[src], None
            path.append((src, direction))
            t = dfs(src, g + 1, bound, blank)
            if t is True:
                return True
            best = min(best, t)
            path.pop()
            state[src], state[blank] = state[blank], None
        return best

    bound = heuristic(state, goal_of)
    while bound <= max_depth:
        t = dfs(state.index(None), 0, bound, -1)
        if t is True:
            return list(path)
        bound = t
    raise SystemExit("sem solucao dentro do limite de profundidade")


# --------------------------------------------------------------------------
# 4. Saida
# --------------------------------------------------------------------------
def cell_name(idx):
    return f"L{idx // N + 1}C{idx % N + 1}"


def render(img, x0, y0, pitch, tile, layout, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    side = int(round(tile))

    def cell(idx):
        r, c = divmod(idx, N)
        left, top = int(round(x0 + c * pitch)), int(round(y0 + r * pitch))
        return img.crop((left, top, left + side, top + side))

    for fname, arrangement in (
        ("objectivo.png", layout),
        ("atual.png", list(range(N * N))),
    ):
        canvas = Image.new("RGB", (side * N, side * N), (45, 32, 50))
        for pos, src in enumerate(arrangement):
            if src is None:
                continue
            canvas.paste(cell(src), ((pos % N) * side, (pos // N) * side))
        canvas.save(os.path.join(out_dir, fname))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("screenshot")
    ap.add_argument("--grid", help="x0,y0,pitch,tile (salta a auto-deteccao)")
    ap.add_argument("--out", default="puzzle-out")
    args = ap.parse_args()

    img = Image.open(args.screenshot).convert("RGB")
    if args.grid:
        x0, y0, pitch, tile = (float(v) for v in args.grid.split(","))
    else:
        x0, y0, pitch, tile = find_grid(img)
    print(f"grelha: x0={x0:.0f} y0={y0:.0f} passo={pitch:.1f} peca={tile:.0f}")

    tiles = cut_tiles(img, x0, y0, pitch, tile)
    blank = detect_blank(tiles)
    print(f"buraco agora em {cell_name(blank)}")

    layout, cost = solve_layout(tiles, blank)
    print(f"custo das costuras: {cost:.1f}")
    print("\nimagem correcta (cada casa = a peca que hoje esta nessa celula):")
    for r in range(N):
        print("".join("  ----  " if layout[r * N + c] is None
                      else f" {cell_name(layout[r * N + c])}  "
                      for c in range(N)))

    start = tuple(None if i == blank else i for i in range(N * N))
    goal = tuple(layout)
    if not solvable(start, goal):
        raise SystemExit("estado impossivel: a reconstrucao esta errada "
                         "(confirma objectivo.png)")

    path = solve_puzzle(start, goal)
    print(f"\nsolucao minima: {len(path)} jogadas\n")

    state = list(start)
    taps = []
    for i, (src, direction) in enumerate(path, 1):
        r, c = divmod(src, N)
        cx = int(round(x0 + c * pitch + tile / 2))
        cy = int(round(y0 + r * pitch + tile / 2))
        print(f"{i:3d}. toca {cell_name(src)}  (x={cx}, y={cy})  "
              f"-> a peca desliza para {direction}")
        taps.append((cx, cy))
        b = state.index(None)
        state[b], state[src] = state[src], None
    assert tuple(state) == goal, "a sequencia nao chega ao objectivo"

    render(img, x0, y0, pitch, tile, layout, args.out)
    with open(os.path.join(args.out, "taps.sh"), "w") as f:
        f.write("#!/bin/sh\n# toques em sequencia; requer adb e o ecra na "
                "mesma orientacao/resolucao do screenshot\n")
        for cx, cy in taps:
            f.write(f"adb shell input tap {cx} {cy}\nsleep 0.45\n")
    os.chmod(os.path.join(args.out, "taps.sh"), 0o755)
    print(f"\nverificacao: {args.out}/objectivo.png (imagem montada) "
          f"e {args.out}/atual.png")
    print(f"toques automaticos: {args.out}/taps.sh")


if __name__ == "__main__":
    main()
