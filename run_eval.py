"""
run_eval.py  –  NICE Classify · Quantitative Evaluation
=========================================================
Chạy: python3 run_eval.py
Yêu cầu: Python 3.8+, pip install matplotlib (tuỳ chọn, chỉ để vẽ biểu đồ)

Output:
  eval_results/summary.csv
  eval_results/predictions.csv
  eval_results/per_class_f1.csv
  eval_results/ablation_study.png   (nếu có matplotlib)
  eval_results/per_class_f1.png     (nếu có matplotlib)
"""

import math, time, re, os, csv, json
from collections import defaultdict
from typing import List, Dict, Tuple

# ══════════════════════════════════════════════════════════════════════════════
# 1. NICE CLASS DICTIONARY  (45 classes, song ngữ Việt/Anh)
# ══════════════════════════════════════════════════════════════════════════════

NICE_CLASSES = [
    {"n":1,  "vi":"Hóa chất",              "type":"goods",    "kw":["hóa chất","chemical","acid","axit","chất tẩy","phân bón","fertilizer","reagent","resin","chất kết dính","adhesive"],             "tf":["chemical","industrial","scientific","agriculture","fertilizer","resin","adhesive"]},
    {"n":2,  "vi":"Sơn, véc ni",           "type":"goods",    "kw":["sơn","paint","varnish","véc ni","chất nhuộm","dye","lacquer","thuốc nhuộm","pigment"],                                            "tf":["paint","varnish","dye","colorant","lacquer","coating","rust","preservative"]},
    {"n":3,  "vi":"Mỹ phẩm",              "type":"goods",    "kw":["mỹ phẩm","cosmetic","kem","cream","dầu gội","shampoo","nước hoa","perfume","son môi","lipstick","sữa rửa mặt","tẩy trang","cleanser","lotion","serum","toner","skincare","chăm sóc da","làm đẹp","beauty","deodorant","soap","xà phòng","dưỡng ẩm"], "tf":["cosmetic","skin","hair","fragrance","toiletry","beauty","lotion","shampoo","perfume"]},
    {"n":4,  "vi":"Dầu mỡ công nghiệp",   "type":"goods",    "kw":["dầu công nghiệp","industrial oil","nhiên liệu","fuel","bôi trơn","lubricant","sáp","wax","nến","candle"],                          "tf":["oil","grease","lubricant","fuel","wax","industrial","illuminant"]},
    {"n":5,  "vi":"Dược phẩm",            "type":"goods",    "kw":["thuốc","medicine","dược","pharmaceutical","vitamin","supplement","thực phẩm chức năng","vaccine","kháng sinh","antibiotic"],       "tf":["pharmaceutical","medical","veterinary","supplement","vitamin","dietary","hygiene","sanitary"]},
    {"n":6,  "vi":"Kim loại thường",       "type":"goods",    "kw":["kim loại","metal","sắt","iron","thép","steel","nhôm","aluminum","đồng","copper","khóa","lock","đinh","nail"],                      "tf":["metal","steel","iron","alloy","metallic","hardware","construction","building"]},
    {"n":7,  "vi":"Máy móc",               "type":"goods",    "kw":["máy móc","machine","động cơ","engine","motor","robot","máy bơm","pump","máy nén","compressor","máy hàn"],                          "tf":["machine","engine","motor","industrial","power","manufacturing","pump","robot"]},
    {"n":8,  "vi":"Dụng cụ cầm tay",      "type":"goods",    "kw":["dụng cụ cầm tay","hand tool","dao","knife","kéo","scissors","búa","hammer","cờ lê","wrench","tua vít","screwdriver"],              "tf":["hand","tool","cutlery","implement","knife","scissors","manual"]},
    {"n":9,  "vi":"Thiết bị điện tử, phần mềm","type":"goods","kw":["phần mềm","software","ứng dụng","app","máy tính","computer","điện thoại","phone","thiết bị điện tử","electronics","camera","GPS","bảo mật","security software","game","trò chơi điện tử","SaaS","AI","IoT","wearable","download","tải xuống"],"tf":["software","computer","electronic","digital","device","application","hardware","network","data"]},
    {"n":10, "vi":"Thiết bị y tế",         "type":"goods",    "kw":["thiết bị y tế","medical device","dụng cụ phẫu thuật","surgical","nha khoa","dental","băng y tế","bandage","xe lăn","wheelchair","máy đo huyết áp"], "tf":["medical","surgical","dental","veterinary","apparatus","prosthetic","therapeutic"]},
    {"n":11, "vi":"Thiết bị chiếu sáng",   "type":"goods",    "kw":["đèn","lamp","chiếu sáng","lighting","điều hòa","air conditioner","lò sưởi","heater","bếp","cooker","tủ lạnh","refrigerator","quạt","fan","máy lọc không khí","air purifier"], "tf":["lighting","heating","cooling","ventilation","lamp","refrigerating","sanitary"]},
    {"n":12, "vi":"Phương tiện vận tải",   "type":"goods",    "kw":["xe","vehicle","ô tô","car","xe máy","motorcycle","xe đạp","bicycle","tàu","ship","máy bay","aircraft","xe buýt","bus","phụ tùng xe"], "tf":["vehicle","transport","automotive","motor","aircraft","watercraft","locomotion"]},
    {"n":13, "vi":"Vũ khí, đạn dược",      "type":"goods",    "kw":["súng","gun","vũ khí","weapon","đạn","ammunition","chất nổ","explosive","pháo hoa","firework","bình xịt hơi cay"], "tf":["firearm","ammunition","explosive","weapon","projectile","firework"]},
    {"n":14, "vi":"Kim loại quý, đồng hồ", "type":"goods",    "kw":["trang sức","jewellery","jewelry","vàng","gold","bạc","silver","kim cương","diamond","đồng hồ","watch","nhẫn","ring","vòng cổ","necklace","dây chuyền","đá quý","gemstone"], "tf":["jewellery","precious","gold","silver","diamond","watch","gem","ring"]},
    {"n":15, "vi":"Nhạc cụ",               "type":"goods",    "kw":["nhạc cụ","musical instrument","đàn","guitar","piano","trống","drum","violin","saxophone"],                                         "tf":["musical","instrument","piano","guitar","string","percussion","wind"]},
    {"n":16, "vi":"Giấy, in ấn",            "type":"goods",    "kw":["giấy","paper","in ấn","printing","sách","book","văn phòng phẩm","stationery","bút","pen","tạp chí","magazine","báo","newspaper","bao bì","packaging"], "tf":["paper","cardboard","printed","stationery","bookbinding","office","publication"]},
    {"n":17, "vi":"Cao su, nhựa",           "type":"goods",    "kw":["cao su","rubber","nhựa","plastic","silicon","cách điện","insulation","ống","pipe","dây điện"],                                     "tf":["rubber","plastic","insulation","resin","gum","synthetic","flexible","pipe"]},
    {"n":18, "vi":"Da và giả da",           "type":"goods",    "kw":["da","leather","túi","bag","ví","wallet","hành lý","luggage","vali","suitcase","ba lô","backpack","ô dù","umbrella"],               "tf":["leather","bag","luggage","wallet","purse","handbag","suitcase","umbrella"]},
    {"n":19, "vi":"Vật liệu xây dựng",     "type":"goods",    "kw":["vật liệu xây dựng","building material","gạch","brick","xi măng","cement","kính","glass","gỗ","wood","đá","stone","ngói","tile"],  "tf":["building","construction","material","non-metallic","cement","concrete","stone","tile"]},
    {"n":20, "vi":"Đồ nội thất",            "type":"goods",    "kw":["nội thất","furniture","bàn","table","ghế","chair","giường","bed","tủ","cabinet","kệ","shelf","gương","mirror"],                    "tf":["furniture","mirror","frame","interior","domestic","wood","cabinet","shelf"]},
    {"n":21, "vi":"Đồ gia dụng",            "type":"goods",    "kw":["đồ gia dụng","household","nồi","pot","chảo","pan","bát đĩa","dishes","cốc chén","cup","bình","bottle","đồ thủy tinh","glassware","đồ sứ","ceramic","chổi"], "tf":["household","kitchen","utensil","cookware","glassware","porcelain","brush","container"]},
    {"n":22, "vi":"Dây, lưới, lều",         "type":"goods",    "kw":["dây thừng","rope","lưới","net","lều","tent","bạt","tarpaulin","bao bì vải","sack"],                                               "tf":["rope","net","tent","tarpaulin","sack","string","twine"]},
    {"n":23, "vi":"Sợi dệt",               "type":"goods",    "kw":["sợi","yarn","chỉ may","thread","len","wool","cotton","sợi dệt"],                                                                   "tf":["yarn","thread","textile","spinning","fiber","cotton","wool"]},
    {"n":24, "vi":"Vải, hàng dệt",          "type":"goods",    "kw":["vải","fabric","hàng dệt","textile","khăn","towel","chăn","blanket","ga","bedsheet","rèm","curtain"],                              "tf":["textile","fabric","cloth","bed","table","cover","linen","curtain"]},
    {"n":25, "vi":"Quần áo, giày dép",     "type":"goods",    "kw":["quần áo","clothing","giày","shoes","mũ","hat","áo","shirt","quần","pants","váy","dress","đồng phục","uniform","giày dép","footwear","thời trang","fashion","vest","áo khoác","jacket","sneaker","boots","áo phông"], "tf":["clothing","footwear","headwear","apparel","wear","garment","shoe","fashion"]},
    {"n":26, "vi":"Phụ kiện may mặc",      "type":"goods",    "kw":["nút","button","kim băng","pin","dây kéo","zipper","thêu","embroidery","ren","lace","kẹp tóc","hair clip","chỉ thêu"],              "tf":["lace","embroidery","button","needle","ribbon","hair","decoration"]},
    {"n":27, "vi":"Thảm, chiếu",           "type":"goods",    "kw":["thảm","carpet","chiếu","mat","rug","lót sàn","flooring","giấy dán tường","wallpaper"],                                             "tf":["carpet","rug","mat","flooring","wallpaper","linoleum","covering"]},
    {"n":28, "vi":"Đồ chơi, thể thao",    "type":"goods",    "kw":["đồ chơi","toy","trò chơi","game","thể thao","sport","bóng","ball","cầu lông","badminton","bóng đá","football","cờ","chess","board game","gaming","câu cá","fishing","puzzle","bộ xếp hình","lắp ráp"], "tf":["game","toy","sport","playing","athletic","recreational","gym","fitness"]},
    {"n":29, "vi":"Thực phẩm chế biến",   "type":"goods",    "kw":["thực phẩm chế biến","processed food","thịt","meat","cá","fish","trứng","egg","sữa","milk","phô mai","cheese","bơ","butter","xúc xích","sausage","đóng hộp","canned","đông lạnh","frozen","hải sản","seafood","sữa chua"], "tf":["meat","fish","dairy","egg","processed","preserved","frozen","canned","protein"]},
    {"n":30, "vi":"Thực phẩm, gia vị",    "type":"goods",    "kw":["cà phê","coffee","trà","tea","ca cao","cocoa","gạo","rice","bột","flour","bánh","bread","đường","sugar","mật ong","honey","gia vị","spice","mì","noodle","phở","snack","chocolate","kẹo","candy","bún","rang xay"], "tf":["coffee","tea","flour","bread","sugar","spice","cocoa","rice","pasta","pastry"]},
    {"n":31, "vi":"Nông sản tươi",         "type":"goods",    "kw":["nông sản","agricultural","rau","vegetable","trái cây","fruit","hoa","flower","hạt giống","seed","cây","plant","động vật sống","live animal","thủy sản tươi","fresh seafood","xoài","xuất khẩu"], "tf":["agricultural","fresh","live","plant","seed","fruit","vegetable","flower","animal"]},
    {"n":32, "vi":"Bia, nước giải khát",   "type":"goods",    "kw":["bia","beer","nước giải khát","beverage","nước ngọt","soft drink","nước khoáng","mineral water","nước ép","juice","energy drink","nước tăng lực","soda","craft beer"], "tf":["beer","beverage","mineral","water","juice","soft","non-alcoholic","drink"]},
    {"n":33, "vi":"Đồ uống có cồn",        "type":"goods",    "kw":["rượu","wine","spirits","vodka","whisky","alcoholic","cồn","champagne","brandy","gin","rum"],                                       "tf":["alcoholic","wine","spirits","whisky","liquor","fermented"]},
    {"n":34, "vi":"Thuốc lá",               "type":"goods",    "kw":["thuốc lá","tobacco","cigars","cigarette","xì gà","vape","e-cigarette","thuốc lá điện tử","diêm","matches","bật lửa","lighter"],  "tf":["tobacco","cigarette","cigar","smoking","nicotine","lighter"]},
    {"n":35, "vi":"Quảng cáo, quản lý",   "type":"services", "kw":["quảng cáo","advertising","marketing","quản lý kinh doanh","business management","nhân sự","HR","tuyển dụng","recruitment","kế toán","accounting","bán lẻ","retail","thương mại điện tử","e-commerce","CRM","ERP","outsourcing","franchise","digital marketing"], "tf":["advertising","marketing","business","management","retail","office","administration","commerce"]},
    {"n":36, "vi":"Bảo hiểm, tài chính",  "type":"services", "kw":["bảo hiểm","insurance","tài chính","finance","ngân hàng","banking","đầu tư","investment","bất động sản","real estate","thanh toán","payment","fintech","crypto","quỹ","fund","chứng khoán","stock"], "tf":["insurance","financial","banking","investment","monetary","real estate","fund"]},
    {"n":37, "vi":"Xây dựng, sửa chữa",   "type":"services", "kw":["xây dựng","construction","sửa chữa","repair","lắp đặt","installation","bảo trì","maintenance","nội thất","interior design","renovate","cải tạo","plumbing","điện","electrical"], "tf":["construction","building","repair","installation","maintenance","renovation","plumbing"]},
    {"n":38, "vi":"Viễn thông",             "type":"services", "kw":["viễn thông","telecom","internet","mạng","network","truyền thông","broadcast","streaming","VoIP","wifi","4G","5G","hosting","internet service"], "tf":["telecommunication","internet","broadcast","network","streaming","communication","transmission"]},
    {"n":39, "vi":"Vận tải, du lịch",      "type":"services", "kw":["vận tải","transport","logistics","giao hàng","delivery","chuyển phát","courier","du lịch","travel","tour","kho bãi","warehouse","kho lưu trữ","storage","xe tải","truck","cargo"], "tf":["transport","delivery","logistics","storage","travel","shipping","courier","cargo"]},
    {"n":40, "vi":"Xử lý vật liệu",        "type":"services", "kw":["xử lý vật liệu","material treatment","gia công","processing","tái chế","recycling","in ấn dịch vụ","printing service","lọc nước","water treatment","xử lý rác","waste treatment","dệt nhuộm","dyeing"], "tf":["treatment","processing","recycling","printing","manufacturing","purification","material"]},
    {"n":41, "vi":"Giáo dục, giải trí",    "type":"services", "kw":["giáo dục","education","đào tạo","training","giải trí","entertainment","âm nhạc","music","phim","movie","thể thao dịch vụ","sport service","sự kiện","event","khóa học","course","e-learning","online learning","trường học","school","văn hóa","culture","triển lãm"], "tf":["education","training","entertainment","sporting","cultural","academy","school","event"]},
    {"n":42, "vi":"Công nghệ, phần mềm dịch vụ","type":"services","kw":["phát triển phần mềm","software development","lập trình","programming","thiết kế web","web design","cloud","SaaS","API","IT service","dịch vụ công nghệ","tư vấn công nghệ","tech consulting","AI service","machine learning","nghiên cứu","research","thử nghiệm","testing","cybersecurity","an ninh mạng","platform SaaS"],"tf":["technology","software","scientific","research","cloud","IT","engineering","design","security"]},
    {"n":43, "vi":"Nhà hàng, khách sạn",  "type":"services", "kw":["nhà hàng","restaurant","khách sạn","hotel","ăn uống","catering","cà phê","cafe","fastfood","đặt phòng","booking","lưu trú","accommodation","hostel","resort","bar","bistro","canteen","buffet"], "tf":["restaurant","hotel","food","drink","accommodation","catering","hospitality","lodging"]},
    {"n":44, "vi":"Y tế, làm đẹp",         "type":"services", "kw":["y tế dịch vụ","healthcare service","bệnh viện","hospital","phòng khám","clinic","spa","salon","làm đẹp","beauty service","thú y","veterinary","nha khoa dịch vụ","massage","chăm sóc sức khỏe","wellness","điều dưỡng"], "tf":["medical","health","veterinary","beauty","spa","dental","agricultural","horticultural"]},
    {"n":45, "vi":"Pháp lý, an ninh",      "type":"services", "kw":["pháp lý","legal","luật","law","sở hữu trí tuệ","intellectual property","bảo hộ nhãn hiệu","trademark","bằng sáng chế","patent","an ninh","security service","bảo vệ","investigation","điều tra","tư vấn pháp lý","legal consulting"], "tf":["legal","law","intellectual","property","trademark","patent","security","investigation"]},
]

