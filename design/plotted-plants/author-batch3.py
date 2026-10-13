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
# ================= ECHINACEA =================
rnd = random.Random(97)
ech = {"title": "Echinacea", "seed": 97, "wobble": 2.0, "width": 9, "inkOverHeads": True, "strokes": [], "heads": [], "leaves": []}
S = ech["strokes"]; LV = ech["leaves"]; HD = ech["heads"]

def leafl(x, y, ang, L, w, bend, teeth=5, serr=0.06):
    LV.append({"type": "leaflet", "x": round(x,1), "y": round(y,1), "ang": round(ang,3), "len": round(L,1), "w": round(w,1),
               "teeth": teeth, "serr": serr, "bend": round(bend,2)})

stems = {
 "s1": [((222,620),(218,520),(230,380),(226,196))],
 "s2": [((240,620),(262,540),(318,440),(322,342))],
 "s3": [((204,620),(190,540),(142,440),(134,374))],
 "s4": [((250,620),(256,560),(276,500),(280,456))],
}
widths = {"s1": 10, "s2": 8.5, "s3": 8, "s4": 7.5}
for k, segs in stems.items():
    S.append(stem(k, segs, widths[k]))

for k, segs, start, step in (("s1", stems["s1"], 150, 104), ("s2", stems["s2"], 140, 96), ("s3", stems["s3"], 130, 90)):
    pts, cum = sample(segs); tot = cum[-1]
    s_ = start; side = -1; n = 0
    while s_ < tot - 120:
        p, ang = at(pts, cum, s_)
        L = rnd.uniform(92, 110) * (1 - 0.3 * s_/tot)
        leafl(p[0], p[1], ang + side*math.radians(rnd.uniform(46, 58)), L, L*0.2, 0.2*side, 8, 0.05)
        side = -side; n += 1; s_ += step * rnd.uniform(0.9, 1.15)

for (bx, ang_deg, L, w, bnd) in ((206, -128, 128, 24, 0.22), (236, -52, 120, 22, -0.22), (220, -102, 98, 19, 0.1), (196, -150, 88, 17, 0.3), (246, -30, 82, 16, -0.3)):
    leafl(bx, 620, math.radians(ang_deg), L, w, bnd, 8, 0.05)

def flower(name, cx, cy, sc, petals=True):
    LV.append({"type": "blob", "cx": cx, "cy": cy, "rx": round(27*sc,1), "ry": round(23*sc,1), "lumps": 26, "rough": 0.05, "jag": 0.02, "bristle": 0.09, "taper": 0.25})
    if not petals:
        return
    base_y = cy + 12*sc
    for ang_deg, bx_off in ((176, -22), (150, -20), (126, -15), (106, -8)):
        a = math.radians(ang_deg + rnd.uniform(-5, 5))
        HD.append({"type": "leaflet", "x": round(cx + bx_off*sc, 1), "y": round(base_y, 1), "ang": round(a, 3),
                   "len": round(rnd.uniform(60, 72)*sc, 1), "w": round(rnd.uniform(12.5, 15)*sc, 1), "teeth": 4, "serr": 0.0, "bend": -0.5})
    for ang_deg, bx_off in ((4, 22), (30, 20), (54, 15), (74, 8)):
        a = math.radians(ang_deg + rnd.uniform(-5, 5))
        HD.append({"type": "leaflet", "x": round(cx + bx_off*sc, 1), "y": round(base_y, 1), "ang": round(a, 3),
                   "len": round(rnd.uniform(60, 72)*sc, 1), "w": round(rnd.uniform(12.5, 15)*sc, 1), "teeth": 4, "serr": 0.0, "bend": 0.5})
    for ang_deg, bx_off in ((92, 0),):
        a = math.radians(ang_deg)
        HD.append({"type": "leaflet", "x": round(cx + bx_off*sc, 1), "y": round(base_y + 2, 1), "ang": round(a, 3),
                   "len": round(rnd.uniform(40, 48)*sc, 1), "w": round(15*sc, 1), "teeth": 4, "serr": 0.0, "bend": 0.15})

flower("f1", 226, 172, 1.0)
flower("f2", 322, 322, 0.85)
flower("f3", 132, 354, 0.75)
LV.append({"type": "blob", "cx": 280, "cy": 434, "rx": 17, "ry": 23, "lumps": 24, "rough": 0.05, "jag": 0.02, "bristle": 0.1, "taper": 0.2})
json.dump(ech, open("data/echinacea.json", "w"), indent=1)

# ================= CALAMAGROSTIS =================
rnd = random.Random(113)
cal = {"title": "Calamagrostis", "seed": 113, "wobble": 1.8, "width": 7, "inkOverHeads": True, "strokes": [], "heads": [], "leaves": []}
S = cal["strokes"]; HD = cal["heads"]
BL = [[0, 0.55], [0.35, 1], [1, 0.16]]
n = 8
for i in range(n):
    bx = 184 + i*(72/(n-1)) + rnd.uniform(-3, 3)
    lean = (i-(n-1)/2) * 17
    h = rnd.uniform(190, 290)
    c1 = (bx + lean*0.1, 620 - h*0.45); c2 = (bx + lean*0.7, 620 - h*0.92)
    end = (bx + lean*1.7 + rnd.uniform(-8, 8), 620 - h*0.8 + rnd.uniform(30, 70))
    S.append({"id": f"blade-{i}", "width": rnd.uniform(8, 10.5), "profile": BL, "wobble": 1.4, "pinStart": False,
              "d": f"M{bx:.1f} 620 C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {end[0]:.1f} {end[1]:.1f}"})
fl = [((212,620),(210,520),(214,380),(212,250), 42, 4),
      ((226,620),(224,500),(230,300),(228,150), 52, 0),
      ((240,620),(244,520),(250,380),(248,214), 42, 3),
      ((200,620),(196,540),(192,430),(190,304), 36, -3),
      ((252,620),(256,530),(262,420),(264,300), 38, 6)]
for i, (p0, p1, p2, p3, ry, tilt) in enumerate(fl):
    S.append(stem(f"fstem-{i}", [(p0, p1, p2, p3)], 5.8 if i != 1 else 6.6, wob=0.7))
    S[-1]["wavelength"] = 140
    cx, cy = p3[0], p3[1] - ry + 10
    HD.append({"type": "blob", "cx": cx, "cy": cy, "rx": round(ry*0.24, 1), "ry": ry, "lumps": 40, "rough": 0.06, "jag": 0.05, "bristle": 0.14, "rot": tilt, "taper": 0.3})
json.dump(cal, open("data/calamagrostis.json", "w"), indent=1)
print(len(ech["strokes"]), len(ech["leaves"]), len(ech["heads"]), len(cal["strokes"]))
