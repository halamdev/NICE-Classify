import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── NICE CLASS DICTIONARY ───────────────────────────────────────────────────
interface NiceClassMeta {
  classNumber: number;
  titleVi: string;
  titleEn: string;
  type: "goods" | "services";
  keywords: string[];
  tfidfTerms: string[];
}

const NICE_CLASSES: NiceClassMeta[] = [
  { classNumber: 1, titleVi: "Hóa chất", titleEn: "Chemicals", type: "goods", keywords: ["hóa chất","chemical","acid","axit","chất tẩy","phân bón","fertilizer","reagent","resin"], tfidfTerms: ["chemical","industrial","scientific","photographic","agriculture","fertilizer","resin","adhesive"] },
  { classNumber: 2, titleVi: "Sơn, véc ni", titleEn: "Paints", type: "goods", keywords: ["sơn","paint","varnish","véc ni","chất nhuộm","dye","lacquer","thuốc nhuộm","pigment"], tfidfTerms: ["paint","varnish","dye","colorant","lacquer","coating","rust","preservative"] },
  { classNumber: 3, titleVi: "Mỹ phẩm", titleEn: "Cosmetics", type: "goods", keywords: ["mỹ phẩm","cosmetic","kem","cream","dầu gội","shampoo","nước hoa","perfume","son môi","lipstick","sữa rửa mặt","tẩy trang","cleanser","lotion","serum","toner","skincare","chăm sóc da","làm đẹp","beauty","deodorant","soap","xà phòng"], tfidfTerms: ["cosmetic","skin","hair","fragrance","toiletry","beauty","lotion","shampoo","perfume"] },
  { classNumber: 4, titleVi: "Dầu mỡ công nghiệp", titleEn: "Industrial oils", type: "goods", keywords: ["dầu công nghiệp","industrial oil","nhiên liệu","fuel","bôi trơn","lubricant","sáp","wax","nến","candle"], tfidfTerms: ["oil","grease","lubricant","fuel","wax","industrial","illuminant"] },
  { classNumber: 5, titleVi: "Dược phẩm", titleEn: "Pharmaceuticals", type: "goods", keywords: ["thuốc","medicine","dược","pharmaceutical","vitamin","supplement","thực phẩm chức năng","vaccine","kháng sinh","antibiotic"], tfidfTerms: ["pharmaceutical","medical","veterinary","supplement","vitamin","dietary","hygiene","sanitary"] },
  { classNumber: 6, titleVi: "Kim loại thường", titleEn: "Common metals", type: "goods", keywords: ["kim loại","metal","sắt","iron","thép","steel","nhôm","aluminum","đồng","copper","khóa","lock","đinh","nail"], tfidfTerms: ["metal","steel","iron","alloy","metallic","hardware","construction","building"] },
  { classNumber: 7, titleVi: "Máy móc", titleEn: "Machines", type: "goods", keywords: ["máy móc","machine","động cơ","engine","motor","robot","máy bơm","pump","máy nén","compressor","máy hàn"], tfidfTerms: ["machine","engine","motor","industrial","power","manufacturing","pump","robot"] },
  { classNumber: 8, titleVi: "Dụng cụ cầm tay", titleEn: "Hand tools", type: "goods", keywords: ["dụng cụ cầm tay","hand tool","dao","knife","kéo","scissors","búa","hammer","cờ lê","wrench","tua vít","screwdriver"], tfidfTerms: ["hand","tool","cutlery","implement","knife","scissors","manual"] },
  { classNumber: 9, titleVi: "Thiết bị điện tử, phần mềm", titleEn: "Scientific apparatus", type: "goods", keywords: ["phần mềm","software","ứng dụng","app","máy tính","computer","điện thoại","phone","thiết bị điện tử","electronics","camera","GPS","bảo mật","security software","game","trò chơi điện tử","SaaS","AI","trí tuệ nhân tạo","IoT","wearable","download","tải xuống"], tfidfTerms: ["software","computer","electronic","digital","device","application","hardware","network","data"] },
  { classNumber: 10, titleVi: "Thiết bị y tế", titleEn: "Medical apparatus", type: "goods", keywords: ["thiết bị y tế","medical device","dụng cụ phẫu thuật","surgical","nha khoa","dental","băng y tế","bandage","xe lăn","wheelchair","máy đo huyết áp"], tfidfTerms: ["medical","surgical","dental","veterinary","apparatus","prosthetic","therapeutic"] },
  { classNumber: 11, titleVi: "Thiết bị chiếu sáng, đun nóng", titleEn: "Lighting, heating", type: "goods", keywords: ["đèn","lamp","chiếu sáng","lighting","điều hòa","air conditioner","lò sưởi","heater","bếp","cooker","tủ lạnh","refrigerator","quạt","fan","máy lọc không khí","air purifier"], tfidfTerms: ["lighting","heating","cooling","ventilation","lamp","refrigerating","sanitary"] },
  { classNumber: 12, titleVi: "Phương tiện vận tải", titleEn: "Vehicles", type: "goods", keywords: ["xe","vehicle","ô tô","car","xe máy","motorcycle","xe đạp","bicycle","tàu","ship","máy bay","aircraft","xe buýt","bus","phụ tùng xe"], tfidfTerms: ["vehicle","transport","automotive","motor","aircraft","watercraft","locomotion"] },
  { classNumber: 13, titleVi: "Vũ khí, đạn dược", titleEn: "Firearms", type: "goods", keywords: ["súng","gun","vũ khí","weapon","đạn","ammunition","chất nổ","explosive","pháo hoa","firework"], tfidfTerms: ["firearm","ammunition","explosive","weapon","projectile","firework"] },
  { classNumber: 14, titleVi: "Kim loại quý, đồng hồ", titleEn: "Precious metals", type: "goods", keywords: ["trang sức","jewellery","jewelry","vàng","gold","bạc","silver","kim cương","diamond","đồng hồ","watch","nhẫn","ring","vòng cổ","necklace","dây chuyền","đá quý","gemstone"], tfidfTerms: ["jewellery","precious","gold","silver","diamond","watch","gem","ring"] },
  { classNumber: 15, titleVi: "Nhạc cụ", titleEn: "Musical instruments", type: "goods", keywords: ["nhạc cụ","musical instrument","đàn","guitar","piano","trống","drum","violin","saxophone"], tfidfTerms: ["musical","instrument","piano","guitar","string","percussion","wind"] },
  { classNumber: 16, titleVi: "Giấy, in ấn", titleEn: "Paper goods", type: "goods", keywords: ["giấy","paper","in ấn","printing","sách","book","văn phòng phẩm","stationery","bút","pen","tạp chí","magazine","báo","newspaper","bao bì","packaging"], tfidfTerms: ["paper","cardboard","printed","stationery","bookbinding","office","publication"] },
  { classNumber: 17, titleVi: "Cao su, nhựa", titleEn: "Rubber goods", type: "goods", keywords: ["cao su","rubber","nhựa","plastic","silicon","cách điện","insulation","ống","pipe","dây điện"], tfidfTerms: ["rubber","plastic","insulation","resin","gum","synthetic","flexible","pipe"] },
  { classNumber: 18, titleVi: "Da và giả da", titleEn: "Leather goods", type: "goods", keywords: ["da","leather","túi","bag","ví","wallet","hành lý","luggage","vali","suitcase","ba lô","backpack","ô dù","umbrella"], tfidfTerms: ["leather","bag","luggage","wallet","purse","handbag","suitcase","umbrella"] },
  { classNumber: 19, titleVi: "Vật liệu xây dựng", titleEn: "Building materials", type: "goods", keywords: ["vật liệu xây dựng","building material","gạch","brick","xi măng","cement","kính","glass","gỗ","wood","đá","stone","ngói","tile"], tfidfTerms: ["building","construction","material","non-metallic","cement","concrete","stone","tile"] },
  { classNumber: 20, titleVi: "Đồ nội thất", titleEn: "Furniture", type: "goods", keywords: ["nội thất","furniture","bàn","table","ghế","chair","giường","bed","tủ","cabinet","kệ","shelf","gương","mirror"], tfidfTerms: ["furniture","mirror","frame","interior","domestic","wood","cabinet","shelf"] },
  { classNumber: 21, titleVi: "Đồ gia dụng", titleEn: "Household utensils", type: "goods", keywords: ["đồ gia dụng","household","nồi","pot","chảo","pan","bát đĩa","dishes","cốc chén","cup","bình","bottle","đồ thủy tinh","glassware","đồ sứ","ceramic"], tfidfTerms: ["household","kitchen","utensil","cookware","glassware","porcelain","brush","container"] },
  { classNumber: 22, titleVi: "Dây, lưới, lều", titleEn: "Ropes and nets", type: "goods", keywords: ["dây thừng","rope","lưới","net","lều","tent","bạt","tarpaulin","bao bì vải","sack"], tfidfTerms: ["rope","net","tent","tarpaulin","sack","string","twine"] },
  { classNumber: 23, titleVi: "Sợi dệt", titleEn: "Yarns and threads", type: "goods", keywords: ["sợi","yarn","chỉ may","thread","len","wool","cotton","sợi dệt"], tfidfTerms: ["yarn","thread","textile","spinning","fiber","cotton","wool"] },
  { classNumber: 24, titleVi: "Vải, hàng dệt", titleEn: "Textiles", type: "goods", keywords: ["vải","fabric","hàng dệt","textile","khăn","towel","chăn","blanket","ga","bedsheet","rèm","curtain"], tfidfTerms: ["textile","fabric","cloth","bed","table","cover","linen","curtain"] },
  { classNumber: 25, titleVi: "Quần áo, giày dép", titleEn: "Clothing", type: "goods", keywords: ["quần áo","clothing","giày","shoes","mũ","hat","áo","shirt","quần","pants","váy","dress","đồng phục","uniform","giày dép","footwear","thời trang","fashion","vest","áo khoác","jacket","sneaker","boots","áo phông","t-shirt"], tfidfTerms: ["clothing","footwear","headwear","apparel","wear","garment","shoe","fashion"] },
  { classNumber: 26, titleVi: "Phụ kiện may mặc", titleEn: "Lace and embroidery", type: "goods", keywords: ["nút","button","kim băng","pin","dây kéo","zipper","thêu","embroidery","ren","lace","kẹp tóc","hair clip"], tfidfTerms: ["lace","embroidery","button","needle","ribbon","hair","decoration"] },
  { classNumber: 27, titleVi: "Thảm, chiếu", titleEn: "Carpets", type: "goods", keywords: ["thảm","carpet","chiếu","mat","rug","lót sàn","flooring","giấy dán tường","wallpaper"], tfidfTerms: ["carpet","rug","mat","flooring","wallpaper","linoleum","covering"] },
  { classNumber: 28, titleVi: "Đồ chơi, thể thao", titleEn: "Games and toys", type: "goods", keywords: ["đồ chơi","toy","trò chơi","game","thể thao","sport","bóng","ball","cầu lông","badminton","bóng đá","football","cờ","chess","board game","gaming","câu cá","fishing","puzzle","bộ xếp hình"], tfidfTerms: ["game","toy","sport","playing","athletic","recreational","gym","fitness"] },
  { classNumber: 29, titleVi: "Thực phẩm chế biến", titleEn: "Processed foods", type: "goods", keywords: ["thực phẩm chế biến","processed food","thịt","meat","cá","fish","trứng","egg","sữa","milk","phô mai","cheese","bơ","butter","xúc xích","sausage","đóng hộp","canned","đông lạnh","frozen","hải sản","seafood"], tfidfTerms: ["meat","fish","dairy","egg","processed","preserved","frozen","canned","protein"] },
  { classNumber: 30, titleVi: "Thực phẩm, gia vị", titleEn: "Staple foods", type: "goods", keywords: ["cà phê","coffee","trà","tea","ca cao","cocoa","gạo","rice","bột","flour","bánh","bread","đường","sugar","mật ong","honey","gia vị","spice","mì","noodle","phở","snack","chocolate","kẹo","candy","bún"], tfidfTerms: ["coffee","tea","flour","bread","sugar","spice","cocoa","rice","pasta","pastry"] },
  { classNumber: 31, titleVi: "Nông sản tươi", titleEn: "Agricultural products", type: "goods", keywords: ["nông sản","agricultural","rau","vegetable","trái cây","fruit","hoa","flower","hạt giống","seed","cây","plant","động vật sống","live animal","thủy sản tươi","fresh seafood"], tfidfTerms: ["agricultural","fresh","live","plant","seed","fruit","vegetable","flower","animal"] },
  { classNumber: 32, titleVi: "Bia, nước giải khát", titleEn: "Beers and beverages", type: "goods", keywords: ["bia","beer","nước giải khát","beverage","nước ngọt","soft drink","nước khoáng","mineral water","nước ép","juice","energy drink","nước tăng lực","soda"], tfidfTerms: ["beer","beverage","mineral","water","juice","soft","non-alcoholic","drink"] },
  { classNumber: 33, titleVi: "Đồ uống có cồn", titleEn: "Alcoholic beverages", type: "goods", keywords: ["rượu","wine","spirits","vodka","whisky","alcoholic","cồn","champagne","brandy","gin","rum"], tfidfTerms: ["alcoholic","wine","spirits","whisky","liquor","fermented"] },
  { classNumber: 34, titleVi: "Thuốc lá", titleEn: "Tobacco", type: "goods", keywords: ["thuốc lá","tobacco","cigars","cigarette","xì gà","vape","e-cigarette","thuốc lá điện tử","diêm","matches","bật lửa","lighter"], tfidfTerms: ["tobacco","cigarette","cigar","smoking","nicotine","lighter"] },
  { classNumber: 35, titleVi: "Quảng cáo, quản lý", titleEn: "Advertising", type: "services", keywords: ["quảng cáo","advertising","marketing","quản lý kinh doanh","business management","nhân sự","HR","tuyển dụng","recruitment","kế toán","accounting","bán lẻ","retail","thương mại điện tử","e-commerce","CRM","ERP","outsourcing","franchise","digital marketing"], tfidfTerms: ["advertising","marketing","business","management","retail","office","administration","commerce"] },
  { classNumber: 36, titleVi: "Bảo hiểm, tài chính", titleEn: "Insurance, finance", type: "services", keywords: ["bảo hiểm","insurance","tài chính","finance","ngân hàng","banking","đầu tư","investment","bất động sản","real estate","thanh toán","payment","fintech","crypto","quỹ","fund","chứng khoán","stock"], tfidfTerms: ["insurance","financial","banking","investment","monetary","real estate","fund"] },
  { classNumber: 37, titleVi: "Xây dựng, sửa chữa", titleEn: "Construction", type: "services", keywords: ["xây dựng","construction","sửa chữa","repair","lắp đặt","installation","bảo trì","maintenance","nội thất","interior design","renovate","cải tạo","plumbing","điện","electrical"], tfidfTerms: ["construction","building","repair","installation","maintenance","renovation","plumbing"] },
  { classNumber: 38, titleVi: "Viễn thông", titleEn: "Telecommunications", type: "services", keywords: ["viễn thông","telecom","internet","mạng","network","truyền thông","broadcast","streaming","VoIP","wifi","4G","5G","hosting","internet service"], tfidfTerms: ["telecommunication","internet","broadcast","network","streaming","communication","transmission"] },
  { classNumber: 39, titleVi: "Vận tải, du lịch", titleEn: "Transport", type: "services", keywords: ["vận tải","transport","logistics","giao hàng","delivery","chuyển phát","courier","du lịch","travel","tour","kho bãi","warehouse","kho lưu trữ","storage","xe tải","truck","cargo","ship cargo"], tfidfTerms: ["transport","delivery","logistics","storage","travel","shipping","courier","cargo"] },
  { classNumber: 40, titleVi: "Xử lý vật liệu", titleEn: "Treatment of materials", type: "services", keywords: ["xử lý vật liệu","material treatment","gia công","processing","tái chế","recycling","in ấn dịch vụ","printing service","lọc nước","water treatment","xử lý rác","waste treatment","dệt nhuộm","dyeing"], tfidfTerms: ["treatment","processing","recycling","printing","manufacturing","purification","material"] },
  { classNumber: 41, titleVi: "Giáo dục, giải trí", titleEn: "Education", type: "services", keywords: ["giáo dục","education","đào tạo","training","giải trí","entertainment","âm nhạc","music","phim","movie","thể thao dịch vụ","sport service","sự kiện","event","khóa học","course","e-learning","online learning","trường học","school","văn hóa","culture","triển lãm","exhibition"], tfidfTerms: ["education","training","entertainment","sporting","cultural","academy","school","event"] },
  { classNumber: 42, titleVi: "Công nghệ, phần mềm dịch vụ", titleEn: "Technology services", type: "services", keywords: ["phát triển phần mềm","software development","lập trình","programming","thiết kế web","web design","cloud","SaaS","API","IT service","dịch vụ công nghệ","tư vấn công nghệ","tech consulting","AI service","machine learning","nghiên cứu","research","thử nghiệm","testing","cybersecurity","an ninh mạng","platform SaaS"], tfidfTerms: ["technology","software","scientific","research","cloud","IT","engineering","design","security"] },
  { classNumber: 43, titleVi: "Nhà hàng, khách sạn", titleEn: "Food services", type: "services", keywords: ["nhà hàng","restaurant","khách sạn","hotel","ăn uống","catering","cà phê","cafe","fastfood","đặt phòng","booking","lưu trú","accommodation","hostel","resort","bar","bistro","canteen"], tfidfTerms: ["restaurant","hotel","food","drink","accommodation","catering","hospitality","lodging"] },
  { classNumber: 44, titleVi: "Y tế, làm đẹp", titleEn: "Medical services", type: "services", keywords: ["y tế dịch vụ","healthcare service","bệnh viện","hospital","phòng khám","clinic","spa","salon","làm đẹp","beauty service","thú y","veterinary","nha khoa dịch vụ","massage","chăm sóc sức khỏe","wellness"], tfidfTerms: ["medical","health","veterinary","beauty","spa","dental","agricultural","horticultural"] },
  { classNumber: 45, titleVi: "Pháp lý, an ninh", titleEn: "Legal services", type: "services", keywords: ["pháp lý","legal","luật","law","sở hữu trí tuệ","intellectual property","bảo hộ nhãn hiệu","trademark","bằng sáng chế","patent","an ninh","security service","bảo vệ","investigation","điều tra","tư vấn pháp lý","legal consulting"], tfidfTerms: ["legal","law","intellectual","property","trademark","patent","security","investigation"] },
];

