#!/usr/bin/env python3
"""Trace circuit outlines from the user's reference images into SVG paths
   for the VELOCITY game (viewBox 0 0 700 600)."""
import cv2, numpy as np, json, os

UP = '/home/user/uploads'
OUT = '/home/user/Velocity/tools/traced'
os.makedirs(OUT, exist_ok=True)

# cut rects = px-roi to zero out: (x0f,y0f,x1f,y1f)
CFG = {
  'baku': dict(f='01_Baku_City_Circuit.png', cuts=[(0,0,0.45,0.30),(0.79,0,1,0.55),(0,0.60,1,1)]),
  'nurburgring': dict(f='02_Nurburgring_Nordschleife.png', cuts=[(0,0,0.46,0.34),(0.79,0,1,1),(0,0.40,0.25,1),(0,0.60,1,1)]),
  'zandvoort': dict(f='03_Circuit_Zandvoort.png', cuts=[(0,0,0.40,0.32),(0,0.60,1,1),(0,0.55,0.14,1)]),
  'shanghai': dict(f='04_Shanghai_International_Circuit_Alt_01.png', cuts=[(0,0,0.32,0.45),(0,0.45,0.16,1),(0.80,0,1,0.20)]),
  'shanghai_alt2': dict(f='05_Shanghai_International_Circuit_Alt_02.png', cuts=[(0,0,0.42,0.28),(0.85,0,1,0.40),(0,0.88,1,1),(0,0.55,0.08,0.88)]),
  'jeddah': dict(f='06_Jeddah_Corniche_Circuit.png', cuts=[(0,0,0.44,0.34),(0.79,0,1,0.55),(0,0.70,1,1),(0.55,0.50,1,0.70),(0,0.70,0.35,1)]),
  'lusail': dict(f='07_Lusail_International_Circuit.png', cuts=[(0,0,0.44,0.34),(0.79,0,1,1),(0,0.53,1,1),(0,0.50,0.20,1)]),
  'cota': dict(f='08_Circuit_of_the_Americas.png', cuts=[(0,0,0.46,0.34),(0.80,0,1,0.60),(0,0.60,1,1),(0,0.50,0.10,1)]),
  'mexico_city': dict(f='09_Autodromo_Hermanos_Rodriguez.png', cuts=[(0,0,0.46,0.34),(0.79,0,1,1),(0,0.58,1,1),(0,0.50,0.12,1)]),
  'hungaroring': dict(f='10_Hungaroring.png', cuts=[(0,0,0.55,0.30),(0.79,0,1,1),(0,0.56,1,1),(0,0.50,0.13,1)]),
  'gilles_villeneuve': dict(f='11_Circuit_Gilles_Villeneuve.png', cuts=[(0,0,0.60,0.30),(0.79,0,1,1),(0,0.60,1,1),(0,0.70,0.15,1)]),
  'albert_park': dict(f='12_Albert_Park_Circuit.png', cuts=[(0,0,1,0.17)]),
  'suzuka': dict(f='13_Suzuka_International_Racing_Course.png', cuts=[(0,0,1,0.15)]),
  # === batch 2 (user posters 14..25) ===
  'silverstone': dict(f='14_Silverstone_Circuit.png', cuts=[(0,0,0.42,0.32),(0.79,0,1,0.60),(0,0.58,1,1),(0,0.50,0.20,1)]),
  'shanghai_alt3': dict(f='15_Shanghai_International_Circuit_Alt_03.png', cuts=[(0,0,1,0.13)]),
  'monza': dict(f='16_Autodromo_Nazionale_Monza.png', cuts=[(0,0,0.42,0.32),(0.79,0,1,0.60),(0,0.58,1,1),(0,0.48,0.18,1)]),
  'marina_bay': dict(f='17_Marina_Bay_Street_Circuit.png', cuts=[(0,0,0.44,0.33),(0.79,0,1,0.58),(0,0.58,1,1)]),
  'spa': dict(f='18_Circuit_de_Spa_Francorchamps.png', cuts=[(0,0,0.44,0.32),(0.79,0,1,0.58),(0,0.58,1,1),(0,0.48,0.20,1)]),
  'red_bull_ring': dict(f='19_Red_Bull_Ring.png', cuts=[(0,0,0.45,0.32),(0.79,0,1,0.60),(0,0.58,1,1),(0,0.52,0.16,1)]),
  'las_vegas': dict(f='20_Las_Vegas_Strip_Circuit.png', cuts=[(0,0,0.44,0.34),(0.79,0,1,0.55),(0,0.55,1,1)]),
  'gilles_villeneuve_alt': dict(f='21_Circuit_Gilles_Villeneuve_Alt.png', cuts=[(0,0,0.42,0.30),(0.79,0,1,0.58),(0,0.60,1,1),(0,0.65,0.16,1)]),
  'shanghai_alt4': dict(f='22_Shanghai_International_Circuit_Alt_04.png', cuts=[(0,0,0.42,0.30),(0.79,0,1,0.62),(0,0.60,1,1),(0,0.72,0.15,1)]),
  'yas_marina': dict(f='23_Yas_Marina_Circuit.png', cuts=[(0,0,0.44,0.35),(0.79,0,1,1),(0,0.62,1,1),(0,0.50,0.20,1)]),
  'miami': dict(f='24_Miami_International_Autodrome.png', cuts=[(0,0,0.42,0.34),(0.79,0,1,0.60),(0,0.58,1,1),(0,0.68,0.14,1)]),
  'barcelona': dict(f='25_Circuit_de_Barcelona_Catalunya.png', cuts=[(0,0,0.50,0.32),(0.79,0,1,0.62),(0,0.58,1,1),(0,0.70,0.12,1)]),
}

