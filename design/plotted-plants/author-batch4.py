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

# ================= EUPHORBIA (redraw) =================
rnd = random.Random(37)
eu = {"title": "Euphorbia characias", "seed": 37, "wobble": 2.0, "width": 9, "inkOverHeads": True, "strokes": [], "heads": [], "leaves": []}
S = eu["strokes"]; HD = eu["heads"]; LV = eu["leaves"]; leafl = mk_leafl(LV)
stems = [  # (cubic, width, dome centre-x offset handled automatically, rx, ry)
  (((222,620),(214,490),(232,330),(222,168)), 10.5, 50, 34),
  (((204,620),(194,510),(166,380),(148,250)), 9, 40, 28),
  (((240,620),(252,510),(292,400),(306,262)), 9, 40, 28),
  (((190,620),(168,540),(108,450),(84,346)), 8, 32, 23),
  (((252,620),(274,545),(346,480),(372,358)), 8, 32, 23),
]
for i, (cub_, w, rx, ry) in enumerate(stems):
    S.append(stem(f"stem-{i}", [cub_], w))
    pts, cum = sample([cub_]); tot = cum[-1]
    s_ = (96 if i else 70) + rnd.uniform(0, 10); side = -1
    while s_ < tot - 54:
        p, ang = at(pts, cum, s_)
        frac = s_/tot
        L = 40*(1 - 0.42*frac) * rnd.uniform(0.85, 1.15)
        leafl(p[0], p[1], ang + side*math.radians(46 + rnd.uniform(-6, 8)), L, L*0.25, 0.16*side, 3, 0.0)
        side = -side; s_ += 12.5 * rnd.uniform(0.85, 1.2)
    tip = cub_[3]
    cx, cy = tip[0], tip[1] - 10
    HD.append({"type": "cluster", "cx": cx, "cy": cy, "scatter": 30 if rx > 40 else 22, "rx": rx, "ry": ry, "dome": True, "pack": 0.5, "dotR": [7, 12] if rx > 40 else [6, 10]})
    for j, a in enumerate((-155, -122, -90, -58, -25)):
        ex = cx + 0.82*rx*math.cos(math.radians(a)); ey = cy + 0.82*ry*math.sin(math.radians(a))
        S.append({"id": f"ray-{i}-{j}", "width": 3, "profile": [[0,1],[1,0.2]], "wobble": 0.8, "pinStart": False,
                  "d": f"M{tip[0]} {tip[1]+4} Q{(tip[0]+ex)/2 + (j-2)*2:.1f} {(tip[1]+ey)/2:.1f} {ex:.1f} {ey:.1f}"})
for ang_deg, bx, L, w, bnd in ((-128, 208, 96, 20, 0.2), (-52, 236, 92, 19, -0.2), (-104, 222, 70, 16, 0.1)):
    leafl(bx, 620, math.radians(ang_deg), L, w, bnd, 5, 0.04)
json.dump(eu, open("data/euphorbia.json", "w"), indent=1)
print(len(S), len(LV), len(HD))
