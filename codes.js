/* ============================================================
   成分代號（2026-11-09）：輸入 E330、INS 330、CI 77891、VC、BHA… 直接查是什麼。
   用在三個地方：
   1.「依成分查詢」：輸入代號會先跳出代號卡；有完整資料的會接著顯示詳情
   2.「成分對照表」→「代號對照」分頁：全部代號列表、分類篩選、搜尋
   3.「店內挑選」：成分表裡打代號（例如 CI 77891）也認得
   純前端、不呼叫 API。
   ============================================================ */
(function(){
  'use strict';

  /* 類型 */
  var TYPE = {
    E:  { label:'食品添加物編號', short:'E 編號', icon:'🍬' },
    CI: { label:'化妝品色素編號', short:'CI 色號', icon:'🎨' },
    AB: { label:'常見縮寫',       short:'縮寫',   icon:'🔤' },
    U:  { label:'標示與單位',     short:'標示',   icon:'📏' }
  };
  var WHERE = { s:'保健食品', k:'保養品', c:'化妝品' };

  /* [類型, 代號, 中文名, 英文名, 用途, 一句話說明, 其他]
     其他：w 要注意、db 對應「依成分查詢」資料庫名稱、pk 對應「店內挑選」成分、alt 其他寫法、at 常見於（s 保健食品、k 保養品、c 化妝品） */
  var RAW = [
    // ---------- 食品添加物：E 編號（國際 INS 編號數字相同） ----------
    ['E','E100','薑黃素','Curcumin','色素（黃）','薑黃的黃色成分，也拿來當天然黃色色素',{db:'薑黃'}],
    ['E','E101','核黃素（維生素 B2）','Riboflavin','色素／營養素','就是維生素 B2，吃了尿液變很黃是正常的',{db:'B群'}],
    ['E','E102','檸檬黃','Tartrazine','合成色素（黃）','台灣食品叫「食用黃色四號」，美國叫 Yellow 5（CI 19140）',{w:'少數人會過敏，對阿斯匹靈過敏的人要留意',alt:['黃色四號','黃色4號']}],
    ['E','E110','日落黃','Sunset Yellow FCF','合成色素（橘黃）','台灣食品叫「食用黃色五號」，美國叫 Yellow 6（CI 15985）',{alt:['黃色五號','黃色5號']}],
    ['E','E120','胭脂蟲紅','Carmine / Cochineal','天然色素（紅）','從胭脂蟲萃取的紅色，素食者會避開',{w:'少數人會過敏'}],
    ['E','E129','誘惑紅','Allura Red AC','合成色素（紅）','台灣叫「食用紅色四十號」，美國叫 Red 40（CI 16035）',{alt:['紅色四十號','紅色40號']}],
    ['E','E133','亮藍','Brilliant Blue FCF','合成色素（藍）','台灣叫「食用藍色一號」，美國叫 Blue 1（CI 42090）',{alt:['藍色一號','藍色1號']}],
    ['E','E140','葉綠素','Chlorophyll','天然色素（綠）','植物的綠色'],
    ['E','E141','銅葉綠素','Copper Chlorophyll(in)','色素（綠）','葉綠素加銅讓綠色更穩定，綠色錠劑、膠囊常見'],
    ['E','E150','焦糖色素','Caramel Color','色素（褐）','可樂、醬油、膠囊常見的褐色，依製法分 E150a～d',{alt:['E150a','E150b','E150c','E150d']}],
    ['E','E160a','β-胡蘿蔔素','Beta-carotene','色素／維生素 A 前驅物','橘黃色，在體內可以轉成維生素 A'],
    ['E','E162','甜菜紅','Beetroot Red','天然色素（紅）','甜菜根的紅色'],
    ['E','E163','花青素','Anthocyanins','天然色素（紫紅）','葡萄、紫地瓜、莓果裡的紫紅色'],
    ['E','E170','碳酸鈣','Calcium Carbonate','鈣來源／白色色素','鈣片最常見的鈣來源，含鈣量高，隨餐吃比較好吸收',{db:'鈣'}],
    ['E','E171','二氧化鈦','Titanium Dioxide','白色色素','讓錠劑、膠囊變白；歐盟 2022 年起已不准加在食品裡（化妝品的 CI 77891 是同一種）'],
    ['E','E172','氧化鐵','Iron Oxides','色素（紅、黃、黑）','膠囊、錠劑上色用，用量很少'],
    ['E','E200','己二烯酸','Sorbic Acid','防腐劑','常見的食品防腐劑'],
    ['E','E202','己二烯酸鉀','Potassium Sorbate','防腐劑','最常見的防腐劑之一，液態保健品、果醬常見，保養品也會用',{at:'sk'}],
    ['E','E210','苯甲酸','Benzoic Acid','防腐劑','常見的食品防腐劑'],
    ['E','E211','苯甲酸鈉','Sodium Benzoate','防腐劑','飲料、液態保健品常見，保養品也會用',{at:'sk'}],
    ['E','E220','二氧化硫（亞硫酸鹽）','Sulfur Dioxide / Sulfites','防腐劑／漂白','果乾、葡萄酒常見',{w:'對亞硫酸鹽敏感或有氣喘的人要留意'}],
    ['E','E270','乳酸','Lactic Acid','酸味劑','發酵產生的酸；在保養品裡屬於果酸',{at:'sk',pk:'乳酸'}],
    ['E','E296','蘋果酸','Malic Acid','酸味劑','帶酸味的果酸'],
    ['E','E300','維生素 C（抗壞血酸）','Ascorbic Acid','抗氧化劑／營養素','加在食品裡防止氧化變色，本身就是維生素 C',{pk:'維生素C'}],
    ['E','E301','抗壞血酸鈉','Sodium Ascorbate','抗氧化劑／維生素 C','維生素 C 的鈉鹽，比較不酸、不傷胃'],
    ['E','E304','抗壞血酸棕櫚酸酯','Ascorbyl Palmitate','抗氧化劑','油溶性的維生素 C，用來保護油脂不變質'],
    ['E','E306','生育醇（維生素 E）','Tocopherols','抗氧化劑','魚油、植物油常加，防止油脂氧化',{at:'sk',pk:'維生素E',alt:['E307','E308','E309']}],
    ['E','E320','丁基羥基甲氧苯（食品的 BHA）','Butylated Hydroxyanisole','抗氧化劑','食品標示的 BHA 是這個抗氧化劑，跟保養品說的 BHA（水楊酸）完全不同',{alt:['BHA']}],
    ['E','E321','二丁基羥基甲苯（BHT）','Butylated Hydroxytoluene','抗氧化劑','常見的油脂抗氧化劑，保養品也會用',{at:'sk',alt:['BHT']}],
    ['E','E322','卵磷脂','Lecithin','乳化劑','讓油和水混在一起，多從大豆或葵花取得',{w:'大豆卵磷脂：對大豆過敏的人看一下來源'}],
    ['E','E327','乳酸鈣','Calcium Lactate','鈣來源','溫和的鈣來源',{db:'鈣'}],
    ['E','E330','檸檬酸','Citric Acid','酸味劑／酸鹼調整','最常見的酸味劑；保養品裡用來調整酸鹼值',{at:'sk'}],
    ['E','E331','檸檬酸鈉','Sodium Citrate','酸度調整劑','調整酸鹼、讓味道比較柔和',{at:'sk'}],
    ['E','E333','檸檬酸鈣','Calcium Citrate','鈣來源','不用隨餐也好吸收，胃酸少的人比較適合',{db:'鈣'}],
    ['E','E341','磷酸鈣','Calcium Phosphates','鈣來源／賦形劑','錠劑的填充料，也提供鈣'],
    ['E','E407','鹿角菜膠','Carrageenan','增稠劑','海藻來源，讓液體變稠、做植物軟膠囊'],
    ['E','E412','關華豆膠','Guar Gum','增稠劑／膳食纖維','豆類來源的增稠劑'],
    ['E','E414','阿拉伯膠','Gum Arabic','增稠劑／乳化劑','樹膠，讓粉末、糖衣成形'],
    ['E','E415','三仙膠','Xanthan Gum','增稠劑','食品和保養品都很常見，讓質地變濃稠',{at:'sk',pk:'三仙膠'}],
    ['E','E420','山梨醇','Sorbitol','甜味劑／保濕劑','低熱量甜味，喉糖、咀嚼錠常見',{at:'sk',w:'一次吃多可能腹瀉、脹氣'}],
    ['E','E421','甘露醇','Mannitol','甜味劑','咀嚼錠、喉糖常見',{w:'一次吃多可能腹瀉'}],
    ['E','E422','甘油','Glycerol / Glycerin','保濕劑／甜味','液態保健品、軟糖常用；保養品最常見的保濕成分',{at:'sk',db:'甘油',pk:'甘油'}],
    ['E','E440','果膠','Pectin','膠凝劑','水果來源，軟糖、果凍常見'],
    ['E','E460','纖維素（微晶纖維素）','Cellulose / Microcrystalline Cellulose','賦形劑','把錠劑撐起來的填充料，不會被吸收',{alt:['MCC']}],
    ['E','E464','羥丙基甲基纖維素（HPMC）','Hydroxypropyl Methylcellulose','膠囊殼／膜衣','「植物膠囊」的材料，素食者可吃',{alt:['HPMC']}],
    ['E','E466','羧甲基纖維素鈉（CMC）','Carboxymethyl Cellulose','增稠劑','讓液體變稠',{at:'sk',alt:['CMC']}],
    ['E','E470b','硬脂酸鎂','Magnesium Stearate','潤滑劑（賦形劑）','讓粉末不黏機器，錠劑、膠囊幾乎都有，用量很少',{alt:['E470']}],
    ['E','E471','脂肪酸甘油酯','Mono- and Diglycerides','乳化劑','讓油水混合、口感滑順'],
    ['E','E551','二氧化矽','Silicon Dioxide / Silica','抗結塊劑','讓粉末不結塊；彩妝也常見',{at:'sc',db:'二氧化矽'}],
    ['E','E553b','滑石粉','Talc','抗結塊劑','粉末流動劑；彩妝也常見',{at:'sc',db:'滑石粉',alt:['E553']}],
    ['E','E570','硬脂酸','Stearic Acid','潤滑劑','錠劑的潤滑料；保養品裡是乳化、增稠成分',{at:'sk'}],
    ['E','E621','麩胺酸鈉（味精）','Monosodium Glutamate','調味劑','鮮味來源',{alt:['MSG']}],
    ['E','E901','蜂蠟','Beeswax','膜衣／光澤','錠劑、軟糖表面光澤；護唇膏也常見',{at:'sc',pk:'蜂蠟'}],
    ['E','E903','棕櫚蠟','Carnauba Wax','膜衣／光澤','讓錠劑表面光滑好吞；唇膏也常見',{at:'sc'}],
    ['E','E904','蟲膠','Shellac','膜衣','錠劑的亮光膜衣，由紫膠蟲分泌物製成，嚴格素食者會避開'],
    ['E','E950','醋磺內酯鉀','Acesulfame K','代糖','零熱量甜味劑，常和其他代糖混用',{alt:['ACEK']}],
    ['E','E951','阿斯巴甜','Aspartame','代糖','零熱量甜味劑',{w:'苯酮尿症患者不能吃'}],
    ['E','E955','蔗糖素','Sucralose','代糖','零熱量甜味劑，耐高溫'],
    ['E','E960','甜菊糖苷','Steviol Glycosides','代糖（植物來源）','甜菊葉萃取，零熱量'],
    ['E','E965','麥芽糖醇','Maltitol','代糖','低熱量甜味，無糖糖果常見',{w:'一次吃多可能腹瀉'}],
    ['E','E967','木糖醇','Xylitol','代糖','喉糖、口香糖常見',{w:'對狗有劇毒，別讓狗吃到；一次吃多可能腹瀉'}],
    ['E','E968','赤藻糖醇','Erythritol','代糖','幾乎零熱量，比較不會拉肚子'],
    ['E','E1200','聚葡萄糖','Polydextrose','膳食纖維／增量劑','可溶性纖維'],
    ['E','E1520','丙二醇','Propylene Glycol','溶劑／保濕','食品香料的溶劑；保養品常見保濕溶劑',{at:'sk',pk:'丙二醇',alt:['PG']}],

    // ---------- 化妝品色素：CI 編號（Color Index） ----------
    ['CI','CI 77891','二氧化鈦','Titanium Dioxide','白色色素／物理防曬','粉底、防曬乳的白色來源，也能擋紫外線',{at:'kc',db:'二氧化鈦',pk:'二氧化鈦',alt:['TiO2']}],
    ['CI','CI 77947','氧化鋅','Zinc Oxide','物理防曬／白色','溫和的物理防曬成分，敏感肌、嬰兒產品常用',{at:'kc',db:'氧化鋅',pk:'氧化鋅',alt:['ZnO']}],
    ['CI','CI 77491','氧化鐵紅','Iron Oxide Red','礦物色素（紅）','粉底、腮紅的紅色，刺激性低'],
    ['CI','CI 77492','氧化鐵黃','Iron Oxide Yellow','礦物色素（黃）','粉底的黃色，刺激性低'],
    ['CI','CI 77499','氧化鐵黑','Iron Oxide Black','礦物色素（黑）','粉底、眉筆的深色，刺激性低'],
    ['CI','CI 77007','群青','Ultramarines','礦物色素（藍紫）','眼影常見的藍紫色'],
    ['CI','CI 77510','亞鐵氰化鐵（普魯士藍）','Ferric Ferrocyanide','色素（藍）','眼影、眼線常見的藍色'],
    ['CI','CI 77288','氧化鉻綠','Chromium Oxide Greens','礦物色素（綠）','眼影的綠色'],
    ['CI','CI 77289','氫氧化鉻綠','Chromium Hydroxide Green','礦物色素（綠）','眼影的藍綠色'],
    ['CI','CI 77742','錳紫','Manganese Violet','礦物色素（紫）','眼影的紫色'],
    ['CI','CI 77163','氯氧化鉍','Bismuth Oxychloride','珠光粉','讓蜜粉、礦物粉有珠光感',{w:'部分人擦了會癢或冒痘'}],
    ['CI','CI 77019','雲母','Mica','珠光粉','眼影、打亮的閃亮感來源',{db:'雲母'}],
    ['CI','CI 77718','滑石','Talc','粉體','蜜粉、眼影的滑順粉體',{db:'滑石粉'}],
    ['CI','CI 77266','碳黑','Carbon Black','色素（黑）','眼線、睫毛膏的黑色'],
    ['CI','CI 77000','鋁粉','Aluminum Powder','金屬色','眼影的金屬光澤'],
    ['CI','CI 75470','胭脂蟲紅','Carmine','天然色素（紅）','唇膏、腮紅常見，從胭脂蟲萃取（食品是 E120）',{w:'少數人會過敏；素食者會避開',pk:'色素'}],
    ['CI','CI 15850','Red 6／Red 7','D&C Red No. 6 / 7','合成色素（紅）','唇膏、腮紅常見的紅色',{pk:'色素',alt:['Red6','Red7']}],
    ['CI','CI 45410','Red 27／Red 28','D&C Red No. 27 / 28','合成色素（桃紅）','唇膏常見的桃紅色',{pk:'色素',alt:['Red27','Red28']}],
    ['CI','CI 45380','Red 21／Red 22','D&C Red No. 21 / 22','合成色素（紅）','「變色唇膏」常用的色素',{pk:'色素',alt:['Red21','Red22']}],
    ['CI','CI 17200','Red 33','D&C Red No. 33','合成色素（紅）','唇膏、化妝水常見',{at:'kc',pk:'色素',alt:['Red33']}],
    ['CI','CI 73360','Red 30','D&C Red No. 30','合成色素（粉紅）','唇膏、腮紅常見',{pk:'色素',alt:['Red30']}],
    ['CI','CI 16035','Red 40（誘惑紅）','FD&C Red No. 40','合成色素（紅）','台灣食品叫「食用紅色四十號」（E129）',{at:'kc',pk:'色素',alt:['Red40']}],
    ['CI','CI 14700','Red 4','FD&C Red No. 4','合成色素（紅）','化妝水、洗髮精常見的紅色',{at:'kc',pk:'色素',alt:['Red4']}],
    ['CI','CI 19140','Yellow 5（檸檬黃）','FD&C Yellow No. 5','合成色素（黃）','台灣食品叫「食用黃色四號」（E102），號碼不一樣別搞混',{at:'kc',w:'少數人會過敏',pk:'色素',alt:['Yellow5']}],
    ['CI','CI 15985','Yellow 6（日落黃）','FD&C Yellow No. 6','合成色素（橘黃）','台灣食品叫「食用黃色五號」（E110）',{at:'kc',pk:'色素',alt:['Yellow6']}],
    ['CI','CI 47005','Yellow 10','D&C Yellow No. 10','合成色素（黃）','化妝水、沐浴乳常見的黃色',{at:'kc',pk:'色素',alt:['Yellow10']}],
    ['CI','CI 42090','Blue 1（亮藍）','FD&C Blue No. 1','合成色素（藍）','台灣食品叫「食用藍色一號」（E133）',{at:'kc',pk:'色素',alt:['Blue1']}],
    ['CI','CI 42053','Green 3','FD&C Green No. 3','合成色素（綠）','化妝水、凝膠常見的綠色',{at:'kc',pk:'色素',alt:['Green3']}],

    // ---------- 常見縮寫：保養品、化妝品 ----------
    ['AB','VC','維生素 C','Vitamin C','美白、抗氧化','保養品說的 VC，成分表上常寫成抗壞血酸或各種 VC 衍生物',{at:'ks',db:'維生素C',pk:'維生素C'}],
    ['AB','VE','維生素 E','Vitamin E / Tocopherol','抗氧化','保護皮膚和配方不被氧化',{at:'ks',pk:'維生素E'}],
    ['AB','VA','維生素 A（A 醇）','Retinol','抗老','A 醇系列，抗老效果強但容易刺激',{at:'k',db:'A醇',pk:'視黃醇',w:'剛開始用可能脫皮、泛紅；晚上用、白天防曬'}],
    ['AB','B3','菸鹼醯胺（維生素 B3）','Niacinamide','美白、控油、修護','溫和、多功能，大部分膚質都能用',{at:'k',db:'菸鹼醯胺',pk:'菸鹼醯胺',alt:['VB3']}],
    ['AB','B5','泛醇（維生素原 B5）','Panthenol','保濕、修護','溫和的修護保濕成分',{at:'k',db:'泛醇',pk:'泛醇',alt:['VB5']}],
    ['AB','HA','玻尿酸','Hyaluronic Acid','保濕','吸水力很強、清爽不油',{at:'k',db:'玻尿酸',pk:'玻尿酸'}],
    ['AB','AHA','果酸','Alpha Hydroxy Acids','去角質','甘醇酸、乳酸、杏仁酸都屬於果酸',{at:'k',db:'果酸',pk:'甘醇酸',w:'皮膚會對陽光比較敏感，白天要防曬'}],
    ['AB','BHA','水楊酸','Salicylic Acid','去角質、控油','油溶性的酸，能進到毛孔裡，適合粉刺、痘痘肌（食品標示的 BHA 是另一種東西，見 E320）',{at:'k',db:'水楊酸',pk:'水楊酸'}],
    ['AB','PHA','葡萄糖酸內酯／乳糖酸','Polyhydroxy Acids','溫和去角質','分子大、作用慢，敏感肌比較能接受的酸',{at:'k',pk:'葡萄糖酸內酯'}],
    ['AB','LHA','辛醯水楊酸','Capryloyl Salicylic Acid','溫和去角質','水楊酸的衍生物，作用比較慢、溫和',{at:'k'}],
    ['AB','NMF','天然保濕因子','Natural Moisturizing Factor','保濕','皮膚本來就有的保濕成分組合（胺基酸、PCA 鈉、乳酸鹽、尿素等）',{at:'k'}],
    ['AB','PCA-Na','吡咯烷酮羧酸鈉','Sodium PCA','保濕','天然保濕因子的一員',{at:'k',pk:'吡咯烷酮羧酸鈉',alt:['NaPCA']}],
    ['AB','TXA','傳明酸','Tranexamic Acid','美白','淡斑、抑制黑色素',{at:'k',db:'傳明酸',pk:'傳明酸'}],
    ['AB','AA2G','抗壞血酸葡糖苷','Ascorbyl Glucoside','美白','比較穩定、溫和的維生素 C 衍生物',{at:'k',pk:'抗壞血酸葡糖苷'}],
    ['AB','MAP','抗壞血酸磷酸酯鎂','Magnesium Ascorbyl Phosphate','美白、抗氧化','穩定的維生素 C 衍生物',{at:'k',pk:'抗壞血酸磷酸酯鎂'}],
    ['AB','SAP','抗壞血酸磷酸酯鈉','Sodium Ascorbyl Phosphate','美白、抗痘','穩定的維生素 C 衍生物',{at:'k',pk:'抗壞血酸磷酸酯鈉'}],
    ['AB','EGF','表皮生長因子','Epidermal Growth Factor','修護','修護訴求的胜肽成分',{at:'k',db:'EGF表皮生長因子'}],
    ['AB','CICA','積雪草','Centella Asiatica','舒緩、修護','韓系「老虎草」，舒緩泛紅',{at:'k',db:'積雪草',pk:'積雪草'}],
    ['AB','SLS','月桂醇硫酸酯鈉','Sodium Lauryl Sulfate','清潔劑','清潔力強、起泡多',{at:'k',db:'SLS/SLES',pk:'月桂醇硫酸酯鈉',w:'比較刺激，乾肌、敏感肌少用'}],
    ['AB','SLES','月桂醇聚醚硫酸酯鈉','Sodium Laureth Sulfate','清潔劑','比 SLS 溫和一點的起泡劑',{at:'k',db:'SLS/SLES'}],
    ['AB','PEG','聚乙二醇','Polyethylene Glycol','乳化劑／溶劑','後面的數字（例如 PEG-40）代表分子大小，常見的乳化成分',{at:'kc'}],
    ['AB','BG','丁二醇','Butylene Glycol','保濕','溫和的保濕溶劑',{at:'k',pk:'丁二醇'}],
    ['AB','DPG','二丙二醇','Dipropylene Glycol','保濕溶劑','常見的保濕溶劑',{at:'k',db:'二丙二醇',pk:'二丙二醇'}],
    ['AB','EDTA','乙二胺四乙酸鹽','EDTA','螯合劑','抓住水裡的金屬離子，讓配方穩定',{at:'kc',db:'EDTA'}],
    ['AB','MIT','甲基異噻唑啉酮（MIT／MCI）','Methylisothiazolinone','防腐劑','致敏性很高的防腐劑',{at:'k',pk:'甲基異噻唑啉酮',w:'出名的過敏原，敏感肌避開',alt:['MCI','MI']}],
    ['AB','TEA','三乙醇胺','Triethanolamine','酸鹼調整劑','調整配方的酸鹼值',{at:'kc'}],
    ['AB','OMC','甲氧基肉桂酸辛酯','Octinoxate / Ethylhexyl Methoxycinnamate','化學防曬（UVB）','最常見的化學防曬劑之一',{at:'k',db:'甲氧基肉桂酸辛酯',pk:'甲氧基肉桂酸乙基己酯',alt:['EHMC']}],
    ['AB','BP-3','二苯甲酮-3','Oxybenzone / Benzophenone-3','化學防曬','比較容易過敏的防曬劑',{at:'k',pk:'二苯甲酮-3',w:'敏感肌容易過敏'}],

    // ---------- 常見縮寫：保健食品 ----------
    ['AB','EPA','二十碳五烯酸','Eicosapentaenoic Acid','Omega-3 脂肪酸','魚油主要成分之一，和心血管保養有關',{at:'s',db:'魚油'}],
    ['AB','DHA','二十二碳六烯酸','Docosahexaenoic Acid','Omega-3 脂肪酸','魚油主要成分之一，和腦部、眼睛有關',{at:'s',db:'魚油'}],
    ['AB','GLA','γ-次亞麻油酸','Gamma-Linolenic Acid','Omega-6 脂肪酸','月見草油、琉璃苣油的主要成分',{at:'s'}],
    ['AB','ALA','α-硫辛酸','Alpha-Lipoic Acid','抗氧化','ALA 有兩種意思，這是抗氧化的「硫辛酸」',{at:'s'}],
    ['AB','ALA','α-次亞麻油酸','Alpha-Linolenic Acid','Omega-3 脂肪酸','ALA 有兩種意思，這是亞麻仁油、奇亞籽裡的植物 Omega-3',{at:'s'}],
    ['AB','CoQ10','輔酶 Q10','Coenzyme Q10','抗氧化、能量代謝','常見於心血管、抗老保健品；保養品也會用',{at:'sk',db:'輔酶Q10',pk:'輔酶Q10',alt:['Q10']}],
    ['AB','NAC','N-乙醯半胱胺酸','N-Acetylcysteine','抗氧化','護肝、呼吸道保養訴求常見',{at:'s'}],
    ['AB','PQQ','吡咯喹啉醌','Pyrroloquinoline Quinone','能量代謝','常跟 Q10 一起出現',{at:'s'}],
    ['AB','GABA','γ-胺基丁酸','Gamma-Aminobutyric Acid','放鬆','放鬆、助眠訴求常見',{at:'s'}],
    ['AB','MSM','甲基硫醯基甲烷','Methylsulfonylmethane','關節保養','常和葡萄糖胺、軟骨素一起出現',{at:'s'}],
    ['AB','EGCG','綠茶兒茶素','Epigallocatechin Gallate','抗氧化','綠茶的主要兒茶素',{at:'sk',pk:'綠茶萃取',w:'高劑量綠茶萃取空腹吃可能傷肝，照建議量吃'}],
    ['AB','MCT','中鏈三酸甘油酯','Medium-Chain Triglycerides','能量來源','比一般油更快轉成能量，生酮、防彈咖啡常見；保養品裡是清爽的油',{at:'sk',pk:'辛酸/癸酸三酸甘油酯'}],
    ['AB','NMN','菸鹼醯胺單核苷酸','Nicotinamide Mononucleotide','抗老訴求','NAD+ 的前驅物',{at:'s',db:'NAD+前驅物'}],
    ['AB','NR','菸鹼醯胺核糖','Nicotinamide Riboside','抗老訴求','NAD+ 的前驅物',{at:'s',db:'NAD+前驅物'}],
    ['AB','BCAA','支鏈胺基酸','Branched-Chain Amino Acids','運動補充','白胺酸、異白胺酸、纈胺酸三種',{at:'s',db:'支鏈胺基酸'}],
    ['AB','HMB','β-羥基-β-甲基丁酸','Beta-Hydroxy-Beta-Methylbutyrate','肌肉保養','銀髮族、健身補充常見',{at:'s'}],
    ['AB','CLA','共軛亞麻油酸','Conjugated Linoleic Acid','體態管理訴求','常見於體態管理保健品',{at:'s'}],
    ['AB','5-HTP','5-羥基色胺酸','5-Hydroxytryptophan','情緒、睡眠訴求','血清素的前驅物',{at:'s',w:'正在吃抗憂鬱藥的人不要自己加吃，先問醫師'}],
    ['AB','D3','維生素 D3','Vitamin D3 / Cholecalciferol','骨骼、免疫','幫助鈣吸收，室內工作者容易缺',{at:'s',db:'維生素D',alt:['VD','VD3','VitD']}],
    ['AB','K2','維生素 K2（MK-7）','Vitamin K2 / Menaquinone-7','骨骼保養','幫忙把鈣送到骨頭，常和 D3、鈣一起出現',{at:'s',alt:['MK7','MK-7','VK2'],w:'吃抗凝血藥（如 warfarin）的人要先問醫師'}],
    ['AB','B1','維生素 B1（硫胺素）','Thiamine','能量代謝','醣類代謝需要它',{at:'s',db:'B群'}],
    ['AB','B2','維生素 B2（核黃素）','Riboflavin','能量代謝','吃了尿液變很黃是正常的',{at:'s',db:'B群'}],
    ['AB','B6','維生素 B6','Pyridoxine','能量代謝','蛋白質代謝需要它',{at:'s',db:'B群'}],
    ['AB','B7','生物素（維生素 B7）','Biotin','頭髮、指甲訴求','頭髮、指甲保健品常見',{at:'s',db:'B群',w:'會干擾部分抽血檢驗（例如甲狀腺），抽血前先告訴醫師'}],
    ['AB','B9','葉酸（維生素 B9）','Folic Acid / Folate','造血','備孕、懷孕初期特別重要',{at:'s',db:'B群',alt:['FA']}],
    ['AB','B12','維生素 B12（鈷胺素）','Cobalamin','造血、神經','素食者容易缺乏',{at:'s',db:'B群',alt:['VB12']}],
    ['AB','FOS','果寡糖','Fructooligosaccharides','益生元','益生菌的食物',{at:'s',db:'益生菌'}],
    ['AB','GOS','半乳寡糖','Galactooligosaccharides','益生元','益生菌的食物',{at:'s',db:'益生菌'}],
    ['AB','UC-II','非變性第二型膠原蛋白','Undenatured Type II Collagen','關節保養','一天約 40 mg，跟美容用的膠原蛋白是不同東西',{at:'s',alt:['UC2']}],

    // ---------- 研究／業界常用簡稱：保養品 ----------
    ['AB','NAM','菸鹼醯胺','Niacinamide / Nicotinamide','美白、控油、修護','研究論文常寫 NAM',{at:'k',db:'菸鹼醯胺',pk:'菸鹼醯胺'}],
    ['AB','SA','水楊酸','Salicylic Acid','去角質、控油','研究常寫 SA，就是 BHA',{at:'k',db:'水楊酸',pk:'水楊酸'}],
    ['AB','GA','甘醇酸','Glycolic Acid','去角質','分子最小、作用最強的果酸',{at:'k',db:'果酸',pk:'甘醇酸',w:'容易刺痛，白天要防曬'}],
    ['AB','LA','乳酸','Lactic Acid','去角質、保濕','比甘醇酸溫和、還有保濕效果的果酸（營養學的 LA 是亞麻油酸）',{at:'k',db:'果酸',pk:'乳酸'}],
    ['AB','LA','亞麻油酸','Linoleic Acid','Omega-6 脂肪酸','營養學的 LA，植物油裡最多的必需脂肪酸',{at:'s'}],
    ['AB','MA','杏仁酸','Mandelic Acid','溫和去角質','分子大、滲透慢，敏感肌比較能用的果酸',{at:'k',pk:'杏仁酸'}],
    ['AB','AzA','壬二酸（杜鵑花酸）','Azelaic Acid','抗痘、淡斑、退紅','研究常寫 AzA，粉刺、酒糟都有研究',{at:'k',db:'杜鵑花酸',pk:'壬二酸'}],
    ['AB','KA','麴酸','Kojic Acid','美白','研究常寫 KA',{at:'k',db:'麴酸',pk:'麴酸'}],
    ['AB','LAA','左旋 C（純維生素 C）','L-Ascorbic Acid','美白、抗氧化','效果最直接、也最不穩定的維生素 C',{at:'k',db:'維生素C',pk:'維生素C',alt:['AA']}],
    ['AB','VC-IP','抗壞血酸四異棕櫚酸酯（油溶 VC）','Ascorbyl Tetraisopalmitate','美白、抗氧化','油溶性維生素 C，穩定、溫和',{at:'k',pk:'抗壞血酸四異棕櫚酸酯',alt:['ATIP','THDA']}],
    ['AB','FA','阿魏酸','Ferulic Acid','抗氧化','常和維生素 C、E 一起用，讓 VC 更穩定（保健品的 FA 常指葉酸）',{at:'k'}],
    ['AB','ROL','視黃醇（A 醇）','Retinol','抗老','A 醇的研究簡稱',{at:'k',db:'A醇',pk:'視黃醇'}],
    ['AB','RAL','視黃醛','Retinal / Retinaldehyde','抗老','比 A 醇再強一級的 A 醇家族成分',{at:'k',w:'和 A 醇一樣會脫皮泛紅，晚上用、白天防曬'}],
    ['AB','RP','視黃醇棕櫚酸酯（A 酯）','Retinyl Palmitate','抗老（溫和）','A 醇家族裡最溫和的',{at:'k',db:'A酯',pk:'視黃醇棕櫚酸酯'}],
    ['AB','HPR','羥基頻哪酮視黃酸酯','Hydroxypinacolone Retinoate','抗老','比較不刺激的新型 A 醇衍生物',{at:'k',pk:'羥基頻哪酮視黃酸酯'}],
    ['AB','SH','透明質酸鈉（玻尿酸鈉）','Sodium Hyaluronate','保濕','成分表上的玻尿酸大多寫成這個',{at:'k',db:'玻尿酸',pk:'玻尿酸'}],
    ['AB','CER','神經醯胺','Ceramide','修護、保濕','皮膚屏障的主要成分，常見 Ceramide NP、AP、EOP',{at:'k',db:'神經醯胺',pk:'神經醯胺',alt:['CERNP','CERAP','CEREOP']}],
    ['AB','GHK-Cu','藍銅胜肽','Copper Tripeptide-1','修護、抗老','研究最多的胜肽之一，偏藍色',{at:'k',db:'勝肽',pk:'胜肽'}],
    ['AB','CCT','辛酸／癸酸三酸甘油酯','Caprylic/Capric Triglyceride','潤膚油','清爽、不悶的基礎油',{at:'k',pk:'辛酸/癸酸三酸甘油酯'}],
    ['AB','IPM','肉豆蔻酸異丙酯','Isopropyl Myristate','潤膚劑','讓質地滑順好推',{at:'k',pk:'肉豆蔻酸異丙酯'}],
    ['AB','IPP','棕櫚酸異丙酯','Isopropyl Palmitate','潤膚劑','讓質地滑順好推',{at:'k',pk:'棕櫚酸異丙酯'}],
    ['AB','Zn-PCA','吡咯烷酮羧酸鋅','Zinc PCA','控油','控油、抗痘的鋅鹽',{at:'k',pk:'吡咯烷酮羧酸鋅',alt:['ZnPCA']}],

    // ---------- 研究／業界常用簡稱：保健食品 ----------
    ['AB','VB','維生素 B 群','Vitamin B Complex','能量代謝','B1、B2、B6、B12 等一起補',{at:'s',db:'B群',alt:['BComplex']}],
    ['AB','Mg','鎂','Magnesium','肌肉、神經、睡眠','元素符號，常見甘胺酸鎂、檸檬酸鎂、氧化鎂',{at:'s',db:'鎂'}],
    ['AB','Zn','鋅','Zinc','免疫、皮膚','元素符號',{at:'s',db:'鋅'}],
    ['AB','Fe','鐵','Iron','造血','元素符號',{at:'s',db:'鐵'}],
    ['AB','Ca','鈣','Calcium','骨骼','元素符號',{at:'s',db:'鈣'}],
    ['AB','ASX','蝦紅素','Astaxanthin','抗氧化','研究常寫 ASX 或 AST',{at:'s',db:'蝦紅素',alt:['AST']}],
    ['AB','RSV','白藜蘆醇','Resveratrol','抗氧化','研究常寫 RSV 或 RES',{at:'s',db:'白藜蘆醇',alt:['RES']}],
    ['AB','CUR','薑黃素','Curcumin','抗發炎','研究常寫 CUR；吸收差，常搭配黑胡椒萃取',{at:'s',db:'薑黃'}],
    ['AB','LUT','葉黃素','Lutein','護眼','研究常寫 LUT',{at:'s',db:'葉黃素'}],
    ['AB','ZEA','玉米黃素','Zeaxanthin','護眼','常和葉黃素一起出現',{at:'s',db:'葉黃素'}],
    ['AB','MI','肌醇（Myo-肌醇）','Myo-Inositol','代謝、女性保養','研究常寫 MI（化妝品的 MI 是防腐劑甲基異噻唑啉酮）',{at:'s',db:'肌醇',alt:['MYO']}],
    ['AB','DCI','D-手性肌醇','D-Chiro-Inositol','代謝','常和 Myo-肌醇搭配（常見比例 40:1）',{at:'s',db:'肌醇'}],
    ['AB','CrM','一水肌酸','Creatine Monohydrate','運動表現','研究最多、最便宜的肌酸型態',{at:'s',db:'肌酸'}],
    ['AB','HC','水解膠原蛋白','Hydrolyzed Collagen','皮膚保水','切小分子的膠原蛋白胜肽',{at:'s',db:'膠原蛋白',alt:['HCP']}],
    ['AB','rTG','再酯化型魚油','Re-esterified Triglyceride','魚油型態','把濃縮後的魚油轉回天然型態，濃度高、吸收好',{at:'s',db:'魚油'}],
    ['AB','TG','三酸甘油酯型魚油','Triglyceride','魚油型態','天然型態的魚油，濃度通常較低',{at:'s',db:'魚油'}],
    ['AB','EE','乙酯型魚油','Ethyl Ester','魚油型態','價格較低，空腹吃吸收較差，建議隨餐吃',{at:'s',db:'魚油'}],
    ['AB','LGG','鼠李糖乳酸桿菌 GG 株','Lactobacillus rhamnosus GG','益生菌菌株','研究最多的益生菌菌株之一',{at:'s',db:'益生菌'}],
    ['AB','BB-12','動物雙歧桿菌 BB-12','Bifidobacterium animalis BB-12','益生菌菌株','研究很多的比菲德氏菌株',{at:'s',db:'益生菌'}],
    ['AB','NAD+','菸鹼醯胺腺嘌呤二核苷酸','Nicotinamide Adenine Dinucleotide','能量代謝','NMN、NR 補的就是它的原料',{at:'s',db:'NAD+前驅物',alt:['NAD']}],
    ['AB','ORS','口服電解質液','Oral Rehydration Solution','補水、補電解質','腹瀉、大量流汗後補充',{at:'s',db:'電解質'}],
    ['AB','MVM','綜合維生素礦物質','Multivitamin-Mineral','基礎營養','研究上綜合維他命的簡稱',{at:'s',db:'綜合維生素',alt:['MVI']}],
    ['AB','GlcN','葡萄糖胺','Glucosamine','關節保養','常和軟骨素、MSM 一起出現',{at:'s'}],
    ['AB','CS','軟骨素','Chondroitin Sulfate','關節保養','常和葡萄糖胺一起出現',{at:'s'}],
    ['AB','PS','磷脂絲胺酸','Phosphatidylserine','腦部保養','記憶、專注訴求常見',{at:'s'}],
    ['AB','ALCAR','乙醯左旋肉鹼','Acetyl-L-Carnitine','能量代謝','研究常寫 ALCAR 或 ALC',{at:'s',alt:['ALC']}],
    ['AB','5-MTHF','活性葉酸','5-Methyltetrahydrofolate','造血','不用轉換就能用的葉酸型態',{at:'s',db:'B群'}],

    // ---------- 標示與單位 ----------
    ['U','CFU','菌落形成單位','Colony Forming Units','益生菌菌數','「100 億 CFU」就是 100 億隻活菌（通常是出廠時的數量）',{at:'s',db:'益生菌'}],
    ['U','IU','國際單位','International Unit','維生素含量單位','維生素 D、A、E 常用；維生素 D3：1 微克 = 40 IU',{at:'s'}],
    ['U','RE','視黃醇當量','Retinol Equivalent','維生素 A 單位','維生素 A 含量的單位（μg RE）',{at:'s'}],
    ['U','α-TE','生育醇當量','Alpha-Tocopherol Equivalent','維生素 E 單位','維生素 E 含量的單位（mg α-TE）',{at:'s',alt:['aTE','alphaTE']}],
    ['U','%DV','每日參考值百分比','Daily Value','營養標示','這一份占一天建議攝取量的幾 %',{at:'s',alt:['DV']}],
    ['U','SPF','防曬係數（UVB）','Sun Protection Factor','防曬標示','防曬傷（UVB）的能力；日常通勤 SPF30 左右，戶外長時間選 SPF50',{at:'kc'}],
    ['U','PA','UVA 防護等級','Protection Grade of UVA','防曬標示','PA+ 到 PA++++，加號越多越能防曬黑、防老化',{at:'kc',alt:['PA+','PA++','PA+++','PA++++']}]
  ];

  var CODES = RAW.map(function(r){
    var o = r[6] || {};
    return { t:r[0], c:r[1], zh:r[2], en:r[3], use:r[4], n:r[5], w:o.w || '', db:o.db || '', pk:o.pk || '',
             alt:o.alt || [], at:o.at || (r[0] === 'CI' ? 'c' : 's') };
  });

  /* ---------- 比對 ---------- */
  function toHalf(s){ return String(s).replace(/[！-～]/g, function(ch){ return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); }).replace(/　/g, ' '); }
  function key(s){
    var k = toHalf(s).toUpperCase().replace(/[\s.\-_·・．()（）]/g, '');
    k = k.replace(/(ALUMINUM|ALUMINIUM|AL)?LAKE$/, '') || k;          // Red 7 Lake → RED7
    k = k.replace(/^FD&C|^D&C|^EXTD&C/, '').replace(/NO(?=\d)/, '');   // FD&C Red No. 40 → RED40
    var m;
    if((m = k.match(/^INS(\d{3,4}[A-Z]?)$/))){ k = 'E' + m[1]; }
    else if((m = k.match(/^C?I?(\d{5})$/)) && /^(CI|\d)/.test(k)){ k = 'CI' + m[1]; }  // CI77891、77891
    else if(/^\d{3,4}[A-Z]?$/.test(k)){ k = 'E' + k; }                     // 330 → E330
    return k;
  }
  var INDEX = {};
  function add(k, entry, rank){ if(!k){ return; } (INDEX[k] = INDEX[k] || []).push({ e:entry, r:rank }); }
  CODES.forEach(function(e){ add(key(e.c), e, 0); e.alt.forEach(function(a){ add(key(a), e, 1); }); });

  function lookupCode(q){
    var k = key(q || '');
    if(!k || k.length < 2){ return []; }
    var hits = INDEX[k];
    if(!hits && /^E\d+$/.test(k)){
      // E470 → E470b、E160 → E160a
      hits = [];
      CODES.forEach(function(e){ var ek = key(e.c); if(ek.length === k.length + 1 && ek.indexOf(k) === 0){ hits.push({ e:e, r:1 }); } });
    }
    if(!hits || !hits.length){ return []; }
    return hits.slice().sort(function(a, b){ return a.r - b.r; }).map(function(h){ return h.e; })
      .filter(function(e, i, arr){ return arr.indexOf(e) === i; });
  }

  /* ---------- 畫面 ---------- */
  function mk(tag, cls, text){ var x = document.createElement(tag); if(cls){ x.className = cls; } if(text != null){ x.textContent = text; } return x; }
  function whereText(e){ return e.at.split('').map(function(c){ return WHERE[c]; }).filter(Boolean).join('、'); }

  function codeDetail(e, opts){
    var box = mk('div', 'code-detail');
    if(opts && opts.full){
      box.appendChild(mk('div', 'code-detail-use', '用途：' + e.use));
      box.appendChild(mk('p', 'code-detail-note', e.n));
    }
    if(!(opts && opts.noEn)){ box.appendChild(mk('div', 'code-detail-en mono', e.en)); }
    if(e.w){ box.appendChild(mk('p', 'code-warn', '⚠️ ' + e.w)); }
    box.appendChild(mk('div', 'code-detail-where', '常見於：' + whereText(e)));
    return box;
  }

  /* 依成分查詢：代號卡 */
  function renderCodeCards(container, hits, dbKey){
    container.textContent = '';
    if(hits.length > 1){ container.appendChild(mk('p', 'code-multi', '這個代號有 ' + hits.length + ' 種意思，要看它出現在哪種產品上：')); }
    hits.forEach(function(e){
      var card = mk('div', 'code-card');
      var top = mk('div', 'code-card-top');
      top.appendChild(mk('span', 'code-badge mono', e.c));
      top.appendChild(mk('span', 'code-type', TYPE[e.t].icon + ' ' + TYPE[e.t].label));
      card.appendChild(top);
      card.appendChild(mk('div', 'code-card-name', e.zh));
      card.appendChild(codeDetail(e, { full:true }));
      container.appendChild(card);
    });
    container.appendChild(mk('p', 'code-foot', dbKey ? '下面接著是「' + dbKey + '」的完整資料 ↓' : '這個成分目前沒有更詳細的資料，可以到「成分對照表」→「代號對照」看其他代號。'));
  }

  /* 成分對照表 → 代號對照 */
  var state = { t:'all', q:'' };
  function renderCodeTable(){
    var list = document.getElementById('code-table-results');
    if(!list){ return; }
    var q = state.q.trim().toLowerCase();
    var qk = q ? key(q) : '';
    var rows = CODES.filter(function(e){
      if(state.t !== 'all' && e.t !== state.t){ return false; }
      if(!q){ return true; }
      var hay = (e.c + ' ' + e.zh + ' ' + e.en + ' ' + e.use + ' ' + e.alt.join(' ')).toLowerCase();
      if(hay.indexOf(q) !== -1){ return true; }
      return key(e.c).indexOf(qk) !== -1 || e.alt.some(function(a){ return key(a).indexOf(qk) !== -1; });
    });
    if(qk){
      // 代號完全相同的排最前面，其次是代號開頭相同的
      var rank = function(e){
        var ks = [key(e.c)].concat(e.alt.map(key));
        if(ks.indexOf(qk) !== -1){ return 0; }
        if(ks.some(function(k){ return k.indexOf(qk) === 0; })){ return 1; }
        return 2;
      };
      rows = rows.map(function(e, i){ return { e:e, r:rank(e), i:i }; })
        .sort(function(a, b){ return a.r - b.r || a.i - b.i; }).map(function(x){ return x.e; });
    }
    list.textContent = '';
    var count = document.getElementById('code-table-count');
    if(count){ count.textContent = '共 ' + rows.length + ' 個'; }
    if(!rows.length){ list.appendChild(mk('p', 'empty-state', '查無符合的代號。可以試試 E330、CI 77891、VC 這種寫法。')); return; }
    rows.forEach(function(e){
      var row = mk('div', 'code-row');
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.appendChild(mk('div', 'code-row-code mono', e.c));
      var nm = mk('div', 'code-row-name', e.zh);
      nm.appendChild(mk('span', 'code-row-en', e.en));   // 名稱後面加英文
      row.appendChild(nm);
      row.appendChild(mk('div', 'code-row-use', e.use));
      row.appendChild(mk('div', 'code-row-note', e.n));
      function toggle(){
        var open = row.classList.contains('open');
        list.querySelectorAll('.code-row.open').forEach(function(r){ r.classList.remove('open'); var d = r.querySelector('.code-row-more'); if(d){ d.remove(); } });
        if(open){ return; }
        row.classList.add('open');
        var more = mk('div', 'code-row-more');
        more.appendChild(codeDetail(e, { noEn:true }));
        if(e.db && typeof window.__ingQuery === 'function'){
          var b = mk('button', 'btn-link', '看「' + e.db + '」完整資料 →');
          b.type = 'button';
          b.addEventListener('click', function(ev){ ev.stopPropagation(); window.__ingQuery(e.c); });
          more.appendChild(b);
        }
        row.appendChild(more);
      }
      row.addEventListener('click', function(ev){ if(ev.target.closest('.code-row-more')){ return; } toggle(); });
      row.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); toggle(); } });
      list.appendChild(row);
    });
  }

  function initTable(){
    var filter = document.getElementById('code-type-filter');
    if(!filter){ return; }
    filter.querySelectorAll('.filter-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        filter.querySelectorAll('.filter-chip').forEach(function(c){ c.classList.toggle('active', c === chip); });
        state.t = chip.dataset.ctype;
        renderCodeTable();
      });
    });
    document.getElementById('code-table-search').addEventListener('input', function(){ state.q = this.value; renderCodeTable(); });
    // 「成分／代號」切換
    document.querySelectorAll('.table-view-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('.table-view-btn').forEach(function(b){ var on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        document.getElementById('table-ing-view').hidden = btn.dataset.view !== 'ing';
        document.getElementById('table-code-view').hidden = btn.dataset.view !== 'code';
      });
    });
    renderCodeTable();
  }

  window.INGREDIENT_CODES = CODES;
  window.lookupCode = lookupCode;
  window.renderCodeCards = renderCodeCards;
  window.__codes = { key:key, lookup:lookupCode, list:CODES, TYPE:TYPE };

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', initTable); } else { initTable(); }
})();