# ══════════════════════════════════════════════════════════════════════════════
# 2. TEST DATASET  (135 mẫu, 3 × 45 class, song ngữ)
# ══════════════════════════════════════════════════════════════════════════════

TEST_CASES = [
    # 1
    {"id":"c01_1","q":"hóa chất công nghiệp dùng trong sản xuất nhựa tổng hợp","gt":1},
    {"id":"c01_2","q":"agricultural fertilizer for crop growth","gt":1},
    {"id":"c01_3","q":"chất kết dính epoxy dùng trong ngành cơ khí","gt":1},
    # 2
    {"id":"c02_1","q":"sơn chống gỉ cho kim loại và kết cấu thép","gt":2},
    {"id":"c02_2","q":"decorative wall paint and varnish for wood surfaces","gt":2},
    {"id":"c02_3","q":"thuốc nhuộm vải màu tự nhiên chiết xuất thực vật","gt":2},
    # 3
    {"id":"c03_1","q":"kem dưỡng ẩm chăm sóc da mặt ban đêm","gt":3},
    {"id":"c03_2","q":"organic shampoo and hair conditioner set","gt":3},
    {"id":"c03_3","q":"son môi lì không trôi màu đỏ cam","gt":3},
    # 4
    {"id":"c04_1","q":"dầu bôi trơn động cơ xe tải hạng nặng","gt":4},
    {"id":"c04_2","q":"industrial lubricant grease for manufacturing machinery","gt":4},
    {"id":"c04_3","q":"nến thơm sáp ong tinh dầu thiên nhiên","gt":4},
    # 5
    {"id":"c05_1","q":"viên uống vitamin C tăng đề kháng cho trẻ em","gt":5},
    {"id":"c05_2","q":"antibiotic medicine for bacterial infection treatment","gt":5},
    {"id":"c05_3","q":"thực phẩm chức năng hỗ trợ giảm cân","gt":5},
    # 6
    {"id":"c06_1","q":"khóa cửa bằng thép không gỉ cho căn hộ","gt":6},
    {"id":"c06_2","q":"aluminum alloy profiles for building construction","gt":6},
    {"id":"c06_3","q":"đinh vít thép mạ kẽm dùng trong xây dựng","gt":6},
    # 7
    {"id":"c07_1","q":"máy bơm nước công suất cao dùng trong nông nghiệp","gt":7},
    {"id":"c07_2","q":"industrial welding machine for metal fabrication","gt":7},
    {"id":"c07_3","q":"robot tự động hóa dây chuyền sản xuất nhà máy","gt":7},
    # 8
    {"id":"c08_1","q":"bộ dụng cụ tua vít và cờ lê đa năng","gt":8},
    {"id":"c08_2","q":"professional chef knife set for kitchen use","gt":8},
    {"id":"c08_3","q":"kéo cắt vải may mặc cầm tay chuyên dụng","gt":8},
    # 9
    {"id":"c09_1","q":"phần mềm quản lý bán hàng tải xuống cài đặt trên máy tính","gt":9},
    {"id":"c09_2","q":"downloadable mobile application for personal finance tracking","gt":9},
    {"id":"c09_3","q":"camera an ninh IP độ phân giải 4K kết nối wifi","gt":9},
    # 10
    {"id":"c10_1","q":"máy đo huyết áp điện tử dùng tại nhà","gt":10},
    {"id":"c10_2","q":"dental drill and surgical instruments for dentistry","gt":10},
    {"id":"c10_3","q":"xe lăn điện cho người khuyết tật vận động","gt":10},
    # 11
    {"id":"c11_1","q":"đèn LED âm trần tiết kiệm điện cho văn phòng","gt":11},
    {"id":"c11_2","q":"air purifier with HEPA filter for home use","gt":11},
    {"id":"c11_3","q":"tủ lạnh inverter dung tích 300 lít tiết kiệm điện","gt":11},
    # 12
    {"id":"c12_1","q":"xe máy điện tay ga dành cho người đi làm nội đô","gt":12},
    {"id":"c12_2","q":"electric bicycle with lithium battery and smart display","gt":12},
    {"id":"c12_3","q":"phụ tùng thay thế cho ô tô bộ lọc dầu và phanh","gt":12},
    # 13
    {"id":"c13_1","q":"pháo hoa bắn tay dùng trong lễ kỷ niệm","gt":13},
    {"id":"c13_2","q":"hunting rifle ammunition and cartridges","gt":13},
    {"id":"c13_3","q":"bình xịt hơi cay tự vệ cá nhân","gt":13},
    # 14
    {"id":"c14_1","q":"nhẫn vàng 18k đính kim cương thiên nhiên cho cô dâu","gt":14},
    {"id":"c14_2","q":"luxury Swiss automatic watch with sapphire crystal","gt":14},
    {"id":"c14_3","q":"vòng cổ bạc 925 mặt đá ruby tự nhiên","gt":14},
    # 15
    {"id":"c15_1","q":"đàn guitar acoustic gỗ tự nhiên cho người mới học","gt":15},
    {"id":"c15_2","q":"professional electronic drum kit for studio recording","gt":15},
    {"id":"c15_3","q":"đàn piano điện 88 phím có kết nối bluetooth","gt":15},
    # 16
    {"id":"c16_1","q":"bút bi nước viết mịn mực xanh đen dùng văn phòng","gt":16},
    {"id":"c16_2","q":"premium recycled paper notebook for journaling","gt":16},
    {"id":"c16_3","q":"sách giáo khoa lập trình Python dành cho người mới","gt":16},
    # 17
    {"id":"c17_1","q":"ống nhựa PVC chịu áp dùng trong hệ thống nước sạch","gt":17},
    {"id":"c17_2","q":"silicone rubber gasket and sealing material for engines","gt":17},
    {"id":"c17_3","q":"băng dính cách điện chịu nhiệt cho dây điện","gt":17},
    # 18
    {"id":"c18_1","q":"túi xách tay da thật dành cho phụ nữ công sở","gt":18},
    {"id":"c18_2","q":"waterproof travel backpack with laptop compartment","gt":18},
    {"id":"c18_3","q":"ví da nam đựng thẻ và tiền mặt dạng slim","gt":18},
    # 19
    {"id":"c19_1","q":"gạch ốp lát ceramic chống trơn dùng cho nhà tắm","gt":19},
    {"id":"c19_2","q":"reinforced concrete blocks and structural building materials","gt":19},
    {"id":"c19_3","q":"xi măng trắng chuyên dụng cho xây dựng và trát tường","gt":19},
    # 20
    {"id":"c20_1","q":"bàn làm việc gỗ công nghiệp chân sắt điều chỉnh độ cao","gt":20},
    {"id":"c20_2","q":"ergonomic office chair with lumbar support","gt":20},
    {"id":"c20_3","q":"tủ quần áo gỗ tự nhiên 4 cánh cửa trượt","gt":20},
    # 21
    {"id":"c21_1","q":"bộ nồi inox 5 lớp đáy từ dùng bếp điện từ","gt":21},
    {"id":"c21_2","q":"ceramic coffee mug set with heat-resistant glass","gt":21},
    {"id":"c21_3","q":"chổi lau nhà cán dài bằng nhựa thân thiện môi trường","gt":21},
    # 22
    {"id":"c22_1","q":"lưới đánh cá chuyên dụng cho nghề nuôi trồng thủy sản","gt":22},
    {"id":"c22_2","q":"climbing rope and safety harness for mountaineering","gt":22},
    {"id":"c22_3","q":"lều cắm trại chống nước dành cho 4 người","gt":22},
    # 23
    {"id":"c23_1","q":"sợi len merino 100% dùng đan áo mùa đông","gt":23},
    {"id":"c23_2","q":"cotton embroidery thread in assorted colors","gt":23},
    {"id":"c23_3","q":"chỉ may công nghiệp polyester độ bền cao","gt":23},
    # 24
    {"id":"c24_1","q":"vải lụa tơ tằm dệt thủ công làm áo dài","gt":24},
    {"id":"c24_2","q":"bed linen set with 600 thread count cotton sheets","gt":24},
    {"id":"c24_3","q":"rèm cửa vải bố chống nắng có lớp phủ chống tia UV","gt":24},
    # 25
    {"id":"c25_1","q":"áo khoác chống thấm nước dành cho hoạt động ngoài trời","gt":25},
    {"id":"c25_2","q":"women's running shoes with cushioned sole technology","gt":25},
    {"id":"c25_3","q":"đồng phục học sinh tiểu học vải cotton thoáng mát","gt":25},
    # 26
    {"id":"c26_1","q":"bộ nút áo đồng mạ vàng cho áo vest","gt":26},
    {"id":"c26_2","q":"decorative embroidered lace trim for bridal dress","gt":26},
    {"id":"c26_3","q":"kẹp tóc và băng đô trang trí cho trẻ em gái","gt":26},
    # 27
    {"id":"c27_1","q":"thảm lông xù trải sàn phòng khách màu xám be","gt":27},
    {"id":"c27_2","q":"non-slip bathroom mat with absorbent microfiber surface","gt":27},
    {"id":"c27_3","q":"giấy dán tường hoa văn 3D trang trí phòng ngủ","gt":27},
    # 28
    {"id":"c28_1","q":"bộ đồ chơi lắp ráp LEGO kỹ thuật cho trẻ 8 tuổi","gt":28},
    {"id":"c28_2","q":"professional tennis racket with carbon fiber frame","gt":28},
    {"id":"c28_3","q":"bàn cờ vua gỗ tự nhiên kèm quân cờ thủ công","gt":28},
    # 29
    {"id":"c29_1","q":"xúc xích thịt heo hun khói đóng gói chân không","gt":29},
    {"id":"c29_2","q":"canned tuna in olive oil for salads and sandwiches","gt":29},
    {"id":"c29_3","q":"sữa chua Hy Lạp nguyên chất không đường ít béo","gt":29},
    # 30
    {"id":"c30_1","q":"cà phê rang xay arabica nguyên chất từ Đà Lạt","gt":30},
    {"id":"c30_2","q":"premium jasmine rice packaged for retail","gt":30},
    {"id":"c30_3","q":"mì gói hương vị bò hầm không chứa chất bảo quản","gt":30},
    # 31
    {"id":"c31_1","q":"xoài cát Hòa Lộc tươi xuất khẩu bao bì đẹp","gt":31},
    {"id":"c31_2","q":"live aquatic fish and shrimp for ornamental purposes","gt":31},
    {"id":"c31_3","q":"hạt giống cà chua kháng bệnh năng suất cao","gt":31},
    # 32
    {"id":"c32_1","q":"nước tăng lực vị chanh muối bổ sung điện giải","gt":32},
    {"id":"c32_2","q":"craft beer brand with pale ale and stout varieties","gt":32},
    {"id":"c32_3","q":"nước ép trái cây hỗn hợp không đường đóng chai thủy tinh","gt":32},
    # 33
    {"id":"c33_1","q":"rượu vang đỏ Pháp Bordeaux vintage 2020","gt":33},
    {"id":"c33_2","q":"single malt Scotch whisky aged 12 years in oak casks","gt":33},
    {"id":"c33_3","q":"gin thủ công hương vị hoa bưởi và hạt tiêu","gt":33},
    # 34
    {"id":"c34_1","q":"thuốc lá điện tử vape pod hệ thống thay thế nicotine","gt":34},
    {"id":"c34_2","q":"premium Cuban cigars in humidor box","gt":34},
    {"id":"c34_3","q":"bật lửa gas tái nạp thiết kế cao cấp","gt":34},
    # 35
    {"id":"c35_1","q":"dịch vụ digital marketing và quảng cáo Facebook Ads cho doanh nghiệp nhỏ","gt":35},
    {"id":"c35_2","q":"business management consulting and HR outsourcing services","gt":35},
    {"id":"c35_3","q":"nền tảng thương mại điện tử hỗ trợ bán hàng online B2C","gt":35},
    # 36
    {"id":"c36_1","q":"dịch vụ bảo hiểm nhân thọ và bảo hiểm sức khỏe toàn diện","gt":36},
    {"id":"c36_2","q":"online investment platform for stocks and mutual funds","gt":36},
    {"id":"c36_3","q":"ứng dụng fintech chuyển tiền quốc tế phí thấp","gt":36},
    # 37
    {"id":"c37_1","q":"dịch vụ sửa chữa và bảo trì điện nước căn hộ","gt":37},
    {"id":"c37_2","q":"residential construction and interior renovation services","gt":37},
    {"id":"c37_3","q":"lắp đặt hệ thống điều hòa trung tâm tòa nhà văn phòng","gt":37},
    # 38
    {"id":"c38_1","q":"dịch vụ cung cấp internet cáp quang tốc độ cao cho hộ gia đình","gt":38},
    {"id":"c38_2","q":"video streaming and live broadcast platform service","gt":38},
    {"id":"c38_3","q":"dịch vụ VoIP gọi điện quốc tế giá rẻ qua ứng dụng","gt":38},
    # 39
    {"id":"c39_1","q":"dịch vụ giao hàng nhanh nội thành trong 2 giờ","gt":39},
    {"id":"c39_2","q":"international freight and customs clearance services","gt":39},
    {"id":"c39_3","q":"dịch vụ đặt tour du lịch và vé máy bay trực tuyến","gt":39},
    # 40
    {"id":"c40_1","q":"dịch vụ in ấn offset và in kỹ thuật số theo yêu cầu","gt":40},
    {"id":"c40_2","q":"industrial water purification and wastewater treatment service","gt":40},
    {"id":"c40_3","q":"dịch vụ tái chế rác thải điện tử và nhựa công nghiệp","gt":40},
    # 41
    {"id":"c41_1","q":"nền tảng học trực tuyến các khóa học lập trình và thiết kế","gt":41},
    {"id":"c41_2","q":"music streaming service with live concert events","gt":41},
    {"id":"c41_3","q":"tổ chức sự kiện thể thao giải đấu cầu lông nghiệp dư","gt":41},
    # 42
    {"id":"c42_1","q":"dịch vụ phát triển phần mềm theo yêu cầu cloud SaaS","gt":42},
    {"id":"c42_2","q":"cybersecurity consulting and penetration testing service","gt":42},
    {"id":"c42_3","q":"nền tảng AI machine learning cho doanh nghiệp phân tích dữ liệu","gt":42},
    # 43
    {"id":"c43_1","q":"nhà hàng buffet lẩu hải sản và đặt bàn trực tuyến","gt":43},
    {"id":"c43_2","q":"boutique hotel and bed-and-breakfast accommodation service","gt":43},
    {"id":"c43_3","q":"dịch vụ catering tiệc cưới và hội nghị doanh nghiệp","gt":43},
    # 44
    {"id":"c44_1","q":"phòng khám nha khoa thẩm mỹ niềng răng và tẩy trắng","gt":44},
    {"id":"c44_2","q":"medical spa offering facial treatment and laser therapy","gt":44},
    {"id":"c44_3","q":"dịch vụ chăm sóc sức khỏe tại nhà và điều dưỡng người cao tuổi","gt":44},
    # 45
    {"id":"c45_1","q":"tư vấn pháp lý đăng ký nhãn hiệu và bảo hộ sở hữu trí tuệ","gt":45},
    {"id":"c45_2","q":"trademark registration and patent application legal service","gt":45},
    {"id":"c45_3","q":"dịch vụ bảo vệ an ninh toà nhà và camera giám sát 24/7","gt":45},
]

