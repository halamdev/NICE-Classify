"""
run_eval_wipo.py — NICE Classify · External Validation
=======================================================
Test set: 100% data từ WIPO NCL 13-2026 (Excel chính thức)
         KHÔNG có câu nào viết tay
         442 queries · 45 classes · tiếng Anh chuẩn WIPO

Nguồn data:
  keywords : merged_keywords.json
             (686 keywords gốc + 836 keywords trích từ WIPO Excel = 1,522 tổng)
  test set : wipo_test_final.json
             (442 items lấy ngẫu nhiên từ Excel, không trùng tập train)

Chạy:  python3 run_eval_wipo.py
Output:
  eval_wipo/summary.csv
  eval_wipo/predictions.csv
  eval_wipo/per_class_f1.csv
  eval_wipo/full_metrics.json

"""

import math, time, re, os, csv, json, unicodedata
from collections import defaultdict

# ══════════════════════════════════════════════════════════════════════════════
# DATA: load keywords và test cases từ file — không hardcode
# ══════════════════════════════════════════════════════════════════════════════

_BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(_BASE, "merged_keywords.json"), encoding="utf-8") as f:
    _KW = {int(k): v for k, v in json.load(f).items()}

with open(os.path.join(_BASE, "wipo_test_final.json"), encoding="utf-8") as f:
    TEST_CASES = json.load(f)

TF_MAP = {
    1:["chemical","industrial","scientific","agriculture","fertilizer","resin","adhesive"],
    2:["paint","varnish","dye","colorant","lacquer","coating","rust","preservative"],
    3:["cosmetic","skin","hair","fragrance","toiletry","beauty","lotion","shampoo","perfume"],
    4:["oil","grease","lubricant","fuel","wax","industrial","illuminant"],
    5:["pharmaceutical","medical","veterinary","supplement","vitamin","dietary","hygiene","sanitary"],
    6:["metal","steel","iron","alloy","metallic","hardware","construction","building"],
    7:["machine","engine","motor","industrial","power","manufacturing","pump","robot"],
    8:["hand","tool","cutlery","implement","knife","scissors","manual"],
    9:["software","computer","electronic","digital","device","application","hardware","network","data"],
    10:["medical","surgical","dental","veterinary","apparatus","prosthetic","therapeutic"],
    11:["lighting","heating","cooling","ventilation","lamp","refrigerating","sanitary"],
    12:["vehicle","transport","automotive","motor","aircraft","watercraft","locomotion"],
    13:["firearm","ammunition","explosive","weapon","projectile","firework"],
    14:["jewellery","precious","gold","silver","diamond","watch","gem","ring"],
    15:["musical","instrument","piano","guitar","string","percussion","wind"],
    16:["paper","cardboard","printed","stationery","bookbinding","office","publication"],
    17:["rubber","plastic","insulation","resin","gum","synthetic","flexible","pipe"],
    18:["leather","bag","luggage","wallet","purse","handbag","suitcase","umbrella"],
    19:["building","construction","material","non-metallic","cement","concrete","stone","tile"],
    20:["furniture","mirror","frame","interior","domestic","wood","cabinet","shelf"],
    21:["household","kitchen","utensil","cookware","glassware","porcelain","brush","container"],
    22:["rope","net","tent","tarpaulin","sack","string","twine"],
    23:["yarn","thread","textile","spinning","fiber","cotton","wool"],
    24:["textile","fabric","cloth","bed","table","cover","linen","curtain"],
    25:["clothing","footwear","headwear","apparel","wear","garment","shoe","fashion"],
    26:["lace","embroidery","button","needle","ribbon","hair","decoration"],
    27:["carpet","rug","mat","flooring","wallpaper","linoleum","covering"],
    28:["game","toy","sport","playing","athletic","recreational","gym","fitness"],
    29:["meat","fish","dairy","egg","processed","preserved","frozen","canned","protein"],
    30:["coffee","tea","flour","bread","sugar","spice","cocoa","rice","pasta","pastry"],
    31:["agricultural","fresh","live","plant","seed","fruit","vegetable","flower","animal"],
    32:["beer","beverage","mineral","water","juice","soft","non-alcoholic","drink"],
    33:["alcoholic","wine","spirits","whisky","liquor","fermented"],
    34:["tobacco","cigarette","cigar","smoking","nicotine","lighter"],
    35:["advertising","marketing","business","management","retail","office","administration","commerce"],
    36:["insurance","financial","banking","investment","monetary","real estate","fund"],
    37:["construction","building","repair","installation","maintenance","renovation","plumbing"],
    38:["telecommunication","internet","broadcast","network","streaming","communication","transmission"],
    39:["transport","delivery","logistics","storage","travel","shipping","courier","cargo"],
    40:["treatment","processing","recycling","printing","manufacturing","purification","material"],
    41:["education","training","entertainment","sporting","cultural","academy","school","event"],
    42:["technology","software","scientific","research","cloud","IT","engineering","design","security"],
    43:["restaurant","hotel","food","drink","accommodation","catering","hospitality","lodging"],
    44:["medical","health","veterinary","beauty","spa","dental","agricultural","horticultural"],
    45:["legal","law","intellectual","property","trademark","patent","security","investigation"],
}

