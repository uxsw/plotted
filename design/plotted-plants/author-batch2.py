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

# ================= ROSE =================
rnd = random.Random(53)
rose = {"title": "Rose", "seed": 53, "wobble": 2.2, "width": 9, "inkOverHeads": True, "strokes": [], "heads": []}
S = rose["strokes"]
cane = [((215,620),(212,560),(226,500),(224,440)), ((224,440),(222,380),(206,330),(214,270)), ((214,270),(220,225),(250,195),(262,166))]
sh1 = [((222,436),(200,410),(152,386),(140,338))]
sh2 = [((224,382),(262,364),(304,338),(332,296))]
S.append(stem("cane", cane, 11))
S.append(stem("shoot-l", sh1, 7.5))
S.append(stem("shoot-r", sh2, 7.5))

rose["leaves"] = []
def lflt(x, y, ang, L, w, bend):
    rose["leaves"].append({"type": "leaflet", "x": round(x, 1), "y": round(y, 1), "ang": round(ang, 3),
                           "len": round(L, 1), "w": round(w, 1), "teeth": 6, "serr": 0.2, "bend": round(bend, 2)})

def compound(prefix, p, ang, side, sc):
    a0 = ang + side*math.radians(50)
    pe = (p[0]+30*sc*math.cos(a0), p[1]+30*sc*math.sin(a0))
    out = [line(prefix+"-pet", p, pe, 3.2, [[0,1],[1,0.7]], 0.5)]
    mid = (p[0]+16*sc*math.cos(a0), p[1]+16*sc*math.sin(a0))
    lflt(pe[0], pe[1], a0, 25*sc, 12*sc, 0.12*side)
    for sg in (-1, 1):
        lflt(pe[0], pe[1], a0+sg*math.radians(58), 20*sc, 10*sc, 0.14*sg)
        lflt(mid[0], mid[1], a0+sg*math.radians(68), 16*sc, 9*sc, 0.14*sg)
    return out

for name, segs, start, step, n in (("c", cane, 60, 92, 5), ("l", sh1, 46, 70, 1), ("r", sh2, 44, 70, 2)):
    pts, cum = sample(segs); tot = cum[-1]
    s = start; side = -1; k = 0
    while s < tot - (80 if name == 'c' else 40) and k < n:
        p, ang = at(pts, cum, s)
        sc = rnd.uniform(0.85, 1.12) * (1.05 if name == "c" else 0.85)
        S.extend(compound(f"lf-{name}{k}", p, ang, side, sc))
        side = -side; k += 1; s += step * rnd.uniform(0.9, 1.15)

pts, cum = sample(cane)
for i, s_ in enumerate((120, 200, 290, 380)):
    p, ang = at(pts, cum, s_)
    sd = 1 if i % 2 else -1
    q = (p[0]+9*math.cos(ang+sd*1.2), p[1]+9*math.sin(ang+sd*1.2))
    S.append(line(f"thorn-{i}", p, q, 3.6, [[0,1],[1,0.1]], 0.3))