// ─── NLP PREPROCESSING ───────────────────────────────────────────────────────

const STOPWORDS_VI = new Set(["của","và","các","để","trong","cho","với","là","được","có","không","một","những","này","đó","khi","sẽ","từ","về","theo","tại","trên","dưới","bởi","vì","thì","mà","nên","hay","hoặc","như","vào","ra","đến","lên","xuống","đã","đang","bị","rất","hơn","cũng","dùng","dành","bán","mua","chúng","tôi","bạn","sản","phẩm","hàng"]);
const STOPWORDS_EN = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","our","we","you","it","that","this","which","used","use","sell","buy","product","item"]);

function detectLanguage(text: string): "vi" | "en" {
  const viChars = (text.match(/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi) || []).length;
  return viChars > 1 ? "vi" : "en";
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFC").replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string, lang: "vi" | "en"): string[] {
  const stopwords = lang === "vi" ? STOPWORDS_VI : STOPWORDS_EN;
  return normalizeText(text).split(" ").filter((t) => t.length > 1 && !stopwords.has(t));
}

// ─── RULE-BASED FILTER ───────────────────────────────────────────────────────

const SERVICE_SIGNALS = ["dịch vụ","service","tư vấn","consulting","cho thuê","rental","cung cấp dịch vụ","subscription"];