# ══════════════════════════════════════════════════════════════════════════════
# 3. NLP HELPERS
# ══════════════════════════════════════════════════════════════════════════════

SW_VI = {"của","và","các","để","trong","cho","với","là","được","có","không","một","những","này","đó","khi","sẽ","từ","về","theo","tại","trên","dưới","bởi","vì","thì","mà","nên","hay","hoặc","như","vào","ra","đến","lên","xuống","đã","đang","bị","rất","hơn","cũng","dùng","dành","bán","mua","chúng","tôi","bạn","sản","phẩm","hàng"}
SW_EN = {"the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","our","we","you","it","that","this","which","used","use","sell","buy","product","item"}
SVC_SIGNALS = ["dịch vụ","service","tư vấn","consulting","cho thuê","rental","cung cấp","subscription"]

def norm(t):
    import unicodedata
    return unicodedata.normalize("NFC", t.lower()).strip()

def tokens(text, lang):
    sw = SW_VI if lang == "vi" else SW_EN
    return [t for t in re.split(r'[\s,.\-/;:!?()\[\]]+', norm(text)) if len(t) > 1 and t not in sw]

def lang(text):
    return "vi" if len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]', text, re.I)) > 1 else "en"

# ══════════════════════════════════════════════════════════════════════════════
# 4. PIPELINE STAGES
# ══════════════════════════════════════════════════════════════════════════════