def bloom(id_, cx, cy, rx, ry, big=True):
    out = []
    out.append(curve(id_+"-cup", f"M{cx-rx*0.86:.1f} {cy+ry*0.05:.1f} C{cx-rx*0.7:.1f} {cy+ry*1.05:.1f} {cx+rx*0.7:.1f} {cy+ry*1.05:.1f} {cx+rx*0.86:.1f} {cy+ry*0.05:.1f}", 4.2))
    out.append(curve(id_+"-top", f"M{cx-rx*0.6:.1f} {cy-ry*0.3:.1f} C{cx-rx*0.3:.1f} {cy-ry*0.95:.1f} {cx+rx*0.3:.1f} {cy-ry*0.95:.1f} {cx+rx*0.62:.1f} {cy-ry*0.28:.1f}", 3.6))
    out.append(curve(id_+"-swirl", f"M{cx-rx*0.1:.1f} {cy-ry*0.15:.1f} C{cx+rx*0.25:.1f} {cy-ry*0.45:.1f} {cx+rx*0.45:.1f} {cy+ry*0.15:.1f} {cx+rx*0.1:.1f} {cy+ry*0.35:.1f} C{cx-rx*0.25:.1f} {cy+ry*0.5:.1f} {cx-rx*0.45:.1f} {cy+ry*0.0:.1f} {cx-rx*0.28:.1f} {cy-ry*0.3:.1f}", 3.2))
    out.append(curve(id_+"-fold-l", f"M{cx-rx*0.78:.1f} {cy-ry*0.1:.1f} C{cx-rx*0.55:.1f} {cy+ry*0.2:.1f} {cx-rx*0.4:.1f} {cy+ry*0.55:.1f} {cx-rx*0.3:.1f} {cy+ry*0.8:.1f}", 3.0))
    out.append(curve(id_+"-fold-r", f"M{cx+rx*0.78:.1f} {cy-ry*0.1:.1f} C{cx+rx*0.55:.1f} {cy+ry*0.2:.1f} {cx+rx*0.42:.1f} {cy+ry*0.5:.1f} {cx+rx*0.32:.1f} {cy+ry*0.78:.1f}", 3.0))
    # sepals
    for j, (dx, dy, ex, ey) in enumerate(((-0.3, 0.98, -0.62, 1.5), (0.05, 1.05, 0.02, 1.65), (0.35, 0.96, 0.7, 1.45))):
        out.append(line(f"{id_}-sep{j}", (cx+rx*dx, cy+ry*dy), (cx+rx*ex, cy+ry*ey), 3.8, [[0,1],[1,0.15]], 0.4))
    return out

S.extend(bloom("bloom-a", 264, 140, 38, 30))
S.extend(bloom("bloom-b", 334, 270, 27, 22))
rose["heads"] = [
  {"type": "blob", "cx": 264, "cy": 140, "rx": 40, "ry": 32, "lumps": 16, "rough": 0.07, "jag": 0.02, "rot": -4},
  {"type": "blob", "cx": 334, "cy": 270, "rx": 29, "ry": 24, "lumps": 14, "rough": 0.07, "jag": 0.02, "rot": 6},
  {"type": "blob", "cx": 138, "cy": 314, "rx": 13, "ry": 24, "lumps": 12, "rough": 0.07, "jag": 0.02, "taper": -0.3, "rot": -6},
]
S.append(curve("bud-sepal-l", "M138 338 C126 332 122 318 126 300", 4.4))
S.append(curve("bud-sepal-r", "M139 338 C152 332 156 318 150 302", 4.4))
S.append(line("bud-tip", (138, 292), (140, 268), 3.6, [[0,1],[1,0.1]], 0.4))
json.dump(rose, open("data/rose.json", "w"), indent=1)

# ================= COTINUS =================
rnd = random.Random(71)
cot = {"title": "Cotinus", "seed": 71, "wobble": 2.0, "width": 8, "inkOverHeads": True, "strokes": [], "heads": []}
S = cot["strokes"]
cot["leaves"] = []
main = [((222,620),(220,570),(228,520),(222,470)), ((222,470),(216,420),(226,370),(220,320)), ((220,320),(216,282),(222,252),(220,226))]
brs = {
 "b1": ([((222,504),(192,474),(150,444),(130,384))], 7.5, (130, 384)),
 "b2": ([((224,444),(262,424),(300,394),(322,334))], 7.5, (322, 334)),
 "b3": ([((219,352),(196,322),(178,292),(168,242))], 6.5, (168, 242)),
 "b4": ([((221,298),(246,272),(262,242),(274,204))], 6, (274, 204)),
}
S.append(stem("main", main, 10))
for k, (segs, w, _) in brs.items():
    S.append(stem(k, segs, w))

def add_leaves(name, segs, start, step, endpad, size):
    pts, cum = sample(segs); tot = cum[-1]
    s = start; side = -1; n = 0
    while s < tot - endpad:
        p, ang = at(pts, cum, s)
        a = rnd.uniform(0.85, 1.15) * size; b = a * rnd.uniform(0.68, 0.8)
        dirn = ang + side*math.radians(rnd.uniform(52, 72))
        cx = p[0] + (a+5)*math.cos(dirn); cy = p[1] + (a+5)*math.sin(dirn)
        S.append(line(f"{name}-pet{n}", p, (p[0]+7*math.cos(dirn), p[1]+7*math.sin(dirn)), 3, [[0,1],[1,0.8]], 0.2))
        cot["leaves"].append({"type": "blob", "cx": round(cx, 1), "cy": round(cy, 1), "rx": round(a, 1), "ry": round(b, 1),
                              "rot": round(math.degrees(dirn), 1), "lumps": 12, "rough": 0.06, "jag": 0.02})
        side = -side; n += 1; s += step * rnd.uniform(0.85, 1.2)