TYPE_MAP = {n: "goods" if n <= 34 else "services" for n in range(1, 46)}

NICE_CLASSES = [
    {"n": n, "type": TYPE_MAP[n], "kw": _KW[n], "tf": TF_MAP[n]}
    for n in range(1, 46)
]

# ══════════════════════════════════════════════════════════════════════════════
# NLP
# ══════════════════════════════════════════════════════════════════════════════

SW_VI = {"của","và","các","để","trong","cho","với","là","được","có","không","một",
         "những","này","đó","khi","sẽ","từ","về","theo","tại","trên","dưới","bởi",
         "vì","thì","mà","nên","hay","hoặc","như","vào","ra","đến","lên","xuống",
         "đã","đang","bị","rất","hơn","cũng","dùng","dành","bán","mua"}
SW_EN = {"the","a","an","and","or","but","in","on","at","to","for","of","with","by",
         "from","as","is","are","was","were","be","been","being","have","has","had",
         "do","does","did","will","would","could","should","may","might","that","this",
         "which","used","use","not","other","except","than","their","such"}
SVC  = ["dịch vụ","service","tư vấn","consulting","cho thuê","rental","cung cấp","subscription"]

def norm(t):
    return unicodedata.normalize("NFC", t.lower()).strip()

def detect_lang(text):
    return "vi" if len(re.findall(
        r'[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]',
        text, re.I)) > 1 else "en"

def tokenize(text, lg):
    sw = SW_VI if lg == "vi" else SW_EN
    return [t for t in re.split(r'[\s,.\-/;:!?()\[\]]+', norm(text))
            if len(t) > 1 and t not in sw]

# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

def rule_filter(q, toks):
    qn     = norm(q)
    is_svc = any(s in qn for s in SVC)
    out    = []
    for c in NICE_CLASSES:
        score, matched = 0.0, []
        for kw in c["kw"]:
            if norm(kw) in qn:
                score += 2.5 if " " in kw else 1.0
                matched.append(kw)
        for t in toks:
            if any(norm(k) == t for k in c["kw"]) and t not in matched:
                score += 0.5
                matched.append(t)
        if is_svc and c["type"] == "goods" and c["n"] not in (9, 16):
            score *= 0.6
        if score > 0:
            out.append({"n": c["n"], "rs": min(score / 5, 1.0)})
    return sorted(out, key=lambda x: -x["rs"])[:15]

def tfidf_score(toks, c):
    all_t = c["tf"] + [w for k in c["kw"] for w in k.split()]
    tf    = defaultdict(int)
    for t in all_t: tf[norm(t)] += 1
    dot = qn = dn = 0.0
    for t in toks:
        nc  = sum(1 for cc in NICE_CLASSES
                  if any(norm(x) == t or t in norm(x)
                         for x in cc["tf"] + cc["kw"]))
        idf = math.log(46 / (1 + nc) + 1)
        dw  = tf.get(t, 0) * idf
        dot += idf * dw; qn += idf ** 2; dn += dw ** 2
    return dot / (math.sqrt(qn) * math.sqrt(dn)) if qn and dn else 0.0