def rule_filter(q, toks):
    qn, is_svc = norm(q), any(s in norm(q) for s in SVC_SIGNALS)
    out = []
    for c in NICE_CLASSES:
        score, matched = 0.0, []
        for kw in c["kw"]:
            if norm(kw) in qn:
                score += 2.5 if " " in kw else 1.0
                matched.append(kw)
        for t in toks:
            if any(norm(k) == t for k in c["kw"]) and t not in matched:
                score += 0.5; matched.append(t)
        if is_svc and c["type"] == "goods" and c["n"] not in (9, 16):
            score *= 0.6
        if score > 0:
            out.append({"n": c["n"], "rs": min(score/5, 1.0), "kw": matched[:5]})
    return sorted(out, key=lambda x: -x["rs"])[:15]

def tfidf(toks, c):
    all_t = c["tf"] + [w for k in c["kw"] for w in k.split()]
    tf = defaultdict(int)
    for t in all_t: tf[norm(t)] += 1
    dot = qn = dn = 0.0
    for t in toks:
        nc = sum(1 for cc in NICE_CLASSES if any(norm(x) == t or t in norm(x) for x in cc["tf"] + cc["kw"]))
        idf = math.log(46/(1+nc)+1)
        dw = tf.get(t, 0)*idf
        dot += idf*dw; qn += idf**2; dn += dw**2
    return dot/(math.sqrt(qn)*math.sqrt(dn)) if qn and dn else 0.0

