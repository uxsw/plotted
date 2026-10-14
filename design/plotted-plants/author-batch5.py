import json, math, random

LEAF = [[0, 0.4], [0.4, 1], [1, 0.15]]
TAPER = [[0, 1], [1, 0.12]]
STEM = [[0, 1], [0.6, 0.72], [1, 0.5]]

def cub(p0, p1, p2, p3, u):
    a = (1-u)**3; b = 3*(1-u)**2*u; c = 3*(1-u)*u*u; d = u**3
    return (a*p0[0]+b*p1[0]+c*p2[0]+d*p3[0], a*p0[1]+b*p1[1]+c*p2[1]+d*p3[1])

def sample(segs, step=2.0):
    pts = []
    for s in segs:
        for k in range(101):
            pts.append(cub(*s, k/100))
    out = [pts[0]]; cum = [0.0]
    for p in pts[1:]:
        d = math.hypot(p[0]-out[-1][0], p[1]-out[-1][1])
        if d >= step:
            out.append(p); cum.append(cum[-1]+d)
    return out, cum

def at(pts, cum, s):
    i = min(range(len(cum)), key=lambda k: abs(cum[k]-s))
    p = pts[i]; q = pts[min(i+3, len(pts)-1)]; p0 = pts[max(i-3, 0)]
    return p, math.atan2(q[1]-p0[1], q[0]-p0[0])

def d_of(segs):
    d = f"M{segs[0][0][0]} {segs[0][0][1]}"
    for s in segs:
        d += " C" + " ".join(f"{x} {y}" for x, y in s[1:])
    return d

def stem(id_, segs, width, pin=False, wob=None):
    o = {"id": id_, "width": width, "profile": STEM, "pinStart": pin, "d": d_of(segs)}
    if wob: o["wobble"] = wob
    return o

def leaflet(id_, b, ang, L, w=5.6, curve=0.35, wob=0.8):
    tip = (b[0]+L*math.cos(ang), b[1]+L*math.sin(ang))
    c = (b[0]+0.5*L*math.cos(ang+curve), b[1]+0.5*L*math.sin(ang+curve))
    return {"id": id_, "width": w, "profile": LEAF, "wobble": wob,
            "d": f"M{b[0]:.1f} {b[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {tip[0]:.1f} {tip[1]:.1f}"}

def line(id_, a, b, w=3.2, prof=TAPER, wob=0.5, pin=False):
    return {"id": id_, "width": w, "profile": prof, "wobble": wob, "pinStart": pin,
            "d": f"M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}"}

def curve(id_, d, w=3.4, prof=None, wob=0.8):
    return {"id": id_, "width": w, "profile": prof or [[0, 0.7], [0.5, 1], [1, 0.35]], "wobble": wob, "d": d}

def loop(id_, cx, cy, a, b, rot, w=4.2):
    k = 0.5523
    def P(x, y):
        return (cx + x*math.cos(rot) - y*math.sin(rot), cy + x*math.sin(rot) + y*math.cos(rot))
    pts = [P(-a, 0), P(-a, -k*b), P(-k*a, -b), P(0, -b), P(k*a, -b), P(a, -k*b), P(a, 0),
           P(a, k*b), P(k*a, b), P(0, b), P(-k*a, b), P(-a, k*b), P(-a, 0)]
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(1, 13, 3):
        d += " C" + " ".join(f"{x:.1f} {y:.1f}" for x, y in pts[i:i+3])
    return {"id": id_, "width": w, "profile": [[0, 0.8], [0.5, 1], [1, 0.75]], "wobble": 0.9, "pinStart": False, "d": d}


import math, random, json

def mk_leafl(LV):
    def leafl(x, y, ang, L, w, bend, teeth=4, serr=0.05):
        LV.append({"type": "leaflet", "x": round(x,1), "y": round(y,1), "ang": round(ang,3), "len": round(L,1), "w": round(w,1),
                   "teeth": teeth, "serr": serr, "bend": round(bend,2)})
    return leafl

def plant(title, seed, wob=2.0, over=True):
    return {"title": title, "seed": seed, "wobble": wob, "width": 8, "inkOverHeads": over, "strokes": [], "heads": [], "leaves": []}

