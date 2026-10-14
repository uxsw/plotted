import json, math, re, sys

def nums(d): return [float(x) for x in re.findall(r'-?\d*\.?\d+', d)]

def to_leaflet(d, w_ratio, teeth, serr, wmin):
    n = nums(d)
    kind = 'C' if 'C' in d else ('Q' if 'Q' in d else 'L')
    p0 = (n[0], n[1])
    if kind == 'Q':
        c = (n[2], n[3]); p3 = (n[4], n[5]); mid = (0.25*p0[0]+0.5*c[0]+0.25*p3[0], 0.25*p0[1]+0.5*c[1]+0.25*p3[1])
    elif kind == 'C':
        c1 = (n[2], n[3]); c2 = (n[4], n[5]); p3 = (n[6], n[7])
        mid = ((p0[0]+3*c1[0]+3*c2[0]+p3[0])/8, (p0[1]+3*c1[1]+3*c2[1]+p3[1])/8)
    else:
        p3 = (n[2], n[3]); mid = ((p0[0]+p3[0])/2, (p0[1]+p3[1])/2)
    dx, dy = p3[0]-p0[0], p3[1]-p0[1]
    L = math.hypot(dx, dy)
    ang = math.atan2(dy, dx)
    px, py = -dy/L, dx/L
    off = (mid[0]-(p0[0]+p3[0])/2)*px + (mid[1]-(p0[1]+p3[1])/2)*py
    bend = off/(0.5*L)
    return {"type": "leaflet", "x": round(p0[0], 1), "y": round(p0[1], 1), "ang": round(ang, 3),
            "len": round(L*1.04, 1), "w": round(max(L*w_ratio, wmin), 1), "teeth": teeth, "serr": serr, "bend": round(bend, 2)}

CFG = {
  "verbena":   dict(w_ratio=0.34, teeth=4, serr=0.12, wmin=7),
  "euphorbia": dict(w_ratio=0.24, teeth=3, serr=0.0,  wmin=5),
  "teasel":    dict(w_ratio=0.2,  teeth=6, serr=0.05, wmin=7),
}
for name, cfg in CFG.items():
    path = f"data/{name}.json"
    pl = json.load(open(path))
    keep, leaves = [], pl.get("leaves", [])
    for s in pl["strokes"]:
        sid = s["id"]
        if sid.startswith("leaf-"):
            if name == "teasel" and sid.endswith("-lo"):
                continue
            lf = to_leaflet(s["d"], **cfg)
            if name == "teasel" and sid.endswith("-up"):
                lf["len"] = round(lf["len"]*1.0, 1); lf["w"] = round(lf["len"]*0.24, 1)
            leaves.append(lf)
        else:
            keep.append(s)
    pl["strokes"], pl["leaves"] = keep, leaves
    json.dump(pl, open(path, "w"), indent=1)
    print(name, len(keep), "strokes,", len(leaves), "leaves")