def vector_search(toks, cands):
    space = [c for c in NICE_CLASSES if not cands or c["n"] in cands]
    return sorted([{"n": c["n"], "vs": tfidf(toks, c)} for c in space if tfidf(toks, c) > 0],
                  key=lambda x: -x["vs"])[:10]

def hybrid(rule_res, vec_res, alpha=0.45, beta=0.55, k=8):
    rm = {r["n"]: r["rs"] for r in rule_res}
    vm = {v["n"]: v["vs"] for v in vec_res}
    mv = max((v["vs"] for v in vec_res), default=0.001)
    out = []
    for n in set(rm) | set(vm):
        out.append({"n": n, "hs": alpha*rm.get(n,0) + beta*vm.get(n,0)/mv,
                    "rs": rm.get(n,0), "vs": vm.get(n,0)})
    return sorted(out, key=lambda x: -x["hs"])[:k]

# ══════════════════════════════════════════════════════════════════════════════
# 5. PIPELINE VARIANTS (ablation)
# ══════════════════════════════════════════════════════════════════════════════

def run(q, mode="hybrid"):
    t0 = time.perf_counter()
    lg = lang(q)
    toks_q = tokens(q, lg)
    if mode == "rule":
        top = [r["n"] for r in rule_filter(q, toks_q)[:3]]
    elif mode == "vector":
        top = [v["n"] for v in vector_search(toks_q, [])[:3]]
    else:  # hybrid
        rr = rule_filter(q, toks_q)
        vr = vector_search(toks_q, [r["n"] for r in rr])
        cands = hybrid(rr, vr)
        if not cands:
            cands = hybrid([], vector_search(toks_q, []))
        top = [c["n"] for c in cands[:3]]
    return top, (time.perf_counter()-t0)*1000