def wisps(S, name, tip, cx, cy, rx, ry, n=3):
    for j in range(n):
        fx = (j - (n-1)/2) * 0.55
        t = (cx + fx*rx, cy - ry*(0.55 if j == n//2 else 0.25))
        mid = ((tip[0]+t[0])/2 + (j-(n-1)/2)*3, (tip[1]+t[1])/2)
        S.append({"id": f"{name}-w{j}", "width": 2.8, "profile": [[0,1],[1,0.15]], "wobble": 0.8, "pinStart": False,
                  "d": f"M{tip[0]} {tip[1]} Q{mid[0]:.1f} {mid[1]:.1f} {t[0]:.1f} {t[1]:.1f}"})

# ================= ALCHEMILLA (mound) =================
rnd = random.Random(131)
al = plant("Alchemilla", 131); S = al["strokes"]; HD = al["heads"]; LV = al["leaves"]
base = (220, 620)
placed = []
tries = 0
while len(placed) < 24 and tries < 12000:
    tries += 1
    a = math.radians(rnd.uniform(186, 354)); r = rnd.uniform(60, 168)
    cx, cy = base[0] + r*math.cos(a), base[1] + r*math.sin(a)*0.78
    rad = rnd.uniform(17, 25)
    if cy + rad*1.2 > 614 or cx < 30 or cx > 410: continue
    if all(math.hypot(cx-px, cy-py) > (rad+pr)*0.92 for px, py, pr in placed):
        placed.append((cx, cy, rad))
for i, (cx, cy, rad) in enumerate(placed):
    dx, dy = cx - base[0], cy - base[1]
    c1 = (base[0] + dx*0.1, base[1] + dy*0.55); c2 = (base[0] + dx*0.55, base[1] + dy*0.95)
    ex, ey = cx - dx/ max(math.hypot(dx,dy),1)*rad*0.7, cy - dy/max(math.hypot(dx,dy),1)*rad*0.7
    S.append({"id": f"pet-{i}", "width": 3.6, "profile": [[0,1],[1,0.6]], "wobble": 1.0, "pinStart": False,
              "d": f"M{base[0]} 620 C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {ex:.1f} {ey:.1f}"})
    LV.append({"type": "blob", "cx": round(cx,1), "cy": round(cy,1), "rx": round(rad,1), "ry": round(rad*0.88,1), "rot": round(math.degrees(math.atan2(dy,dx)),1),
               "lumps": 16, "rough": 0.04, "jag": 0.015, "bristle": 0.11})
sprays = [((150,630),(140,330)), ((190,630),(188,290)), ((240,630),(246,282)), ((292,630),(300,322)), ((332,630),(344,372))]
for i, (b0, tip) in enumerate(sprays):
    bx = 200 + (i-2)*14
    mid = ((bx+tip[0])/2 + (i-2)*8, (620+tip[1])/2)
    S.append({"id": f"spray-{i}", "width": 5, "profile": [[0,1],[1,0.4]], "pinStart": False,
              "d": f"M{bx} 620 Q{mid[0]:.1f} {mid[1]:.1f} {tip[0]} {tip[1]}"})
    cx, cy = tip[0], tip[1] - 22
    HD.append({"type": "cluster", "cx": cx, "cy": cy, "scatter": 24, "rx": 28, "ry": 22, "dotR": [3.2, 5.6]})
    wisps(S, f"spray-{i}", tip, cx, cy, 28, 22)
json.dump(al, open("data/alchemilla.json", "w"), indent=1)

# ================= THYME (mat) =================
rnd = random.Random(149)
th = plant("Thyme", 149, 1.6, False); S = th["strokes"]; HD = th["heads"]; LV = th["leaves"]; leafl = mk_leafl(LV)
n = 17
for i in range(n):
    bx = 60 + i*(320/(n-1)) + rnd.uniform(-6, 6)
    h = 24 + 34*math.sin(math.pi*(bx-60)/320) + rnd.uniform(-5, 9)
    drift = (bx-220)*0.1 + rnd.uniform(-22, 22)
    ex, ey = bx + drift, 620 - h
    d = f"M{bx:.1f} 620 C{bx+drift*0.1:.1f} {620-h*0.45:.1f} {bx+drift*0.7:.1f} {620-h*0.8:.1f} {ex:.1f} {ey:.1f}"
    S.append({"id": f"tw-{i}", "width": 4.2, "profile": [[0,1],[1,0.45]], "wobble": 1.2, "pinStart": False, "d": d})
    cubs = [((bx,620),(bx+drift*0.1,620-h*0.45),(bx+drift*0.7,620-h*0.8),(ex,ey))]
    pts, cum = sample(cubs); tot = cum[-1]
    s_ = 14; side = -1
    while s_ < tot - 6:
        p, ang = at(pts, cum, s_)
        L = rnd.uniform(12, 17)
        leafl(p[0], p[1], ang + side*math.radians(rnd.uniform(48, 66)), L, L*0.44, 0.1*side, 2, 0.0)
        side = -side; s_ += rnd.uniform(7, 10)
    HD.append({"type": "cluster", "cx": round(ex,1), "cy": round(ey-9,1), "scatter": 9, "rx": 17, "ry": 10, "dotR": [3.4, 5.6]})
for k, (x, y) in enumerate(((130,540),(226,520),(318,536))):
    bx = x + rnd.uniform(-6, 6)
    S.append({"id": f"fl-{k}", "width": 3.6, "profile": [[0,1],[1,0.5]], "wobble": 1.0, "pinStart": False,
              "d": f"M{bx:.1f} 620 Q{(bx+x)/2+6:.1f} {(620+y)/2:.1f} {x} {y}"})
    HD.append({"type": "cluster", "cx": x, "cy": y-9, "scatter": 9, "rx": 16, "ry": 11, "dotR": [3.4, 5.6]})
json.dump(th, open("data/thyme.json", "w"), indent=1)

# ================= FERN =================
rnd = random.Random(163)
fe = plant("Fern", 163, 2.0, False); S = fe["strokes"]; HD = fe["heads"]; LV = fe["leaves"]; leafl = mk_leafl(LV)
tips = [(52,470),(92,380),(150,330),(214,312),(282,334),(344,386),(386,474)]
for i, (tx, ty) in enumerate(tips):
    bx = 220 + (i-3)*5
    dx = tx - bx; H = 620 - ty
    cub_ = ((bx,620),(bx+dx*0.12, 620-H*0.75),(bx+dx*0.62, ty-26),(tx, ty+14))
    S.append(stem(f"frond-{i}", [cub_], 6.4, wob=1.2))
    pts, cum = sample([cub_]); tot = cum[-1]
    s_ = 64; side = -1
    Lmax = 40 if i in (0, 6) else 46
    while s_ < tot - 8:
        p, ang = at(pts, cum, s_)
        frac = s_/tot
        for sd in (-1, 1):
            L = Lmax * (1 - frac)**0.65 * rnd.uniform(0.9, 1.08)
            if L < 7: continue
            leafl(p[0], p[1], ang + sd*math.radians(66), L, L*0.3, 0.22*sd, 3, 0.1)
        s_ += 19
fd = [((204,620),(198,590),(186,552),(192,520)), ((238,620),(246,596),(262,566),(258,540))]
for i, cub_ in enumerate(fd):
    S.append(stem(f"fid-{i}", [cub_], 5.2, wob=0.8))
    ex, ey = cub_[3]
    S.append({"id": f"curl-{i}", "width": 4.4, "profile": [[0,1],[1,0.7]], "wobble": 0.6, "pinStart": False,
              "d": f"M{ex} {ey} C{ex+(8 if i else -8)} {ey-14} {ex+(24 if i else -24)} {ey-6} {ex+(20 if i else -20)} {ey+10}"})
    HD.append({"type": "blob", "cx": ex + (11 if i else -11), "cy": ey - 3, "r": 10, "lumps": 10, "rough": 0.12, "jag": 0.03})
json.dump(fe, open("data/fern.json", "w"), indent=1)

# ================= CAREX (low grass) =================
rnd = random.Random(179)
ca = plant("Carex", 179, 1.8); S = ca["strokes"]; HD = ca["heads"]
BL = [[0, 0.6], [0.35, 1], [1, 0.1]]
n = 24
for i in range(n):
    bx = 196 + i*(48/(n-1)) + rnd.uniform(-2, 2)
    lean = (i-(n-1)/2) * 11
    h = rnd.uniform(120, 200)
    c1 = (bx + lean*0.08, 620 - h*0.5); c2 = (bx + lean*0.9, 620 - h*1.02)
    end = (bx + lean*1.45 + rnd.uniform(-8, 8), 620 - h*0.6 + rnd.uniform(8, 34))
    S.append({"id": f"b-{i}", "width": rnd.uniform(5, 7), "profile": BL, "wobble": 1.3, "pinStart": False,
              "d": f"M{bx:.1f} 620 C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {end[0]:.1f} {end[1]:.1f}"})
stalks = [((212,620),(206,540),(120,470),(78,430)), ((228,620),(236,530),(310,440),(356,420)), ((220,620),(214,520),(180,430),(160,368)), ((226,620),(230,530),(262,440),(274,380))]
for i, cub_ in enumerate(stalks):
    S.append(stem(f"seed-{i}", [cub_], 4.2, wob=1.0))
    pts, cum = sample([cub_]); tot = cum[-1]
    for k, off in enumerate((4, 22, 40)):
        p, ang = at(pts, cum, tot - off)
        HD.append({"type": "blob", "cx": round(p[0],1), "cy": round(p[1]+ (4 if k else 0),1), "rx": 4.8, "ry": 12, "lumps": 9, "rough": 0.1, "jag": 0.03,
                   "rot": round(math.degrees(ang)+90 + (14 if k % 2 else -14),1)})
json.dump(ca, open("data/carex.json", "w"), indent=1)
print("ok")