interface RuleResult { classNumber: number; ruleScore: number; matchedKeywords: string[] }

function runRuleBasedFilter(query: string, tokens: string[]): RuleResult[] {
  const queryLower = normalizeText(query);
  const isServiceHint = SERVICE_SIGNALS.some((s) => queryLower.includes(s));
  const results: RuleResult[] = [];

  for (const cls of NICE_CLASSES) {
    const matchedKeywords: string[] = [];
    let score = 0;
    for (const kw of cls.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        score += kw.includes(" ") ? 2.5 : 1.0;
        matchedKeywords.push(kw);
      }
    }
    for (const token of tokens) {
      if (cls.keywords.some((kw) => kw.toLowerCase() === token) && !matchedKeywords.includes(token)) {
        score += 0.5;
        matchedKeywords.push(token);
      }
    }
    // Giảm điểm nhẹ cho class loại sai nếu có service signal mạnh
    if (isServiceHint && cls.type === "goods" && cls.classNumber !== 9 && cls.classNumber !== 16) {
      score *= 0.6;
    }
    if (score > 0) {
      results.push({ classNumber: cls.classNumber, ruleScore: Math.min(score / 5, 1.0), matchedKeywords: [...new Set(matchedKeywords)].slice(0, 5) });
    }
  }
  return results.sort((a, b) => b.ruleScore - a.ruleScore).slice(0, 15);
}