def vector_search(toks, cands):
    space = [c for c in NICE_CLASSES if not cands or c["n"] in cands]
    res   = [{"n": c["n"], "vs": tfidf_score(toks, c)} for c in space]
    return sorted([r for r in res if r["vs"] > 0], key=lambda x: -x["vs"])[:10]

def hybrid_score(rr, vr, alpha=0.45, beta=0.55, k=8):
    rm = {r["n"]: r["rs"] for r in rr}
    vm = {v["n"]: v["vs"] for v in vr}
    mv = max((v["vs"] for v in vr), default=0.001)
    out = [{"n": n, "hs": alpha * rm.get(n, 0) + beta * vm.get(n, 0) / mv}
           for n in set(rm) | set(vm)]
    return sorted(out, key=lambda x: -x["hs"])[:k]

def run(q, mode="hybrid"):
    t0   = time.perf_counter()
    lg   = detect_lang(q)
    toks = tokenize(q, lg)

    if mode == "rule":
        top = [r["n"] for r in rule_filter(q, toks)[:8]]
    elif mode == "vector":
        top = [v["n"] for v in vector_search(toks, [])[:8]]
    else:
        rr    = rule_filter(q, toks)
        vr    = vector_search(toks, [r["n"] for r in rr])
        cands = hybrid_score(rr, vr)
        if not cands:
            cands = hybrid_score([], vector_search(toks, []))
        top = [c["n"] for c in cands[:8]]

    return top, (time.perf_counter() - t0) * 1000

# ══════════════════════════════════════════════════════════════════════════════
# METRICS
# ══════════════════════════════════════════════════════════════════════════════

def compute_metrics(preds):
    n  = len(preds)
    tp = defaultdict(int); fp = defaultdict(int); fn = defaultdict(int)
    top1_ok = topk_ok = 0
    for p in preds:
        gt, pred, topk = p["gt"], p["top1"], p["topk"]
        if pred == gt:  tp[gt] += 1;  top1_ok += 1
        else:           fp[pred] += 1; fn[gt] += 1
        if gt in topk:  topk_ok += 1

    classes = sorted(set(p["gt"] for p in preds))
    pc = {}
    for c in classes:
        pr  = tp[c] / (tp[c] + fp[c]) if tp[c] + fp[c] else 0.0
        rc  = tp[c] / (tp[c] + fn[c]) if tp[c] + fn[c] else 0.0
        f1  = 2 * pr * rc / (pr + rc)  if pr + rc       else 0.0
        sup = sum(1 for p in preds if p["gt"] == c)
        pc[c] = {"p": pr, "r": rc, "f1": f1, "sup": sup}

    macro_f1    = sum(v["f1"] for v in pc.values()) / len(pc)
    weighted_f1 = sum(v["f1"] * v["sup"] for v in pc.values()) / n
    return {
        "n": n, "top1": top1_ok / n, "top8": topk_ok / n,
        "macro_f1": macro_f1, "weighted_f1": weighted_f1,
        "per_class": pc,
    }

# ══════════════════════════════════════════════════════════════════════════════
# EVALUATE
# ══════════════════════════════════════════════════════════════════════════════

def evaluate(mode, label):
    preds, lats = [], []
    for tc in TEST_CASES:
        topk, lat = run(tc["q"], mode)
        top1 = topk[0] if topk else -1
        preds.append({"id": tc["id"], "q": tc["q"], "gt": tc["gt"],
                      "top1": top1, "topk": topk})
        lats.append(lat)

    m = compute_metrics(preds)
    m.update({
        "avg_ms": sum(lats) / len(lats),
        "p95_ms": sorted(lats)[int(len(lats) * 0.95)],
        "min_ms": min(lats), "max_ms": max(lats),
        "preds":  preds,
    })
    return m

# ══════════════════════════════════════════════════════════════════════════════
# OUTPUT
# ══════════════════════════════════════════════════════════════════════════════