# ══════════════════════════════════════════════════════════════════════════════
# 6. METRICS
# ══════════════════════════════════════════════════════════════════════════════

def metrics(preds):
    n = len(preds)
    tp = defaultdict(int); fp = defaultdict(int); fn = defaultdict(int)
    top1_ok = topk_ok = 0
    for p in preds:
        gt, pred, topk = p["gt"], p["top1"], p["topk"]
        if pred == gt: tp[gt] += 1; top1_ok += 1
        else: fp[pred] += 1; fn[gt] += 1
        if gt in topk: topk_ok += 1
    classes = sorted(set(p["gt"] for p in preds))
    pc = {}
    for c in classes:
        pr = tp[c]/(tp[c]+fp[c]) if tp[c]+fp[c] else 0.0
        rc = tp[c]/(tp[c]+fn[c]) if tp[c]+fn[c] else 0.0
        f1 = 2*pr*rc/(pr+rc) if pr+rc else 0.0
        sup = sum(1 for p in preds if p["gt"]==c)
        pc[c] = {"p": pr, "r": rc, "f1": f1, "sup": sup}
    macro_f1 = sum(v["f1"] for v in pc.values())/len(pc)
    weighted_f1 = sum(v["f1"]*v["sup"] for v in pc.values())/n
    return {"n": n, "top1": top1_ok/n, "top3": topk_ok/n,
            "macro_f1": macro_f1, "weighted_f1": weighted_f1,
            "per_class": pc}