add_leaves("m", main, 40, 36, 40, 13)
for k, (segs, w, _) in brs.items():
    add_leaves(k, segs, 26, 26, 24, 11.5)

def plume(name, tip, ang_deg, cx_off, cy_off, rx, ry, dots):
    cx, cy = tip[0]+cx_off, tip[1]+cy_off
    cot["heads"].append({"type": "cluster", "cx": cx, "cy": cy, "scatter": dots, "rx": rx, "ry": ry, "rot": ang_deg, "dotR": [3.2, 6.2]})
    for j, (fx, fy) in enumerate(((-0.55, -0.1), (0.0, -0.8), (0.55, -0.05))):
        t = (cx + fx*rx*math.cos(math.radians(ang_deg)) - fy*ry*math.sin(math.radians(ang_deg)),
             cy + fx*rx*math.sin(math.radians(ang_deg)) + fy*ry*math.cos(math.radians(ang_deg)))
        mid = ((tip[0]+t[0])/2 + (j-1)*3, (tip[1]+t[1])/2)
        S.append({"id": f"{name}-wisp{j}", "width": 2.8, "profile": [[0,1],[1,0.15]], "wobble": 0.8, "pinStart": False,
                  "d": f"M{tip[0]} {tip[1]} Q{mid[0]:.1f} {mid[1]:.1f} {t[0]:.1f} {t[1]:.1f}"})

plume("pm", (220, 226), 0, 0, -50, 36, 52, 46)
plume("p1", (130, 384), -14, -12, -48, 32, 46, 38)
plume("p2", (322, 334), 12, 10, -48, 32, 46, 38)
plume("p3", (168, 242), -10, -10, -46, 30, 44, 36)
plume("p4", (274, 204), 10, 8, -44, 28, 42, 34)
json.dump(cot, open("data/cotinus.json", "w"), indent=1)

# ================= ALLIUM =================
al = {"title": "Allium", "seed": 89, "wobble": 2.0, "width": 9, "strokes": [], "heads": []}
S = al["strokes"]
S.append(stem("stem-a", [((222,620),(219,540),(226,440),(224,330)), ((224,330),(222,262),(230,200),(228,150))], 10))
S.append(stem("stem-b", [((200,620),(194,560),(176,480),(160,400)), ((160,400),(152,364),(146,334),(147,310))], 8))
S.append(stem("stem-c", [((244,620),(250,560),(268,480),(290,420)), ((290,420),(298,396),(302,380),(300,364))], 7.5))
SW = [[0, 0.55], [0.3, 1], [1, 0.1]]
for id_, d, w in (("leaf-1", "M210 620 C200 580 160 540 118 520 C96 510 84 516 70 530", 13),
                  ("leaf-2", "M236 620 C250 586 296 560 340 548 C366 542 380 548 392 562", 12),
                  ("leaf-3", "M224 620 C226 590 214 560 190 536 C176 522 170 508 172 494", 10)):
    S.append({"id": id_, "width": w, "profile": SW, "wobble": 1.2, "pinStart": False, "d": d})
S.append(curve("spathe-l", "M300 366 C288 350 289 326 295 306", 3.2))
S.append(curve("spathe-r", "M301 366 C312 352 312 330 306 312", 3.2))
S.append(line("bud-wisp", (301, 312), (316, 284), 3.2, [[0,1],[1,0.1]], 0.6))
al["heads"] = [
  {"type": "cluster", "cx": 229, "cy": 126, "scatter": 62, "rx": 51, "ry": 49, "dotR": [4.6, 7.4]},
  {"type": "cluster", "cx": 146, "cy": 296, "scatter": 34, "rx": 35, "ry": 34, "dotR": [4, 6.4]},
  {"type": "blob", "cx": 300, "cy": 338, "rx": 13, "ry": 26, "lumps": 14, "rough": 0.08, "jag": 0.02, "taper": 0.3, "rot": 6},
]
json.dump(al, open("data/allium.json", "w"), indent=1)
print({k: len(v["strokes"]) for k, v in (("rose", rose), ("cotinus", cot), ("allium", al))})
