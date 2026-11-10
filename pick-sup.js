/* ============================================================
   保健食品店內挑選（2026-11-09）：選「保健食品」分類時，店內挑選改成這一版。
   依「你想補什麼＋你的狀況（懷孕、吃抗凝血藥…）＋成分與劑量」判斷適不適合，最多比較 3 罐。
   台灣食品標示：內容物依含量由多到少排列，所以越前面份量越多。
   劑量上限參考衛福部「國人膳食營養素參考攝取量」第八版的成人上限攝取量（UL）。
   純前端、不呼叫 API。
   ============================================================ */
(function(){
  'use strict';

  var GOALS = ['護眼','心血管','骨骼關節','免疫','腸胃','精神體力','睡眠放鬆','美容','女性保養','運動'];
  var FLAGS = [
    ['preg','懷孕或備孕中'],
    ['anticoag','吃抗凝血藥（含阿斯匹靈）'],
    ['meds','長期吃慢性病藥（血壓、血脂、血糖等）'],
    ['kidney','腎功能不好或有腎結石'],
    ['veg','吃素'],
    ['seafood','對海鮮過敏'],
    ['soy','對大豆過敏'],
    ['stomach','腸胃容易不舒服']
  ];
  var FLAG_TEXT = {}; FLAGS.forEach(function(f){ FLAG_TEXT[f[0]] = f[1]; });
  var TYPES = ['膠囊／錠劑','軟膠囊','粉包／沖泡','軟糖／咀嚼錠','飲品／雞精','液劑／滴劑'];

  /* ---------- 成分知識 ----------
     g：對應的需求；n：一句白話說明；w：{狀況: 原因}，all＝每個人都要注意
     good：{狀況: 原因} 對這個狀況特別加分；kind：ex＝賦形劑／添加物（不算主成分）
     dose：{u 單位, low 偏低, ul 上限, lowMsg, ulMsg}；u 可為 mg、ug、IU、yi（億） */
  var ING = [
    // Omega-3
    {k:'魚油', a:['魚油','深海魚油','fishoil','omega-3','omega3','omega 3','rtg','tg型','ee型','乙酯型','三酸甘油酯型'], g:['心血管','護眼'], n:'Omega-3 來源；要看 EPA＋DHA 合計含量，不是看魚油總量', w:{anticoag:'高劑量魚油可能增加出血風險，先問醫師', seafood:'魚類來源，對魚過敏要避開', veg:'動物來源，吃素可改藻油'}},
    {k:'EPA', a:['epa','二十碳五烯酸'], g:['心血管'], n:'Omega-3 的一種，和心血管保養比較有關', w:{anticoag:'高劑量 Omega-3 可能增加出血風險', seafood:'多半來自魚油'}},
    {k:'DHA', a:['dha','二十二碳六烯酸'], g:['護眼','心血管'], n:'Omega-3 的一種，和眼睛、腦部比較有關', w:{anticoag:'高劑量 Omega-3 可能增加出血風險', seafood:'多半來自魚油，藻油來源的不用擔心'}},
    {k:'藻油', a:['藻油','algaeoil','algaloil','微藻油'], g:['護眼','心血管'], n:'植物來源的 DHA，吃素、對魚過敏都可以', good:{veg:'素食可以吃', seafood:'不是魚類來源'}},
    {k:'亞麻仁油', a:['亞麻仁油','亞麻仁籽','亞麻籽','flaxseed','linseed','α-亞麻酸','亞麻酸'], g:['心血管'], n:'植物 Omega-3（ALA），在體內轉成 EPA、DHA 的比例很低', good:{veg:'素食可以吃'}},
    // 護眼
    {k:'葉黃素', a:['葉黃素','游離型葉黃素','酯化葉黃素','lutein','金盞花萃取','金盞花萃取物','金盞花'], g:['護眼'], n:'黃斑部的色素；脂溶性，隨餐（有油脂）吃吸收較好', dose:{u:'mg', low:6, lowMsg:'研究常用每天 10 mg 左右'}},
    {k:'玉米黃素', a:['玉米黃素','zeaxanthin'], g:['護眼'], n:'常和葉黃素一起出現，兩個一起補比較完整'},
    {k:'蝦紅素', a:['蝦紅素','藻紅素','astaxanthin','雨生紅球藻'], g:['護眼','美容'], n:'很強的抗氧化成分，多從藻類萃取；脂溶性，隨餐吃'},
    {k:'山桑子', a:['山桑子','歐洲藍莓','bilberry','藍莓萃取','花青素','anthocyanin'], g:['護眼'], n:'含花青素，眼睛保養常見', w:{anticoag:'可能影響凝血，先問醫師'}},
    // 維生素
    {k:'維生素A', a:['維生素a','維他命a','vitamina','視黃醇','retinol','視黃醇醋酸酯','視黃醇棕櫚酸酯'], g:['護眼','免疫'], n:'脂溶性，吃多會累積', w:{preg:'懷孕時過量維生素 A 可能影響胎兒，要先問醫師'}, dose:{u:'ug', ul:3000, ulMsg:'超過成人每日上限 3000 μg RE（約 10000 IU）'}},
    {k:'β-胡蘿蔔素', a:['β-胡蘿蔔素','胡蘿蔔素','betacarotene','beta-carotene'], g:['護眼'], n:'在體內需要時才轉成維生素 A，比直接吃 A 安全', good:{preg:'比直接補維生素 A 安全'}},
    {k:'維生素C', a:['維生素c','維他命c','vitaminc','抗壞血酸','l-抗壞血酸','抗壞血酸鈉','抗壞血酸鈣','ascorbicacid','酯化c'], g:['免疫','美容'], n:'水溶性；幫助鐵吸收、膠原蛋白生成', w:{kidney:'腎功能不好、有腎結石的人不要吃高劑量'}, dose:{u:'mg', ul:2000, ulMsg:'超過成人每日上限 2000 mg，可能拉肚子'}},
    {k:'維生素D', a:['維生素d','維他命d','維生素d3','維生素d2','vitamind','vitamind3','膽鈣化醇','cholecalciferol','d3'], g:['骨骼關節','免疫'], n:'幫助鈣吸收；室內工作、少曬太陽的人容易缺', dose:{u:'IU', low:400, ul:2000, lowMsg:'劑量偏低，一般成人建議每天 400 IU（10 μg）以上', ulMsg:'超過台灣成人每日上限 2000 IU（50 μg），長期吃要問醫師'}},
    {k:'維生素E', a:['維生素e','維他命e','vitamine','生育醇','tocopherol','d-α-生育醇','混合生育醇'], g:['美容'], n:'脂溶性抗氧化劑，常加在魚油裡防止氧化（用量很少）', w:{anticoag:'高劑量（每天 400 mg 以上）可能增加出血風險'}, onlyHigh:{anticoag:400}, dose:{u:'mg', ul:1000, ulMsg:'超過成人每日上限 1000 mg α-TE'}},
    {k:'維生素K2', a:['維生素k2','維他命k2','vitamink2','k2','mk-7','mk7','menaquinone','維生素k'], g:['骨骼關節'], n:'幫忙把鈣送到骨頭，常和 D3、鈣一起', w:{anticoag:'會影響 warfarin 等抗凝血藥效果，一定要先問醫師'}},
    {k:'B群', a:['b群','維生素b群','維他命b群','菸鹼醯胺','niacinamide','nicotinamide','bcomplex','b complex','維生素b1','b1','硫胺素','thiamine','fursultiamine','蒜硫胺素','維生素b2','b2','核黃素','riboflavin','維生素b6','b6','吡哆醇','pyridoxine','維生素b12','b12','氰鈷胺','甲鈷胺','鈷胺素','泛酸','泛酸鈣','維生素b5','膽素','膽鹼','維生素b'], g:['精神體力'], n:'參與能量代謝；水溶性，多的會排出，吃完尿變黃是 B2 的顏色'},
    {k:'葉酸', a:['葉酸','folicacid','folate','5-mthf','活性葉酸','甲基葉酸','l-甲基葉酸'], g:['女性保養'], n:'造血需要；備孕、懷孕初期特別重要', good:{preg:'備孕、懷孕初期需要'}, dose:{u:'ug', ul:1000, ulMsg:'超過成人每日上限 1000 μg'}},
    {k:'生物素', a:['生物素','biotin','維生素b7','維生素h'], g:['美容'], n:'頭髮、指甲保健品常見', w:{all:'會干擾部分抽血檢驗（甲狀腺、心肌指標），抽血前要告訴醫師'}},
    {k:'菸鹼酸', a:['菸鹼酸','niacin','nicotinicacid','維生素b3'], g:['精神體力'], n:'高劑量會臉紅、發熱（潮紅）', dose:{u:'mg', ul:35, ulMsg:'超過成人每日上限 35 mg，可能臉紅、發熱'}},
    {k:'綜合維生素', a:['綜合維生素','綜合維他命','multivitamin','綜合維生素a','綜合礦物質'], g:['精神體力','免疫'], n:'基礎補充；同時吃其他單方時，注意 A、D、鐵、鋅不要重複吃太多'},
    // 礦物質
    {k:'鈣', a:['鈣','碳酸鈣','檸檬酸鈣','乳酸鈣','磷酸鈣','海藻鈣','葡萄糖酸鈣','胺基酸螯合鈣','calcium','天然鈣質','珍珠粉'], g:['骨骼關節'], n:'身體一次吸收約 500 mg，分次吃較好；碳酸鈣隨餐吃，檸檬酸鈣空腹也可以', w:{kidney:'有腎結石或腎功能不好的人要先問醫師', meds:'會影響部分藥物吸收（甲狀腺藥、部分抗生素），要隔 2～4 小時'}, dose:{u:'mg', ul:2500, ulMsg:'超過成人每日上限 2500 mg'}},
    {k:'鎂', a:['鎂','氧化鎂','檸檬酸鎂','甘胺酸鎂','蘋果酸鎂','碳酸鎂','magnesium'], g:['睡眠放鬆','精神體力','運動'], n:'肌肉、神經需要；甘胺酸鎂比較不會拉肚子', w:{kidney:'腎功能不好的人鎂排不掉，要先問醫師', stomach:'氧化鎂、檸檬酸鎂可能讓人拉肚子'}},
    {k:'鐵', a:['鐵','富馬酸亞鐵','硫酸亞鐵','甘胺酸亞鐵','葡萄糖酸亞鐵','焦磷酸鐵','血紅素鐵','iron'], g:['女性保養','精神體力'], n:'跟鈣、茶、咖啡隔開吃，搭配維生素 C 吸收較好', w:{stomach:'容易便祕、胃不舒服；可隨餐吃或選甘胺酸亞鐵'}, dose:{u:'mg', ul:40, ulMsg:'超過成人每日上限 40 mg'}},
    {k:'鋅', a:['鋅','葡萄糖酸鋅','甘胺酸鋅','檸檬酸鋅','氧化鋅','zinc','鋅酵母'], g:['免疫','美容'], n:'免疫、皮膚需要；空腹吃可能想吐', dose:{u:'mg', ul:35, ulMsg:'超過成人每日上限 35 mg，長期吃會影響銅吸收'}},
    {k:'硒', a:['硒','酵母硒','selenium','硒酵母'], g:['免疫'], n:'抗氧化酵素需要，量很少就夠', dose:{u:'ug', ul:400, ulMsg:'超過成人每日上限 400 μg'}},
    {k:'碘', a:['碘','碘化鉀','碘酸鉀','iodine','potassiumiodide'], g:[], n:'甲狀腺需要的礦物質；台灣有加碘鹽，一般不用另外大量補', w:{meds:'有甲狀腺疾病或在吃甲狀腺藥的人先問醫師'}, dose:{u:'ug', ul:1000, ulMsg:'超過成人每日上限 1000 μg'}},
    {k:'鉻', a:['鉻','吡啶甲酸鉻','chromium'], g:[], n:'血糖代謝相關', w:{meds:'吃降血糖藥的人先問醫師'}},
    // 腸胃
    {k:'益生菌', a:['益生菌','乳酸菌','乳酸桿菌','雙歧桿菌','比菲德氏菌','嗜酸乳桿菌','鼠李糖乳桿菌','植物乳桿菌','副乾酪乳桿菌','龍根菌','lactobacillus','bifidobacterium','probiotic','probiotics','lgg','lp33','bb-12','bb12','ncfm','凝結芽孢桿菌','枯草桿菌','酪酸菌'], g:['腸胃','免疫'], n:'有寫「菌株編號」（例如 LGG、LP33、BB-12）比只寫菌種更好，研究是看菌株', dose:{u:'yi', low:10, lowMsg:'菌數偏少，常見產品每份 10～100 億以上'}},
    {k:'益生元', a:['益菌生','益生元','寡糖','果寡糖','半乳寡糖','木寡醣','木寡糖','菊糖','菊苣纖維','fos','gos','xos','inulin'], g:['腸胃'], n:'益生菌的食物', w:{stomach:'剛開始吃可能脹氣，量從少開始'}},
    {k:'膳食纖維', a:['膳食纖維','洋車前子','車前子','燕麥纖維','難消化性麥芽糊精','聚葡萄糖','蘋果纖維','全穀燕麥','燕麥'], g:['腸胃','心血管'], n:'要多喝水，不然反而會便祕'},
    {k:'β-葡聚醣', a:['β-葡聚醣','葡聚醣','betaglucan','β-glucan','酵母β-葡聚醣','燕麥β-葡聚醣'], g:['免疫','心血管'], n:'燕麥、菇類、酵母來源，免疫與膽固醇相關研究多'},
    {k:'酵素', a:['酵素','鳳梨酵素','木瓜酵素','綜合酵素','消化酵素','enzyme'], g:['腸胃'], n:'很多「酵素」飲品其實是發酵果汁，要看糖含量'},
    // 骨骼關節
    {k:'葡萄糖胺', a:['葡萄糖胺','葡萄糖胺鹽酸鹽','葡萄糖胺硫酸鹽','glucosamine','glcn'], g:['骨骼關節'], n:'關節保養最常見的成分', w:{seafood:'多從蝦蟹殼萃取，對甲殼類過敏要看來源', anticoag:'和 warfarin 一起吃可能影響凝血，先問醫師'}},
    {k:'軟骨素', a:['軟骨素','硫酸軟骨素','chondroitin'], g:['骨骼關節'], n:'常和葡萄糖胺一起出現', w:{anticoag:'可能影響凝血，先問醫師'}},
    {k:'MSM', a:['msm','甲基硫醯基甲烷','有機硫'], g:['骨骼關節'], n:'常和葡萄糖胺一起出現'},
    {k:'UC-II', a:['uc-ii','ucii','uc2','非變性第二型膠原蛋白','二型膠原蛋白'], g:['骨骼關節'], n:'約 40 mg 就有研究，跟美容用的膠原蛋白不同'},
    {k:'薑黃', a:['薑黃','薑黃素','curcumin','turmeric'], g:['骨骼關節','免疫'], n:'吸收差，搭配黑胡椒萃取（胡椒鹼）或特殊劑型吸收較好', w:{anticoag:'可能增加出血風險，先問醫師', meds:'可能和降血糖、降血壓藥互相影響，先問藥師'}},
    {k:'黑胡椒萃取', a:['黑胡椒萃取','黑胡椒','胡椒鹼','piperine','bioperine'], g:[], n:'幫助薑黃吸收', w:{meds:'會改變部分藥物在體內的濃度，吃藥的人先問藥師'}},
    // 心血管、精神
    {k:'輔酶Q10', a:['輔酶q10','輔酵素q10','q10','coq10','還原型q10','泛醌','ubiquinol','ubiquinone'], g:['心血管','精神體力'], n:'吃降血脂藥（statin）的人常補充；脂溶性，隨餐吃', w:{anticoag:'可能降低 warfarin 效果，先問醫師'}},
    {k:'紅麴', a:['紅麴','紅麴米','redyeastrice','monacolin','莫那可林'], g:['心血管'], n:'含天然 statin 成分；選有標示「不含橘黴素」的', w:{meds:'正在吃降血脂藥不要一起吃', preg:'懷孕、哺乳不建議'}},
    {k:'納豆激酶', a:['納豆激酶','nattokinase','納豆萃取'], g:['心血管'], n:'和血液循環有關的酵素', w:{anticoag:'會影響凝血，吃抗凝血藥或手術前不要吃'}},
    {k:'銀杏', a:['銀杏','銀杏葉','ginkgo'], g:['精神體力'], n:'循環、記憶訴求常見', w:{anticoag:'可能增加出血風險'}},
    {k:'白藜蘆醇', a:['白藜蘆醇','resveratrol','虎杖'], g:['心血管'], n:'葡萄皮、虎杖的抗氧化成分', w:{anticoag:'可能增加出血風險'}},
    {k:'人蔘', a:['人蔘','人參','紅蔘','高麗蔘','高麗人蔘','西洋蔘','人蔘皂苷','ginseng','紅蔘粉末'], g:['精神體力','免疫'], n:'提神、體力訴求常見', w:{meds:'可能影響血糖、血壓藥，吃藥的人先問醫師', anticoag:'可能影響抗凝血藥效果', preg:'懷孕期間不建議'}},
    {k:'瑪卡', a:['瑪卡','maca'], g:['精神體力'], n:'體力訴求常見'},
    {k:'牛磺酸', a:['牛磺酸','taurine'], g:['精神體力','運動'], n:'提神飲料、雞精常見'},
    {k:'咖啡因', a:['咖啡因','caffeine','瓜拿納','guarana'], g:['精神體力'], n:'下午之後吃可能睡不好', w:{preg:'懷孕要控制每天咖啡因總量（含咖啡、茶）'}},
    {k:'雞精', a:['雞精','雞肉萃取','純雞精萃取','雞肉萃取精華','滴雞精','肌肽','carnosine','咪唑胜肽','鵝肌肽'], g:['精神體力'], n:'含胺基酸、雙胜肽，提神、補體力常見', w:{kidney:'腎功能不好的人要注意蛋白質和磷、鉀'}},
    {k:'芝麻素', a:['芝麻素','sesamin','黑芝麻'], g:['精神體力'], n:'芝麻的抗氧化成分，睡眠、肝臟保養訴求常見'},
    {k:'靈芝', a:['靈芝','靈芝多醣體','靈芝三萜類','靈芝孢子粉','牛樟芝','樟芝','多醣體','三萜類'], g:['免疫'], n:'免疫保養訴求常見', w:{anticoag:'可能影響凝血，先問醫師', meds:'可能影響血糖、血壓藥'}},
    // 睡眠
    {k:'GABA', a:['gaba','γ-胺基丁酸','胺基丁酸'], g:['睡眠放鬆'], n:'放鬆、助眠訴求常見'},
    {k:'色胺酸', a:['色胺酸','l-色胺酸','tryptophan'], g:['睡眠放鬆'], n:'血清素的原料', w:{meds:'吃抗憂鬱藥的人不要自己加吃'}},
    {k:'5-HTP', a:['5-htp','5htp','5-羥基色胺酸'], g:['睡眠放鬆'], n:'血清素的前驅物', w:{meds:'吃抗憂鬱藥的人不要自己加吃'}},
    {k:'褪黑激素', a:['褪黑激素','melatonin'], g:['睡眠放鬆'], n:'在台灣是處方藥，不能當保健食品賣', w:{all:'台灣列為處方藥，國外買的要先問醫師'}},
    {k:'茶胺酸', a:['茶胺酸','l-茶胺酸','theanine','l-theanine'], g:['睡眠放鬆'], n:'綠茶裡的胺基酸，放鬆訴求常見'},
    // 美容、女性
    {k:'膠原蛋白', a:['膠原蛋白','膠原蛋白胜肽','魚膠原蛋白','魚膠原蛋白胜肽','水解膠原蛋白','collagen','膠原胜肽'], g:['美容'], n:'小分子水解胜肽較好吸收', w:{veg:'動物來源（魚、豬、牛），吃素不行', seafood:'魚膠原蛋白是魚做的，對魚過敏要看來源'}},
    {k:'玻尿酸（口服）', a:['玻尿酸','透明質酸','hyaluronicacid','sodiumhyaluronate'], g:['美容'], n:'口服玻尿酸，皮膚保水訴求'},
    {k:'大豆異黃酮', a:['大豆異黃酮','異黃酮','isoflavone','isoflavones'], g:['女性保養'], n:'植物雌激素', w:{soy:'大豆來源', preg:'懷孕、哺乳不建議', meds:'有荷爾蒙相關疾病或用藥的人先問醫師'}},
    {k:'蔓越莓', a:['蔓越莓','cranberry','前花青素','pac','蔓越莓萃取'], g:['女性保養'], n:'女性泌尿道保養，看「PAC 前花青素」含量', w:{anticoag:'可能影響 warfarin 效果'}},
    {k:'肌醇', a:['肌醇','myo-肌醇','myoinositol','inositol','d-手性肌醇'], g:['女性保養'], n:'女性生理、代謝保養常見'},
    {k:'燕窩', a:['燕窩','燕窩萃取','唾液酸'], g:['美容'], n:'美容訴求，看唾液酸含量'},
    // 運動、其他
    {k:'乳清蛋白', a:['乳清蛋白','分離乳清蛋白','濃縮乳清蛋白','whey','蛋白粉','完全蛋白質'], g:['運動'], n:'補蛋白質', w:{kidney:'腎功能不好的人要控制蛋白質', stomach:'乳糖不耐的人選「分離乳清」比較不會脹氣'}},
    {k:'植物蛋白', a:['大豆蛋白','豌豆蛋白','植物蛋白','糙米蛋白'], g:['運動'], n:'植物來源蛋白質', good:{veg:'素食可以吃'}, w:{soy:'大豆蛋白是大豆來源', kidney:'腎功能不好的人要控制蛋白質'}},
    {k:'肌酸', a:['肌酸','一水肌酸','creatine','crm'], g:['運動'], n:'研究最多的運動補充品之一', w:{kidney:'腎功能不好的人先問醫師'}},
    {k:'支鏈胺基酸', a:['支鏈胺基酸','bcaa','白胺酸','異白胺酸','纈胺酸'], g:['運動'], n:'運動時補充'},
    {k:'電解質', a:['電解質','氯化鉀','氯化鈉','electrolyte','electrolytes','口服電解質'], g:['運動'], n:'大量流汗、腹瀉後補充', w:{kidney:'腎功能不好的人鉀排不掉，要先問醫師', meds:'吃部分降血壓藥的人要注意鉀'}},
    {k:'NMN', a:['nmn','nr','菸鹼醯胺單核苷酸','菸鹼醯胺核糖','nad+','nad'], g:[], n:'人體研究還在早期，價格高'},
    {k:'茄紅素', a:['茄紅素','lycopene'], g:['心血管'], n:'番茄的抗氧化色素，脂溶性'},
    {k:'綠茶萃取', a:['綠茶萃取','兒茶素','egcg','綠茶多酚'], g:[], n:'抗氧化', w:{all:'高劑量綠茶萃取空腹吃可能傷肝，照建議量'}},
    {k:'體態管理成分', a:['藤黃果','garcinia','綠咖啡','綠咖啡豆','左旋肉鹼','l-肉鹼','l-carnitine','白腎豆','共軛亞麻油酸','cla','甲殼素','幾丁聚醣'], g:[], n:'體態管理訴求，效果證據有限'},
    {k:'卵磷脂', a:['卵磷脂','大豆卵磷脂','lecithin','磷脂醯絲胺酸','磷脂絲胺酸'], g:[], n:'乳化劑，也有腦部保養訴求', w:{soy:'大豆卵磷脂：對大豆過敏要看來源'}},

    // ---------- 賦形劑、膠囊、添加物（不算主成分） ----------
    {k:'明膠膠囊', a:['明膠','明膠膠囊','gelatin','動物膠囊','軟膠囊殼'], kind:'ex', n:'膠囊殼，豬或牛皮做的', w:{veg:'動物來源，吃素不行'}},
    {k:'植物膠囊', a:['植物膠囊','羥丙基甲基纖維素','hpmc','植物性膠囊','普魯蘭多醣'], kind:'ex', n:'植物做的膠囊殼', good:{veg:'素食可以吃'}},
    {k:'賦形劑', a:['硬脂酸鎂','二氧化矽','微晶纖維素','纖維素','麥芽糊精','玉米澱粉','澱粉','甘油','硬脂酸','滑石粉','交聯羧甲基纖維素鈉','聚乙烯吡咯烷酮','阿拉伯膠','糊精','純水','水','純化水','蜂蠟','巴西棕櫚蠟','棕櫚蠟','蟲膠','乳化劑','果膠','海藻酸鈉','鹿角菜膠','碳酸氫鈉'], kind:'ex', n:'幫助成形、流動的輔料，用量少，沒有特別影響'},
    {k:'乳糖', a:['乳糖','奶粉','乳粉','lactose'], kind:'ex', n:'乳製品來源', w:{stomach:'乳糖不耐的人可能脹氣、拉肚子'}},
    {k:'大豆油', a:['大豆油','黃豆油','soybeanoil'], kind:'ex', n:'軟膠囊裡的溶劑油', w:{soy:'大豆來源（精製油通常過敏原很少，嚴重過敏者還是要問醫師）'}},
    {k:'糖', a:['砂糖','蔗糖','白砂糖','果糖','高果糖糖漿','葡萄糖漿','葡萄糖','麥芽糖','黑糖','蜂蜜','楓糖','糖'], kind:'sugar', n:'含糖；軟糖、飲品要算進每天的糖量', w:{all:'含糖，要算進一天的糖量（排越前面糖越多）'}},
    {k:'代糖', a:['蔗糖素','甜菊','甜菊糖苷','甘露醇','d-甘露醇','赤藻糖醇','木糖醇','山梨醇','麥芽糖醇','醋磺內酯鉀','阿斯巴甜','羅漢果'], kind:'ex', n:'低熱量甜味劑；糖醇類吃多可能拉肚子'},
    {k:'色素', a:['二氧化鈦','氧化鐵','氧化鐵紅','氧化鐵黃','氧化鐵黑','焦糖色素','食用色素','黃色四號','黃色五號','紅色四十號','藍色一號','人工色素','色素'], kind:'ex', n:'讓顏色好看，沒有營養價值；歐盟已禁止二氧化鈦加在食品'},
    {k:'香料', a:['香料','天然香料','人工香料','香精','調味劑','可可粉','綠茶粉','抹茶粉','咖啡粉'], kind:'ex', n:'調味用，沒有營養價值'},
    {k:'酸味劑', a:['檸檬酸','檸檬酸鈉','蘋果酸','乳酸','酒石酸','磷酸'], kind:'ex', n:'調整酸味、酸鹼，沒有特別影響'},
    {k:'植物油（基底油）', a:['橄欖油','葵花油','葵花籽油','紅花籽油','中鏈三酸甘油酯','mct','mct油','椰子油'], kind:'ex', n:'軟膠囊裡溶解脂溶性成分用的油'},
    {k:'防腐劑', a:['己二烯酸鉀','己二烯酸','苯甲酸鈉','苯甲酸','防腐劑'], kind:'ex', n:'液體、飲品常見，合法用量內安全'}
  ];

  /* ---------- 工具 ---------- */
  function $(id){ return document.getElementById(id); }
  function mk(tag, cls, text){ var e = document.createElement(tag); if(cls){ e.className = cls; } if(text != null){ e.textContent = text; } return e; }
  function store(k, v){ try{ if(v === undefined){ return JSON.parse(localStorage.getItem(k) || 'null'); } localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
  function toHalf(s){ return String(s).replace(/[！-～]/g, function(ch){ return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); }).replace(/　/g, ' '); }
  function norm(s){ return toHalf(s).toLowerCase().replace(/維他命/g, '維生素').replace(/輔酵素/g, '輔酶').replace(/[\s·・．。.'"’()（）\[\]【】]/g, ''); }

  var ALIAS = [];
  ING.forEach(function(ing, i){ ing.a.concat([ing.k]).forEach(function(a){ ALIAS.push({ n: norm(a), i: i, raw: a }); }); });
  ALIAS.sort(function(x, y){ return y.n.length - x.n.length; });

  /* 劑量：1000mg、20 毫克、1000IU、25μg、100億 */
  var DOSE_RE = /(\d+(?:[.,]\d+)?)\s*(mg|毫克|μg|µg|ug|mcg|微克|iu|i\.u\.|國際單位|億|g|公克|克)(?![a-z])/i;
  function parseDose(tok){
    var m = toHalf(tok).match(DOSE_RE);
    if(!m){ return null; }
    var v = parseFloat(m[1].replace(',', '.')), u = m[2].toLowerCase();
    if(u === '毫克'){ u = 'mg'; }
    else if(/^(μg|µg|ug|mcg|微克)$/.test(u)){ u = 'ug'; }
    else if(/^(iu|i\.u\.|國際單位)$/.test(u)){ u = 'IU'; }
    else if(u === '億'){ u = 'yi'; }
    else if(/^(g|公克|克)$/.test(u)){ u = 'mg'; v = v * 1000; }
    return { v: v, u: u, raw: m[0] };
  }
  function stripDose(tok){ return toHalf(tok).replace(new RegExp(DOSE_RE.source, 'ig'), '').replace(/[：:]\s*$/, ''); }
  function convert(d, ing){
    if(!d || !ing.dose){ return null; }
    var want = ing.dose.u;
    if(d.u === want){ return d.v; }
    if(ing.k === '維生素D' && want === 'IU' && d.u === 'ug'){ return d.v * 40; }
    if(ing.k === '維生素A' && want === 'ug' && d.u === 'IU'){ return d.v * 0.3; }
    if(want === 'ug' && d.u === 'mg'){ return d.v * 1000; }
    if(want === 'mg' && d.u === 'ug'){ return d.v / 1000; }
    return null;
  }
  function fmtDose(d){ return d ? d.raw.replace(/\s+/g, '') : ''; }

  function matchExact(token){
    var t = norm(stripDose(token));
    for(var j = 0; j < ALIAS.length; j++){ if(ALIAS[j].n === t){ return ING[ALIAS[j].i]; } }
    return null;
  }
  var CODE_ING = {};
  function match(token){
    var raw = stripDose(token);
    var t = norm(raw);
    if(!t){ return null; }
    for(var j = 0; j < ALIAS.length; j++){ if(ALIAS[j].n === t){ return ING[ALIAS[j].i]; } }
    // 代號、簡稱（E330、EPA、rTG…）
    if(typeof window.lookupCode === 'function'){
      var hits = window.lookupCode(raw);
      if(hits.length){
        var c = hits.filter(function(h){ return /s/.test(h.at); })[0] || hits[0];
        var viaDb = c.db ? matchExact(c.db) : null;
        if(viaDb){ return viaDb; }
        var viaZh = matchExact(String(c.zh).replace(/（.*?）/g, ''));
        if(viaZh){ return viaZh; }
        if(!CODE_ING[c.c]){ CODE_ING[c.c] = { k: c.zh + '（' + c.c + '）', a: [], g: [], kind: 'ex', n: c.n + (c.w ? '；' + c.w : '') }; }
        return CODE_ING[c.c];
      }
    }
    for(j = 0; j < ALIAS.length; j++){
      var a = ALIAS[j].n;
      if(a.length < 2){ continue; }
      if(/^[a-z0-9\-+]+$/.test(a) && a.length <= 4){ continue; }
      if(t.indexOf(a) !== -1){ return ING[ALIAS[j].i]; }
    }
    // 單一字的礦物質（鈣、鐵、鋅、鎂、硒、鉻）放最後
    for(j = 0; j < ALIAS.length; j++){
      if(ALIAS[j].n.length === 1 && t.indexOf(ALIAS[j].n) !== -1){ return ING[ALIAS[j].i]; }
    }
    return null;
  }
  function splitTokens(raw){
    return raw.replace(/(\d)\s*[,，]\s*(?=\d)/g, '$1\u201A').split(/[,，、;；\n\r]+/)
      .map(function(s){ return s.replace(/\u201A/g, ',').trim(); }).filter(function(s){ return s; });
  }

  /* ---------- 狀態 ---------- */
  var profile = store('mm_sup_profile') || { goals: [], flags: [] };
  var saved = store('mm_sup_saved') || [];
  function hasFlag(f){ return profile.flags.indexOf(f) !== -1; }

  /* ---------- 評估 ---------- */
  function evaluate(tokens, prof){
    var P = prof || profile;
    var items = [], good = [], bad = [], neutral = [], unknown = [], doseNotes = [], hints = [];
    var score = 0, hitGoals = {};
    var epa = null, dha = null, hasFish = false, hasOmegaDetail = false, hasTurmeric = false, hasPepper = false;
    var form = '';
    var hasFishAll = tokens.some(function(t){ var m = match(t); return m && m.k === '魚油'; });
    tokens.forEach(function(tok, pos){
      var low = norm(tok);
      if(/rtg|再酯化/.test(low)){ form = 'rTG'; } else if(!form && /tg型|三酸甘油酯型/.test(low)){ form = 'TG'; } else if(!form && /ee型|乙酯/.test(low)){ form = 'EE'; }
      var ing = match(tok);
      if(!ing){ unknown.push(tok); return; }
      var d = parseDose(tok);
      if(ing.k === 'EPA'){ hasOmegaDetail = true; if(d){ epa = convert(d, { k:'x', dose:{ u:'mg' } }); } }
      if(ing.k === 'DHA'){ hasOmegaDetail = true; if(d){ dha = convert(d, { k:'x', dose:{ u:'mg' } }); } }
      if(ing.k === '魚油'){ hasFish = true; }
      if(ing.k === '薑黃'){ hasTurmeric = true; }
      if(ing.k === '黑胡椒萃取'){ hasPepper = true; }
      if(items.some(function(x){ return x.ing === ing; })){ return; }
      var w = pos < 5 ? 1 : (pos < 10 ? 0.6 : 0.3);
      var reasons = [], warns = [];
      (ing.g || []).forEach(function(g){ if(P.goals.indexOf(g) !== -1){ reasons.push('有你想要的「' + g + '」'); hitGoals[g] = true; } });
      Object.keys(ing.good || {}).forEach(function(f){ if(P.flags.indexOf(f) !== -1){ reasons.push(ing.good[f]); } });
      var wn = ing.w || {};
      if((ing.k === 'EPA' || ing.k === 'DHA') && hasFishAll){ wn = {}; }
      if(wn.all){ warns.push(wn.all); }
      var dv = convert(d, ing);
      P.flags.forEach(function(f){
        if(!wn[f]){ return; }
        // 只有高劑量才需要擔心的（例如維生素 E 和抗凝血藥）：沒寫含量或含量低就不提醒
        if(ing.onlyHigh && ing.onlyHigh[f] && !(dv != null && dv >= ing.onlyHigh[f])){ return; }
        warns.push('（' + FLAG_TEXT[f] + '）' + wn[f]);
      });
      // 劑量
      if(dv != null && ing.dose){
        if(ing.dose.ul && dv > ing.dose.ul){ warns.push('劑量 ' + fmtDose(d) + '：' + ing.dose.ulMsg); }
        else if(ing.dose.low && dv < ing.dose.low){ doseNotes.push(ing.k + ' ' + fmtDose(d) + '：' + ing.dose.lowMsg); }
        else if(reasons.length){ reasons.push('劑量 ' + fmtDose(d) + ' 在合理範圍'); }
      }
      var entry = { tok: tok, ing: ing, pos: pos, reasons: reasons, warns: warns, dose: d };
      items.push(entry);
      // 糖排越前面越多；健康狀況相關的提醒不論排第幾都算重
      var ww = ing.kind === 'sugar' ? (pos < 3 ? 1 : 0.5) : Math.max(w, 0.7);
      if(reasons.length){ score += (reasons.length > 1 ? 2.5 : 1.8) * w; }
      if(warns.length){ bad.push(entry); score -= 3 * ww * Math.min(2, warns.length); }
      else if(reasons.length){ good.push(entry); }
      else { neutral.push(entry); }
    });
    // EPA＋DHA 合計
    if(epa != null || dha != null){
      var sum = (epa || 0) + (dha || 0);
      if(sum < 250){ doseNotes.push('EPA＋DHA 合計 ' + Math.round(sum) + ' mg：偏低，一般保養建議每天至少 250～500 mg'); score -= 1.5; }
      else if(sum >= 500){ hints.unshift('✓ EPA＋DHA 合計 ' + Math.round(sum) + ' mg，含量不錯'); score += 1.5; }
      else { hints.unshift('EPA＋DHA 合計 ' + Math.round(sum) + ' mg，屬基本保養量'); }
    } else if(hasFish && !hasOmegaDetail){
      hints.push('只看到「魚油」，沒寫 EPA、DHA：翻到營養標示找「EPA」「DHA」的毫克數，兩個加起來越高越好');
      score -= 1;
    }
    if(form === 'rTG' || form === 'TG'){ hints.push('✓ 魚油型態 ' + form + '，吸收比乙酯型（EE）好'); score += 0.8; }
    if(form === 'EE'){ hints.push('乙酯型（EE）魚油價格較低，記得隨餐吃'); }
    if(hasTurmeric && !hasPepper){ hints.push('薑黃本身吸收差，有搭配黑胡椒萃取或特殊劑型的會比較好'); }
    if(hasTurmeric && hasPepper){ hints.push('✓ 薑黃有搭配黑胡椒萃取，吸收較好'); }
    var probiotic = items.filter(function(x){ return x.ing.k === '益生菌'; })[0];
    if(probiotic){
      var strain = tokens.some(function(t){
        if(match(t) !== probiotic.ing && !/菌/.test(t)){ return false; }
        return /lgg|lp33|bb-?12|ncfm|\b[a-z]{1,4}-?\d{2,}\b/i.test(stripDose(t)) || /菌株/.test(t);
      });
      hints.push(strain ? '✓ 有標示菌株編號，比只寫菌種可靠' : '益生菌沒看到菌株編號（例如 LGG、BB-12），研究是看菌株，有寫的比較好');
    }
    score -= doseNotes.length * 1;
    var missing = P.goals.filter(function(g){ return !hitGoals[g]; });
    var raw = 55 + score * 6 - missing.length * 4;
    var pct = Math.round(Math.max(10, Math.min(100, raw)));
    if(!good.length && !bad.length){ pct = Math.min(pct, 55); }
    if(bad.some(function(e){ return e.warns.some(function(x){ return x.indexOf('（') === 0 || x.indexOf('劑量') === 0; }); })){ pct = Math.min(pct, 58); }
    if(bad.length >= 2){ pct = Math.min(pct, 70); }
    var verdict = pct >= 80 ? '很適合你' : pct >= 62 ? '可以考慮' : pct >= 45 ? '普通，沒有特別適合' : '不太建議';
    var tone = pct >= 80 ? 'ok' : pct >= 62 ? 'mid' : pct >= 45 ? 'meh' : 'no';
    return { pct: pct, raw: raw, verdict: verdict, tone: tone, good: good, bad: bad, neutral: neutral, unknown: unknown, missing: missing, doseNotes: doseNotes, hints: hints, count: tokens.length, matched: items.length };
  }

  function summaryLine(r){
    var parts = [];
    if(r.good.length){ parts.push('有 ' + r.good.length + ' 個符合你需求的成分'); }
    if(r.bad.length){ parts.push(r.bad.length + ' 個要小心'); }
    var s = parts.length ? parts.join('、') + '。' : '沒有找到特別符合或要小心的成分。';
    if(r.missing.length && r.missing.length < profile.goals.length){ s += '沒看到「' + r.missing.join('、') + '」相關成分。'; }
    if(r.missing.length === profile.goals.length && profile.goals.length){ s += '主要成分跟你想補的（' + profile.goals.join('、') + '）沒什麼關係。'; }
    return s;
  }

  /* ---------- 畫面 ---------- */
  function profileText(){
    var t = ['想補：' + (profile.goals.length ? profile.goals.join('、') : '還沒選')];
    if(profile.flags.length){ t.push(profile.flags.map(function(f){ return FLAG_TEXT[f]; }).join('、')); }
    return t.join('｜');
  }
  function renderProfile(){
    var box = $('sup-profile');
    if(!box){ return; }
    if(!profile.goals.length){ box.dataset.open = '1'; }
    var open = box.dataset.open === '1';
    box.innerHTML = '';
    var head = mk('div', 'pick-prof-head');
    head.appendChild(mk('span', 'pick-step', '1'));
    var ht = mk('div', 'pick-prof-title');
    ht.appendChild(mk('b', null, '我想補什麼'));
    ht.appendChild(mk('span', 'pick-prof-sum', profileText()));
    head.appendChild(ht);
    if(profile.goals.length){
      var eb = mk('button', 'pick-link', open ? '收起' : '修改');
      eb.type = 'button';
      eb.addEventListener('click', function(){ box.dataset.open = open ? '' : '1'; renderProfile(); });
      head.appendChild(eb);
    }
    box.appendChild(head);
    if(!open){ return; }
    var body = mk('div', 'pick-prof-body');
    body.appendChild(mk('p', 'adv-label', '想補的方向（可複選）'));
    var gs = mk('div', 'pick-chips');
    GOALS.forEach(function(g){
      var on = profile.goals.indexOf(g) !== -1;
      var b = mk('button', 'pick-chip' + (on ? ' on' : ''), g);
      b.type = 'button'; b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', function(){
        if(on){ profile.goals = profile.goals.filter(function(x){ return x !== g; }); } else { profile.goals.push(g); }
        saveProfile();
      });
      gs.appendChild(b);
    });
    body.appendChild(gs);
    body.appendChild(mk('p', 'adv-label', '我的狀況（有的才勾，會幫你標出要小心的成分）'));
    var fs = mk('div', 'pick-chips');
    FLAGS.forEach(function(f){
      var on = hasFlag(f[0]);
      var b = mk('button', 'pick-chip' + (on ? ' on' : ''), (on ? '✓ ' : '') + f[1]);
      b.type = 'button'; b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', function(){
        if(on){ profile.flags = profile.flags.filter(function(x){ return x !== f[0]; }); } else { profile.flags.push(f[0]); }
        saveProfile();
      });
      fs.appendChild(b);
    });
    body.appendChild(fs);
    body.appendChild(mk('p', 'pick-hint', '這些設定只存在你這台裝置的瀏覽器裡。有在吃藥的人，買保健食品前最好先問藥師。'));
    if(profile.goals.length){
      var done = mk('button', 'btn btn-primary', '設定好了');
      done.type = 'button'; done.style.marginTop = '10px';
      done.addEventListener('click', function(){ box.dataset.open = ''; renderProfile(); var i = $('sup-input'); if(i){ i.focus(); } });
      body.appendChild(done);
    }
    box.appendChild(body);
  }
  function saveProfile(){ store('mm_sup_profile', profile); renderProfile(); renderLive(); if(lastResult){ runPick(true); } renderCompare(); notify(); }

  function suggestFor(text, max){
    var q = norm(stripDose(text));
    if(!q){ return []; }
    var ascii = /^[a-z0-9\-+]+$/.test(q);
    if(ascii && q.length < 2){ return []; }
    var best = {};
    ALIAS.forEach(function(a){
      var sc = a.n === q ? 0 : a.n.indexOf(q) === 0 ? 1 : (q.length >= (ascii ? 4 : 1) && a.n.indexOf(q) !== -1) ? 2 : -1;
      if(sc < 0){ return; }
      var ing = ING[a.i], cur = best[ing.k];
      if(!cur || sc < cur.sc || (sc === cur.sc && a.n.length < norm(cur.raw).length)){ best[ing.k] = { ing: ing, sc: sc, raw: a.raw }; }
    });
    return Object.keys(best).map(function(k){ return best[k]; })
      .sort(function(x, y){ return x.sc - y.sc || (x.ing.kind ? 1 : 0) - (y.ing.kind ? 1 : 0) || norm(x.raw).length - norm(y.raw).length; })
      .slice(0, max || 8);
  }

  function renderLive(){
    var input = $('sup-input'), live = $('sup-live'), sug = $('sup-suggest');
    if(!input){ return; }
    var tokens = splitTokens(input.value);
    live.innerHTML = '';
    tokens.forEach(function(tok){
      var ing = match(tok);
      var r = ing ? evaluate([tok]) : null;
      var cls = !ing ? 'unk' : (r.bad.length ? 'bad' : r.good.length ? 'good' : 'neu');
      live.appendChild(mk('span', 'pick-tag ' + cls, ing ? (norm(ing.k) === norm(stripDose(tok)) ? tok : tok + '→' + ing.k) : tok + '？'));
    });
    sug.innerHTML = '';
    var last = input.value.split(/[,，、;；\n\r]/).pop().trim();
    if(last && !/[,，、]\s*$/.test(input.value)){
      var list = suggestFor(last, 8);
      if(list.length && !(list.length === 1 && list[0].sc === 0)){
        list.forEach(function(it){
          var b = mk('button', 'pick-sug', it.ing.k);
          if(norm(it.raw) !== norm(it.ing.k)){ b.appendChild(mk('small', 'pick-sug-sub', it.raw)); }
          b.type = 'button';
          b.addEventListener('click', function(){
            var v = input.value, idx = Math.max(v.lastIndexOf(','), v.lastIndexOf('，'), v.lastIndexOf('、'), v.lastIndexOf('\n'));
            var d = parseDose(last);
            input.value = (idx >= 0 ? v.slice(0, idx + 1) : '') + it.ing.k + (d ? ' ' + fmtDose(d) : '') + '、';
            input.focus(); renderLive();
          });
          sug.appendChild(b);
        });
      }
    }
  }

  var lastResult = null;
  function runPick(quiet){
    var err = $('sup-error');
    err.hidden = true;
    var tokens = splitTokens($('sup-input').value);
    if(!profile.goals.length){ err.textContent = '先在上面選你想補的方向，才知道適不適合你。'; err.hidden = false; $('sup-profile').dataset.open = '1'; renderProfile(); return; }
    if(tokens.length < 1){ if(!quiet){ err.textContent = '輸入包裝上的成分，用逗號或頓號隔開；有寫含量的話一起打（例如：EPA 400mg）。'; err.hidden = false; } return; }
    lastResult = { tokens: tokens, name: $('sup-name').value.trim(), type: $('sup-type').value, r: evaluate(tokens) };
    renderResult();
    if(!quiet){ $('sup-result').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function ingRow(e, kind){
    var li = mk('li', 'pick-row ' + kind);
    var top = mk('div', 'pick-row-top');
    top.appendChild(mk('b', null, e.ing.k));
    if(norm(stripDose(e.tok)) !== norm(e.ing.k) || e.dose){ top.appendChild(mk('span', 'pick-orig', e.tok)); }
    top.appendChild(mk('span', 'pick-pos', '第 ' + (e.pos + 1) + ' 個'));
    li.appendChild(top);
    var msg = kind === 'bad' ? e.warns.join('；') : kind === 'good' ? e.reasons.join('、') : '';
    if(kind === 'bad' && e.reasons.length){ li.appendChild(mk('p', 'pick-why sup-plus', '✓ ' + e.reasons.join('、'))); }
    if(msg){ li.appendChild(mk('p', 'pick-why', msg)); }
    li.appendChild(mk('p', 'pick-note', e.ing.n));
    return li;
  }

  function typeTip(t){
    if(t === '軟糖／咀嚼錠'){ return '軟糖、咀嚼錠通常含糖，有效成分含量也常比膠囊低，看清楚每份含量。'; }
    if(t === '飲品／雞精'){ return '飲品看「糖」和「熱量」；雞精類腎功能不好的人要注意。'; }
    if(t === '軟膠囊'){ return '軟膠囊多是脂溶性成分（魚油、葉黃素、D、E），隨餐吃吸收較好。'; }
    return '';
  }

  function renderResult(){
    var box = $('sup-result');
    box.innerHTML = '';
    if(!lastResult){ box.hidden = true; return; }
    box.hidden = false;
    var r = lastResult.r;
    var head = mk('div', 'pick-score ' + r.tone);
    var ring = mk('div', 'pick-ring');
    ring.style.setProperty('--p', r.pct);
    ring.appendChild(mk('span', 'mono', String(r.pct)));
    head.appendChild(ring);
    var ht = mk('div');
    ht.appendChild(mk('p', 'pick-name-out', (lastResult.name || '這罐' + lastResult.type) + ' 適合度'));
    ht.appendChild(mk('p', 'pick-verdict', r.verdict));
    ht.appendChild(mk('p', 'pick-sum', summaryLine(r)));
    head.appendChild(ht);
    box.appendChild(head);

    if(r.hints.length || r.doseNotes.length){
      var dsec = mk('div', 'pick-sec');
      dsec.appendChild(mk('p', 'pick-sec-title', '💊 含量與型態'));
      var ul0 = mk('ul', 'sup-checks');
      r.hints.forEach(function(h){ ul0.appendChild(mk('li', h.indexOf('✓') === 0 ? 'ok' : '', h)); });
      r.doseNotes.forEach(function(h){ ul0.appendChild(mk('li', 'low', '⚠️ ' + h)); });
      dsec.appendChild(ul0);
      box.appendChild(dsec);
    }
    function block(title, list, kind, emptyText){
      var sec = mk('div', 'pick-sec');
      sec.appendChild(mk('p', 'pick-sec-title ' + kind, title + '（' + list.length + '）'));
      if(!list.length){ sec.appendChild(mk('p', 'pick-empty', emptyText)); return sec; }
      var ul = mk('ul', 'pick-list');
      list.forEach(function(e){ ul.appendChild(ingRow(e, kind)); });
      sec.appendChild(ul);
      return sec;
    }
    var goodBad = r.bad.some(function(e){ return e.reasons.length; });
    box.appendChild(block('🟢 符合你的需求', r.good, 'good', goodBad ? '符合你需求的成分都有要小心的地方，看下面「你要小心」。' : '沒有找到符合你想補方向的成分。'));
    box.appendChild(block('🔴 你要小心', r.bad, 'bad', '依你勾的狀況，沒有發現要避開的成分。'));
    if(r.neutral.length){
      var d = mk('details', 'pick-more');
      d.appendChild(mk('summary', null, '⚪ 其他成分（' + r.neutral.length + '）：膠囊、賦形劑、添加物或不在你需求內的成分'));
      var ul = mk('ul', 'pick-list');
      r.neutral.forEach(function(e){ ul.appendChild(ingRow(e, 'neu')); });
      d.appendChild(ul);
      box.appendChild(d);
    }
    if(r.unknown.length){ box.appendChild(mk('p', 'pick-hint', '資料庫裡沒有、沒列入判斷的：' + r.unknown.join('、') + '。')); }
    box.appendChild(mk('p', 'pick-hint', '小提醒：含量要看「每份」還是「每日建議量」，有些產品一天要吃 2～3 顆。'));
    var tip = typeTip(lastResult.type);
    if(tip){ box.appendChild(mk('p', 'pick-hint', tip)); }

    var act = mk('div', 'pick-actions');
    var sv = mk('button', 'btn btn-primary', saved.length >= 3 ? '已存 3 罐（先刪一罐）' : '存起來，跟其他罐比較');
    sv.type = 'button'; sv.disabled = saved.length >= 3;
    sv.addEventListener('click', function(){
      if(add(lastResult.name, lastResult.type, lastResult.tokens)){
        $('sup-input').value = ''; $('sup-name').value = '';
        lastResult = null; renderLive(); renderResult();
        $('sup-compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    act.appendChild(sv);
    box.appendChild(act);
    box.appendChild(mk('p', 'db-note', '依成分特性、標示含量與你勾的狀況做的一般性判斷，不是醫療建議；有在吃藥、懷孕或有慢性病，買之前先問醫師或藥師。'));
  }

  function add(name, type, tokens){
    if(saved.length >= 3){ return false; }
    saved.push({ name: name || ('第 ' + (saved.length + 1) + ' 罐'), type: type || TYPES[0], tokens: tokens.slice(), at: Date.now() });
    store('mm_sup_saved', saved);
    renderCompare(); notify();
    return true;
  }

  function renderCompare(){
    var box = $('sup-compare');
    if(!box){ return; }
    box.innerHTML = '';
    if(!saved.length){ box.hidden = true; return; }
    box.hidden = false;
    box.appendChild(mk('p', 'pick-cmp-title', '比較（' + saved.length + ' / 3 罐）'));
    var rows = saved.map(function(s){ return { s: s, r: evaluate(s.tokens) }; });
    var best = rows.slice().sort(function(a, b){ return b.r.pct - a.r.pct || b.r.raw - a.r.raw; })[0];
    if(rows.length >= 2){
      var tie = rows.filter(function(x){ return Math.abs(x.r.raw - best.r.raw) < 0.5; }).length > 1;
      box.appendChild(mk('p', 'pick-best', tie ? '有幾罐分數一樣，看下面哪罐「要小心」比較少、含量比較高。' : '以你的需求來看，最推薦「' + best.s.name + '」（' + best.r.pct + ' 分）。'));
    } else {
      box.appendChild(mk('p', 'pick-hint', '再評估一罐並存起來，就會幫你比較。'));
    }
    var grid = mk('div', 'pick-cmp-grid');
    rows.forEach(function(x, i){
      var c = mk('div', 'pick-cmp-card' + (rows.length >= 2 && x === best ? ' best' : ''));
      var h = mk('div', 'pick-cmp-head');
      h.appendChild(mk('b', null, x.s.name));
      h.appendChild(mk('span', 'mono pick-cmp-pct ' + x.r.tone, x.r.pct + ' 分'));
      c.appendChild(h);
      c.appendChild(mk('p', 'pick-cmp-verdict', x.s.type + '・' + x.r.verdict));
      c.appendChild(mk('p', 'pick-cmp-line good', '🟢 ' + (x.r.good.length ? x.r.good.map(function(e){ return e.ing.k; }).join('、') : '無')));
      c.appendChild(mk('p', 'pick-cmp-line bad', '🔴 ' + (x.r.bad.length ? x.r.bad.map(function(e){ return e.ing.k; }).join('、') : '無')));
      var omega = x.r.hints.filter(function(hh){ return /EPA＋DHA/.test(hh); })[0];
      if(omega){ c.appendChild(mk('p', 'pick-cmp-line', '💊 ' + omega.replace('✓ ', ''))); }
      var row = mk('div', 'pick-cmp-actions');
      var ed = mk('button', 'pick-link', '看詳細');
      ed.type = 'button';
      ed.addEventListener('click', function(){ $('sup-name').value = x.s.name; $('sup-type').value = x.s.type; $('sup-input').value = x.s.tokens.join('、'); renderLive(); runPick(); });
      var del = mk('button', 'pick-link', '刪除');
      del.type = 'button';
      del.addEventListener('click', function(){ saved.splice(i, 1); store('mm_sup_saved', saved); renderCompare(); if(lastResult){ renderResult(); } notify(); });
      row.appendChild(ed); row.appendChild(del);
      c.appendChild(row);
      grid.appendChild(c);
    });
    box.appendChild(grid);
    var clr = mk('button', 'pick-link', '全部清掉，挑下一種商品');
    clr.type = 'button';
    clr.addEventListener('click', function(){ saved = []; store('mm_sup_saved', saved); renderCompare(); if(lastResult){ renderResult(); } notify(); });
    box.appendChild(clr);
  }

  /* 依成分查詢用的說明卡 */
  function renderInfo(container, ing, typed){
    container.textContent = '';
    var card = mk('div', 'code-card');
    var top = mk('div', 'code-card-top');
    top.appendChild(mk('span', 'code-type', ing.kind ? '🧾 添加物／輔料' : '💊 保健食品成分'));
    if(typed && norm(typed) !== norm(ing.k)){ top.appendChild(mk('span', 'code-badge mono', typed)); }
    card.appendChild(top);
    card.appendChild(mk('div', 'code-card-name', ing.k));
    var d = mk('div', 'code-detail');
    if(ing.g && ing.g.length){ d.appendChild(mk('div', 'code-detail-use', '相關需求：' + ing.g.join('、'))); }
    d.appendChild(mk('p', 'code-detail-note', ing.n));
    if(ing.dose && (ing.dose.ul || ing.dose.low)){
      var u = { mg:'mg', ug:'μg', IU:'IU', yi:'億' }[ing.dose.u];
      d.appendChild(mk('div', 'code-detail-where', (ing.dose.low ? '建議至少 ' + ing.dose.low + ' ' + u : '') + (ing.dose.low && ing.dose.ul ? '；' : '') + (ing.dose.ul ? '成人每日上限 ' + ing.dose.ul + ' ' + u : '')));
    }
    var w = ing.w || {};
    Object.keys(w).forEach(function(k){ d.appendChild(mk('p', 'code-warn', '⚠️ ' + (k === 'all' ? '' : FLAG_TEXT[k] + '：') + w[k])); });
    card.appendChild(d);
    container.appendChild(card);
    container.appendChild(mk('p', 'code-foot', '想知道整罐適不適合你，到「🛒 店內挑選」（保健食品）把成分打進去。'));
  }

  /* 切換：保健食品分類顯示這一版，其他分類顯示保養品版 */
  function currentCat(){ var a = document.querySelector('.cat-tab.active'); return a ? a.dataset.cat : ''; }
  function syncMode(){
    var sup = currentCat() === 'supplement';
    var a = $('pick-skin-wrap'), b = $('pick-sup-wrap');
    if(a){ a.hidden = sup; }
    if(b){ b.hidden = !sup; }
  }
  var listeners = [];
  function notify(){ listeners.forEach(function(f){ try{ f(); }catch(e){} }); }

  function init(){
    if(!$('pick-sup-wrap')){ return; }
    var sel = $('sup-type');
    TYPES.forEach(function(t){ var o = mk('option', null, t); o.value = t; sel.appendChild(o); });
    var lastType = store('mm_sup_type'); if(lastType){ sel.value = lastType; }
    sel.addEventListener('change', function(){ store('mm_sup_type', sel.value); if(lastResult){ lastResult.type = sel.value; renderResult(); } });
    $('sup-input').addEventListener('input', renderLive);
    $('sup-btn').addEventListener('click', function(){ runPick(); });
    $('sup-clear').addEventListener('click', function(){ $('sup-input').value = ''; $('sup-name').value = ''; lastResult = null; renderLive(); renderResult(); $('sup-input').focus(); });
    document.querySelectorAll('.cat-tab').forEach(function(t){ t.addEventListener('click', function(){ setTimeout(syncMode, 0); }); });
    syncMode();
    renderProfile(); renderLive(); renderCompare();
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.__sup = {
    ings: ING, match: match, matchExact: matchExact, evaluate: evaluate, suggest: suggestFor, renderInfo: renderInfo,
    parseDose: parseDose, add: add, syncMode: syncMode,
    hasProfile: function(){ return profile.goals.length > 0; },
    getProfile: function(){ return profile; },
    setProfile: function(p){ profile = p; },
    savedCount: function(){ return saved.length; },
    onChange: function(f){ listeners.push(f); },
    TYPES: TYPES
  };
})();