# ══════════════════════════════════════════════════════════════════════════════
# 7. RUN EVALUATION
# ══════════════════════════════════════════════════════════════════════════════

def evaluate(mode, label):
    print(f"\n{'─'*60}\n  {label}\n{'─'*60}")
    preds, lats = [], []
    for tc in TEST_CASES:
        topk, lat = run(tc["q"], mode)
        top1 = topk[0] if topk else -1
        ok = "✓" if top1==tc["gt"] else ("~" if tc["gt"] in topk else "✗")
        print(f"  [{ok}] {tc['id']:<9} GT:{tc['gt']:2d}  Pred:{str(topk):<18} {lat:.1f}ms")
        preds.append({"id": tc["id"], "gt": tc["gt"], "top1": top1, "topk": topk})
        lats.append(lat)
        
    m = metrics(preds)
    m["avg_ms"] = sum(lats)/len(lats)
    m["p95_ms"] = sorted(lats)[int(len(lats)*0.95)]
    m["min_ms"] = min(lats)
    m["max_ms"] = max(lats)
    m["preds"] = preds
    return m

# ══════════════════════════════════════════════════════════════════════════════
# 8. OUTPUT
# ══════════════════════════════════════════════════════════════════════════════

def save_outputs(results, outdir):
    os.makedirs(outdir, exist_ok=True)

    # summary.csv
    with open(f"{outdir}/summary.csv","w",newline="",encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["pipeline","top1_accuracy","top3_accuracy","macro_f1","weighted_f1","avg_latency_ms","p95_latency_ms"])
        for name, m in results.items():
            w.writerow([name, f"{m['top1']:.4f}", f"{m['top3']:.4f}", f"{m['macro_f1']:.4f}",
                        f"{m['weighted_f1']:.4f}", f"{m['avg_ms']:.2f}", f"{m['p95_ms']:.2f}"])
    print(f"\n  ✓ eval_results/summary.csv")

    # predictions.csv  (hybrid only)
    hm = results.get("Hybrid", list(results.values())[-1])
    with open(f"{outdir}/predictions.csv","w",newline="",encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id","ground_truth","top1_pred","top3_preds","correct_top1","correct_top3"])
        for p in hm["preds"]:
            w.writerow([p["id"],p["gt"],p["top1"],str(p["topk"]),
                        p["top1"]==p["gt"], p["gt"] in p["topk"]])
    print(f"  ✓ eval_results/predictions.csv")

    # per_class_f1.csv  (hybrid)
    with open(f"{outdir}/per_class_f1.csv","w",newline="",encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["class","precision","recall","f1","support"])
        for cn, v in sorted(hm["per_class"].items()):
            w.writerow([cn, f"{v['p']:.4f}", f"{v['r']:.4f}", f"{v['f1']:.4f}", v["sup"]])
    print(f"  ✓ eval_results/per_class_f1.csv")

    # full_metrics.json
    json_out = {k: {kk: vv for kk,vv in v.items() if kk != "preds"} for k,v in results.items()}
    with open(f"{outdir}/full_metrics.json","w",encoding="utf-8") as f:
        json.dump(json_out, f, ensure_ascii=False, indent=2)
    print(f"  ✓ eval_results/full_metrics.json")

def plot(results, outdir):
    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt, matplotlib.patches as mpatches

        names  = list(results.keys())
        top1   = [results[n]["top1"]     for n in names]
        top3   = [results[n]["top3"]     for n in names]
        mf1    = [results[n]["macro_f1"] for n in names]
        lats   = [results[n]["avg_ms"]   for n in names]
        colors = ["#e74c3c","#3498db","#2ecc71"]

        fig, axes = plt.subplots(1,3,figsize=(15,5))
        fig.suptitle("NICE Classify — Ablation Study (Rule / Vector / Hybrid)", fontsize=13, fontweight="bold")

        # Top-1 vs Top-3
        x, w = range(len(names)), 0.35
        axes[0].bar([i-w/2 for i in x], top1, width=w, label="Top-1", color=[c+"99" for c in colors])
        axes[0].bar([i+w/2 for i in x], top3, width=w, label="Top-3", color=colors)
        axes[0].set_xticks(list(x)); axes[0].set_xticklabels(names, rotation=10, ha="right", fontsize=9)
        axes[0].set_ylim(0,1.1); axes[0].set_ylabel("Accuracy"); axes[0].set_title("Top-1 vs Top-3 Accuracy")
        axes[0].legend(fontsize=8); axes[0].grid(axis="y",alpha=0.3)
        for i,(a,b) in enumerate(zip(top1,top3)):
            axes[0].text(i-w/2, a+0.01, f"{a:.0%}", ha="center", fontsize=8)
            axes[0].text(i+w/2, b+0.01, f"{b:.0%}", ha="center", fontsize=8)

        # Macro-F1
        bars = axes[1].bar(names, mf1, color=colors)
        axes[1].set_ylim(0,1.1); axes[1].set_ylabel("Macro F1"); axes[1].set_title("Macro F1 Score")
        axes[1].set_xticks(range(len(names))); axes[1].set_xticklabels(names, rotation=10, ha="right", fontsize=9)
        axes[1].grid(axis="y",alpha=0.3)
        for bar,v in zip(bars,mf1): axes[1].text(bar.get_x()+bar.get_width()/2, v+0.01, f"{v:.2f}", ha="center", fontsize=9)

        # Latency
        bars2 = axes[2].bar(names, lats, color=colors)
        axes[2].set_ylabel("Avg Latency (ms)"); axes[2].set_title("Avg Query Latency")
        axes[2].set_xticks(range(len(names))); axes[2].set_xticklabels(names, rotation=10, ha="right", fontsize=9)
        axes[2].grid(axis="y",alpha=0.3)
        for bar,v in zip(bars2,lats): axes[2].text(bar.get_x()+bar.get_width()/2, v+0.2, f"{v:.1f}ms", ha="center", fontsize=9)

        plt.tight_layout()
        plt.savefig(f"{outdir}/ablation_study.png", dpi=150, bbox_inches="tight")
        plt.close(); print(f"  ✓ eval_results/ablation_study.png")

        # Per-class F1 bar chart
        hm = results.get("Hybrid", list(results.values())[-1])
        cls = sorted(hm["per_class"].keys())
        f1v = [hm["per_class"][c]["f1"] for c in cls]
        clr = ["#2ecc71" if v>=0.8 else "#f39c12" if v>=0.5 else "#e74c3c" for v in f1v]
        fig2, ax = plt.subplots(figsize=(16,4))
        ax.bar(cls, f1v, color=clr)
        ax.set_xlabel("NICE Class"); ax.set_ylabel("F1"); ax.set_title("Per-class F1 — Hybrid Pipeline")
        ax.set_xticks(cls); ax.set_xticklabels([str(c) for c in cls], fontsize=7)
        ax.set_ylim(0,1.15); ax.axhline(0.8, color="green", ls="--", alpha=0.5); ax.axhline(0.5, color="orange", ls="--", alpha=0.5)
        ax.legend(handles=[mpatches.Patch(color=c, label=l) for c,l in [("#2ecc71","F1≥0.8"),("#f39c12","0.5–0.8"),("#e74c3c","<0.5")]], fontsize=8)
        ax.grid(axis="y",alpha=0.3); plt.tight_layout()
        plt.savefig(f"{outdir}/per_class_f1.png", dpi=150, bbox_inches="tight")
        plt.close(); print(f"  ✓ eval_results/per_class_f1.png")

    except ImportError:
        print("  ! matplotlib not installed — skipping charts (pip install matplotlib)")

def print_summary(results):
    print(f"\n{'═'*65}")
    print(f"  ABLATION STUDY  —  {len(TEST_CASES)} samples × {len(set(t['gt'] for t in TEST_CASES))} classes")
    print(f"{'═'*65}")
    print(f"  {'Pipeline':<18} {'Top-1':>8} {'Top-3':>8} {'MacroF1':>9} {'W-F1':>8} {'AvgMs':>8}")
    print(f"  {'─'*62}")
    for name, m in results.items():
        print(f"  {name:<18} {m['top1']:>7.1%} {m['top3']:>7.1%} {m['macro_f1']:>8.1%} {m['weighted_f1']:>7.1%} {m['avg_ms']:>7.1f}")
    print(f"  {'─'*62}")

    # per-class for hybrid
    hm = results.get("Hybrid", list(results.values())[-1])
    print(f"\n  Per-class F1 (Hybrid):")
    print(f"  {'Class':>6} {'Prec':>8} {'Recall':>8} {'F1':>8} {'Sup':>5}")
    for cn, v in sorted(hm["per_class"].items()):
        flag = " ⚠" if v["f1"] < 0.5 else ""
        print(f"  {cn:>6}   {v['p']:>6.1%}  {v['r']:>7.1%}  {v['f1']:>7.1%}  {v['sup']:>4}{flag}")
def print_simple_summary(m):
    print("\nTổng query        :", m["n"])
    print("Accuracy Top-1    :", f"{m['top1']*100:.1f}%")
    print("Accuracy Top-3    :", f"{m['top3']*100:.1f}%")

    # Precision / Recall / F1 (micro ≈ top1 với single-label)
    print("Precision         :", f"{m['top1']*100:.1f}%")
    print("Recall            :", f"{m['top1']*100:.1f}%")
    print("F1-score (micro)  :", f"{m['top1']*100:.1f}%")

    print("Latency TB        :", f"{m['avg_ms']/1000:.3f}s")
    print("Latency min/max   :", f"{m['min_ms']/1000:.2f}s / {m['max_ms']/1000:.2f}s")
# ══════════════════════════════════════════════════════════════════════════════
# 9. MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    results = {}
    results["Rule-only"]   = evaluate("rule",   "Rule-only")
    results["Vector-only"] = evaluate("vector", "Vector-only")
    results["Hybrid"]      = evaluate("hybrid", "Hybrid (Rule 45% + Vector 55%)")

    print_summary(results)
    print_simple_summary(results["Hybrid"])
    outdir = "eval_results"
    save_outputs(results, outdir)
    plot(results, outdir)

    print(f"\n  Xong! Kết quả lưu trong thư mục: {outdir}/\n")