// ─── TF-IDF VECTOR SEARCH ────────────────────────────────────────────────────

interface VectorResult { classNumber: number; vectorScore: number }

function computeTfIdfScore(queryTokens: string[], cls: NiceClassMeta): number {
  const allTerms = [...cls.tfidfTerms, ...cls.keywords.flatMap((k) => k.split(" "))];
  const termFreq: Record<string, number> = {};
  for (const t of allTerms) { const nt = normalizeText(t); termFreq[nt] = (termFreq[nt] || 0) + 1; }

  let dot = 0, qNorm = 0, dNorm = 0;
  for (const token of queryTokens) {
    const tf = termFreq[token] || 0;
    const classesWithTerm = NICE_CLASSES.filter((c) => c.tfidfTerms.some((t) => t.toLowerCase().includes(token)) || c.keywords.some((k) => k.toLowerCase().includes(token))).length;
    const idf = Math.log(46 / (1 + classesWithTerm) + 1);
    dot += idf * (tf > 0 ? tf * idf : 0);
    qNorm += idf * idf;
    dNorm += (tf > 0 ? tf * idf : 0) ** 2;
  }
  if (qNorm === 0 || dNorm === 0) return 0;
  return dot / (Math.sqrt(qNorm) * Math.sqrt(dNorm));
}