def arc_sample(pts, frac):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0, append=pts[:1]), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])[:-1]
    total = seg.sum()
    target = frac * total
    i = int(np.searchsorted(cum, target) % len(pts))
    return pts[i]

results = {}
for tid, cfg in CFG.items():
    img = cv2.imread(os.path.join(UP, cfg['f']))
    assert img is not None, cfg['f']
    H, W = img.shape[:2]
    B, G, R = img[:,:,0], img[:,:,1], img[:,:,2]
    mask = ((R > 185) & (G > 185) & (B > 185)).astype(np.uint8) * 255
    # red corner-marker discs punch holes through the white line at full res:
    # fill small red disc-like components white so the loop stays continuous
    red = ((R > 120) & (G < 80) & (B < 80)).astype(np.uint8) * 255
    nR, labR, statsR, _ = cv2.connectedComponentsWithStats(red)
    redfill = np.zeros_like(mask)
    for i in range(1, nR):
        a = statsR[i, cv2.CC_STAT_AREA]; w = statsR[i, cv2.CC_STAT_WIDTH]; h = statsR[i, cv2.CC_STAT_HEIGHT]
        if 40 < a < 3000 and abs(w - h) / max(w, h) < 0.5:
            redfill[labR == i] = 255
    mask = cv2.bitwise_or(mask, redfill)
    for x0f, y0f, x1f, y1f in cfg['cuts']:
        mask[int(y0f*H):int(y1f*H), int(x0f*W):int(x1f*W)] = 0
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7,7), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask)
    if n < 2: print(f'{tid}: NO COMPONENTS'); continue
    # choose the biggest blob that also spans a sensible bbox (kills text fragments)
    cands = [i for i in range(1, n)
             if stats[i, cv2.CC_STAT_WIDTH] > 0.22*W and stats[i, cv2.CC_STAT_HEIGHT] > 0.18*H]
    best = max(cands, key=lambda i: stats[i, cv2.CC_STAT_AREA]) if cands else 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    comp = np.where(lab == best, 255, 0).astype(np.uint8)
    contours, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours: print(f'{tid}: no contour'); continue
    cont = max(contours, key=cv2.contourArea)
    peri = cv2.arcLength(cont, True)
    approx = cv2.approxPolyDP(cont, 0.0035 * peri, True).reshape(-1, 2).astype(float)
    # scale slightly inward toward centroid (centerline proxy of the thick white line)
    cx, cy = approx.mean(axis=0)
    shrunk = (approx - [cx, cy]) * 0.958 + [cx, cy]
    # normalize to viewBox 0 0 700 600 with margins
    x0, y0 = shrunk.min(axis=0); x1, y1 = shrunk.max(axis=0)
    mx, my = 45, 42
    sx = (700 - 2*mx) / (x1 - x0); sy = (600 - 2*my) / (y1 - y0)
    s = min(sx, sy)
    tx = mx - x0*s + (700 - 2*mx - (x1-x0)*s)/2
    ty = my - y0*s + (600 - 2*my - (y1-y0)*s)/2
    pts = np.round(shrunk * s + [tx, ty]).astype(int)
    # cap vertex count for sane path length
    if len(pts) > 60:
        keep = np.linspace(0, len(pts)-1, 48, dtype=int)
        pts = pts[keep]
    path = 'M ' + ' L '.join(f'{x} {y}' for x, y in pts) + ' Z'
    s1, s2, s3 = [np.round(arc_sample(pts, f)).astype(int) for f in (0.0, 0.33, 0.66)]
    results[tid] = dict(
        svgPath=path,
        sectors=[dict(x=int(s1[0]), y=int(s1[1])), dict(x=int(s2[0]), y=int(s2[1])), dict(x=int(s3[0]), y=int(s3[1]))],
        verts=len(pts)
    )
    # preview render
    canvas = np.zeros((600, 700, 3), np.uint8)
    cv2.polylines(canvas, [pts], True, (255,255,255), 3)
    for p, c in zip([s1, s2, s3], [(0,0,255),(0,255,255),(255,0,255)]):
        cv2.circle(canvas, (int(p[0]), int(p[1])), 8, c, 2)
    cv2.imwrite(f'{OUT}/{tid}.png', canvas)
    print(f'{tid}: {len(pts)} verts, area frac {stats[best,cv2.CC_STAT_AREA]/(W*H):.3f}')

json.dump(results, open(f'{OUT}/paths.json', 'w'), indent=1)
print('saved', f'{OUT}/paths.json')