def save_outputs(results, outdir):
    os.makedirs(outdir, exist_ok=True)

    # summary.csv
    with open(f"{outdir}/summary.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["pipeline","n_queries","top1_accuracy","top8_accuracy",
                    "macro_f1","weighted_f1","avg_latency_ms","p95_latency_ms"])
        for name, m in results.items():
            w.writerow([name, m["n"],
                        f"{m['top1']:.4f}", f"{m['top8']:.4f}",
                        f"{m['macro_f1']:.4f}", f"{m['weighted_f1']:.4f}",
                        f"{m['avg_ms']:.2f}", f"{m['p95_ms']:.2f}"])

    # predictions.csv (hybrid)
    hm = results.get("Hybrid", list(results.values())[-1])
    with open(f"{outdir}/predictions.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id","query","ground_truth","top1_pred","top8_preds",
                    "correct_top1","correct_top8","source"])
        for p in hm["preds"]:
            src = next((tc.get("source","") for tc in TEST_CASES if tc["id"]==p["id"]), "")
            w.writerow([p["id"], p["q"], p["gt"], p["top1"], str(p["topk"]),
                        p["top1"] == p["gt"], p["gt"] in p["topk"], src])

    # per_class_f1.csv (hybrid)
    with open(f"{outdir}/per_class_f1.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["class","precision","recall","f1","support","flag"])
        for cn, v in sorted(hm["per_class"].items()):
            flag = "WEAK" if v["f1"] < 0.5 else ("OK" if v["f1"] >= 0.8 else "MID")
            w.writerow([cn, f"{v['p']:.4f}", f"{v['r']:.4f}",
                        f"{v['f1']:.4f}", v["sup"], flag])

    # full_metrics.json
    json_out = {k: {kk: vv for kk, vv in v.items() if kk != "preds"}
                for k, v in results.items()}
    with open(f"{outdir}/full_metrics.json", "w", encoding="utf-8") as f:
        json.dump(json_out, f, ensure_ascii=False, indent=2)

    print(f"\n  Saved → {outdir}/")
    for fn in ["summary.csv","predictions.csv","per_class_f1.csv","full_metrics.json"]:
        print(f"    ✓ {fn}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def print_summary(results):
    n = len(TEST_CASES)
    print(f"\n{'═'*68}")
    print(f"  WIPO NCL13-2026 External Validation — {n} queries · 45 classes")
    print(f"  Test set: 100% từ Excel WIPO, KHÔNG có câu viết tay")
    print(f"{'═'*68}")
    print(f"  {'Pipeline':<16} {'Top-1':>8} {'Top-8':>8} {'MacroF1':>9} {'W-F1':>8} {'AvgMs':>7}")
    print(f"  {'─'*60}")
    for name, m in results.items():
        print(f"  {name:<16} {m['top1']:>7.1%} {m.get('top8', 0):>7.1%} "
              f"{m['macro_f1']:>8.1%} {m['weighted_f1']:>7.1%} {m['avg_ms']:>6.1f}")
    print(f"  {'─'*60}")

    hm = results.get("Hybrid", list(results.values())[-1])
    print(f"\n  Per-class F1 (Hybrid):")
    print(f"  {'Class':>6}  {'P':>7}  {'R':>7}  {'F1':>7}  {'N':>4}  Status")
    for cn, v in sorted(hm["per_class"].items()):
        status = "✓ OK" if v["f1"] >= 0.8 else ("~ MID" if v["f1"] >= 0.5 else "✗ WEAK")
        print(f"  {cn:>6}   {v['p']:>6.1%}   {v['r']:>6.1%}   {v['f1']:>6.1%}  "
              f"{v['sup']:>4}  {status}")

if __name__ == "__main__":
    print(f"Loading {len(TEST_CASES)} test cases từ WIPO NCL13-2026...")
    print(f"Keywords: {sum(len(_KW[n]) for n in range(1,46))} tổng (merged từ WIPO Excel)")

    results = {}
    for mode, label in [("rule","Rule-only"), ("vector","Vector-only"),
                        ("hybrid","Hybrid")]:
        print(f"\nRunning {label}...", end=" ", flush=True)
        results[label] = evaluate(mode, label)
        m = results[label]
        print(f"Top-1={m['top1']:.1%}  Top-8={m['top8']:.1%}  F1={m['macro_f1']:.1%}")

    print_summary(results)
    save_outputs(results, "eval_wipo")
    print("\n  Xong!\n")