function runVectorSearch(tokens: string[], candidateNums: number[]): VectorResult[] {
  const space = candidateNums.length > 0 ? NICE_CLASSES.filter((c) => candidateNums.includes(c.classNumber)) : NICE_CLASSES;
  return space.map((cls) => ({ classNumber: cls.classNumber, vectorScore: computeTfIdfScore(tokens, cls) }))
    .filter((r) => r.vectorScore > 0)
    .sort((a, b) => b.vectorScore - a.vectorScore)
    .slice(0, 10);
}

// ─── HYBRID SCORING ──────────────────────────────────────────────────────────

interface HybridCandidate { classNumber: number; hybridScore: number; ruleScore: number; vectorScore: number; matchedKeywords: string[]; meta: NiceClassMeta }

function computeHybridScore(ruleResults: RuleResult[], vectorResults: VectorResult[], topK = 8): HybridCandidate[] {
  const ALPHA = 0.45, BETA = 0.55;
  const ruleMap = new Map(ruleResults.map((r) => [r.classNumber, r]));
  const vectorMap = new Map(vectorResults.map((v) => [v.classNumber, v]));
  const maxVec = Math.max(...vectorResults.map((v) => v.vectorScore), 0.001);
  const allCandidates = new Set([...ruleMap.keys(), ...vectorMap.keys()]);

  const scored: HybridCandidate[] = [];
  for (const cn of allCandidates) {
    const meta = NICE_CLASSES.find((c) => c.classNumber === cn);
    if (!meta) continue;
    const rule = ruleMap.get(cn);
    const vector = vectorMap.get(cn);
    scored.push({
      classNumber: cn, meta,
      ruleScore: rule?.ruleScore || 0,
      vectorScore: vector?.vectorScore || 0,
      hybridScore: ALPHA * (rule?.ruleScore || 0) + BETA * ((vector?.vectorScore || 0) / maxVec),
      matchedKeywords: rule?.matchedKeywords || [],
    });
  }
  return scored.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, topK);
}

// ─── LLM RE-RANKING ──────────────────────────────────────────────────────────

function buildLLMPrompt(query: string, candidates: HybridCandidate[], language: string): string {
  const list = candidates.map((c, i) =>
    `[${i + 1}] Class ${c.classNumber} – ${language === "vi" ? c.meta.titleVi : c.meta.titleEn} (type:${c.meta.type}, hybridScore:${c.hybridScore.toFixed(3)}, keywords:${c.matchedKeywords.join(",") || "none"})`
  ).join("\n");

  return `You are a NICE Classification expert (NCL 13-2026).
TASK: Re-rank the pre-filtered candidates for the query. Output top 1-3 classes.

QUERY: "${query}"
LANGUAGE for 'reason' field: ${language === "vi" ? "Vietnamese (tiếng Việt)" : "English"}

PRE-FILTERED CANDIDATES:
${list}

RULES:
- Only use classNumbers from: ${candidates.map((c) => c.classNumber).join(",")}
- Downloadable software → Class 9; Software-as-a-Service → Class 42
- Physical product → goods class; Service → service class
- Respond ONLY in valid JSON, no markdown code blocks.

JSON FORMAT:
{"results":[{"classNumber":<number>,"confidence":<0-1>,"reason":"<legal explanation>","items":["<NICE item 1>","<NICE item 2>"]}],"pipeline_trace":{"rule_top3":${JSON.stringify(candidates.slice(0,3).map(c=>c.classNumber))},"vector_top3":${JSON.stringify([...candidates].sort((a,b)=>b.vectorScore-a.vectorScore).slice(0,3).map(c=>c.classNumber))}}}`;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const query: string = body?.query || "";
    const language: string = body?.language || "vi";

    if (!query || typeof query !== "string" || query.length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: NLP
    const detectedLang = detectLanguage(query);
    const tokens = tokenize(query, detectedLang);

    // Step 2: Rule-based
    const ruleResults = runRuleBasedFilter(query, tokens);

    // Step 3: TF-IDF Vector Search
    const vectorResults = runVectorSearch(tokens, ruleResults.map((r) => r.classNumber));

    // Step 4: Hybrid scoring → Top-K
    let candidates = computeHybridScore(ruleResults, vectorResults, 8);
    if (candidates.length === 0) {
      candidates = computeHybridScore([], runVectorSearch(tokens, []), 8);
    }

    // Step 5: LLM re-rank
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          { role: "system", content: "You are a trademark classification expert. Respond with valid JSON only. No markdown." },
          { role: "user", content: buildLLMPrompt(query, candidates, language) },
        ],
      }),
    });

    if (!llmRes.ok) {
      const status = llmRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await llmRes.json();
    const content: string = aiData.choices?.[0]?.message?.content || "";

    let parsed: { results: Array<{ classNumber: number; confidence: number; reason: string; items: string[] }>; pipeline_trace?: Record<string, unknown> } = { results: [] };
    try {
      const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch {
      // LLM parse fail → fallback to hybrid top-3
    }

    const validSet = new Set(candidates.map((c) => c.classNumber));
    const safeResults = (parsed.results || []).filter((r) => validSet.has(r.classNumber)).slice(0, 3);

    const finalResults = safeResults.length > 0 ? safeResults : candidates.slice(0, 2).map((c) => ({
      classNumber: c.classNumber,
      confidence: Math.min(c.hybridScore * 1.1, 0.9),
      reason: language === "vi"
        ? `${c.meta.titleVi}: Phân tích từ khóa (${c.matchedKeywords.join(", ") || "ngữ nghĩa"})`
        : `${c.meta.titleEn}: Keyword analysis (${c.matchedKeywords.join(", ") || "semantic"})`,
      items: c.meta.tfidfTerms.slice(0, 3),
    }));

    return new Response(JSON.stringify({
      results: finalResults,
      pipeline_trace: {
        tokens,
        detected_language: detectedLang,
        rule_candidates: ruleResults.slice(0, 5).map((r) => ({ classNumber: r.classNumber, ruleScore: +r.ruleScore.toFixed(3), matchedKeywords: r.matchedKeywords })),
        vector_topk: vectorResults.slice(0, 5).map((v) => ({ classNumber: v.classNumber, vectorScore: +v.vectorScore.toFixed(4) })),
        hybrid_topk: candidates.slice(0, 5).map((c) => ({ classNumber: c.classNumber, hybridScore: +c.hybridScore.toFixed(3) })),
        llm_model: "gemini-flash-1.5 (re-rank only)",
        ...(parsed.pipeline_trace || {}),
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("classify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
