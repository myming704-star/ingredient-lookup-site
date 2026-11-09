/* ============================================================
   店內挑選（2026-11-09）：在店裡拿著保養品，輸入成分表，
   依「你的膚質＋想要的效果＋過敏問卷」直接判斷適不適合，最多比較 3 瓶。
   純前端、不呼叫 API；成分知識寫在下面 PICK_INGS。
   台灣標示規定：含量 1% 以上的成分依含量由多到少排列，所以越前面的成分影響越大。
   ============================================================ */
(function(){
  'use strict';

  /* ---------- 成分知識庫 ----------
     g：功效（保濕、修護、美白、抗老、控油、舒緩、去角質、防曬）
     fit：特別適合的膚質（dry 乾、oily 油、sensitive 敏感、acne 易長痘）
     warn：要小心的族群與原因 { dry|oily|sensitive|acne: '原因' }
     flag：對應過敏問卷的風險類別（fragrance、alcohol、acids、oil、preservative、cosmetic_dye、rosacea_general）
     n：一句白話說明 */
  var PICK_INGS = [
    // 基底、保濕
    {k:'水', a:['水','純水','去離子水','純化水','aqua','water','eau'], n:'基底，大部分保養品的第一個成分', base:1},
    {k:'甘油', a:['甘油','丙三醇','glycerin','glycerine','glycerol'], g:['保濕'], fit:['dry'], n:'最常見、最溫和的保濕成分，把水分抓在皮膚表面'},
    {k:'丁二醇', a:['丁二醇','1,3-丁二醇','butyleneglycol'], g:['保濕'], n:'溫和保濕劑，也幫助其他成分溶解'},
    {k:'丙二醇', a:['丙二醇','1,2-丙二醇','propyleneglycol'], g:['保濕'], warn:{sensitive:'少數敏感肌會刺癢'}, n:'保濕溶劑，偶爾會刺激敏感肌'},
    {k:'1,3-丙二醇', a:['1,3-丙二醇','丙烷二醇','propanediol'], g:['保濕'], n:'玉米來源的溫和保濕溶劑'},
    {k:'戊二醇', a:['戊二醇','1,2-戊二醇','pentyleneglycol'], g:['保濕'], n:'保濕，也有輔助防腐的效果'},
    {k:'1,2-己二醇', a:['1,2-己二醇','己二醇','1,2-hexanediol','hexanediol'], g:['保濕'], n:'保濕兼輔助防腐，常用來取代傳統防腐劑'},
    {k:'二丙二醇', a:['二丙二醇','dipropyleneglycol'], g:['保濕'], n:'保濕溶劑'},
    {k:'玻尿酸', a:['玻尿酸','透明質酸','透明質酸鈉','玻尿酸鈉','水解玻尿酸','水解透明質酸','hyaluronicacid','sodiumhyaluronate','hydrolyzedhyaluronicacid','乙醯化玻尿酸鈉','sodiumacetylatedhyaluronate'], g:['保濕'], fit:['dry','oily','sensitive'], n:'吸水力很強的保濕成分，清爽不油'},
    {k:'吡咯烷酮羧酸鈉', a:['吡咯烷酮羧酸鈉','pca鈉','sodiumpca'], g:['保濕'], n:'皮膚本來就有的天然保濕因子'},
    {k:'尿素', a:['尿素','urea'], g:['保濕','去角質'], fit:['dry'], warn:{sensitive:'濃度高時會刺痛'}, n:'強力保濕，也能軟化粗糙角質，適合很乾的皮膚'},
    {k:'甜菜鹼', a:['甜菜鹼','betaine'], g:['保濕','舒緩'], n:'溫和保濕，也能降低配方刺激感'},
    {k:'海藻糖', a:['海藻糖','trehalose'], g:['保濕'], n:'保水的糖類'},
    {k:'泛醇', a:['泛醇','d-泛醇','維生素b5','維他命b5','原維生素b5','panthenol','d-panthenol','dexpanthenol'], g:['保濕','修護','舒緩'], fit:['dry','sensitive'], n:'維生素 B5，保濕又幫助受損皮膚修復'},
    {k:'尿囊素', a:['尿囊素','allantoin'], g:['舒緩','修護'], fit:['sensitive'], n:'安撫、舒緩泛紅不適'},
    {k:'神經醯胺', a:['神經醯胺','神經醯胺np','神經醯胺ap','神經醯胺eop','神經醯胺ns','ceramide','ceramidenp','ceramideap','ceramideeop','ceramidens','ceramide3','ceramide1','ceramide6ii'], g:['修護','保濕'], fit:['dry','sensitive'], n:'皮膚屏障的主要成分，乾燥、敏感、脫皮的人最需要'},
    {k:'膽固醇', a:['膽固醇','cholesterol'], g:['修護'], fit:['dry','sensitive'], n:'跟神經醯胺一起補，修護皮膚屏障'},
    {k:'植物鞘氨醇', a:['植物鞘氨醇','植物鞘胺醇','phytosphingosine'], g:['修護'], fit:['sensitive'], n:'幫助屏障修護'},
    {k:'膠原蛋白', a:['膠原蛋白','水解膠原蛋白','collagen','hydrolyzedcollagen','solublecollagen'], g:['保濕'], n:'擦在皮膚上主要是保濕，分子太大，進不到皮膚裡補膠原'},
    {k:'β-葡聚醣', a:['β-葡聚醣','葡聚醣','燕麥β-葡聚醣','betaglucan','beta-glucan'], g:['舒緩','保濕'], fit:['sensitive'], n:'安撫敏感、增加保濕'},
    {k:'燕麥萃取', a:['燕麥','燕麥萃取','燕麥仁萃取','avenasativa','colloidaloatmeal'], g:['舒緩'], fit:['sensitive','dry'], n:'安撫乾癢、敏感'},
    {k:'依克多因', a:['依克多因','四氫甲基嘧啶羧酸','ectoin'], g:['舒緩','保濕'], fit:['sensitive'], n:'幫皮膚抵抗外界刺激'},
    {k:'蘆薈', a:['蘆薈','蘆薈萃取','蘆薈葉汁','aloebarbadensis','aloevera'], g:['舒緩','保濕'], n:'清爽保濕、舒緩'},
    // 油脂、潤膚
    {k:'角鯊烷', a:['角鯊烷','squalane'], g:['保濕'], fit:['dry','sensitive'], n:'輕盈的潤膚油，很少致痘'},
    {k:'辛酸/癸酸三酸甘油酯', a:['辛酸/癸酸三酸甘油酯','辛酸癸酸三酸甘油酯','辛癸酸甘油酯','caprylic/caprictriglyceride','capryliccaprictriglyceride'], g:['保濕'], n:'椰子來源的輕盈潤膚油'},
    {k:'荷荷芭油', a:['荷荷芭油','荷荷芭籽油','simmondsiachinensis','jojobaoil'], g:['保濕'], n:'質地接近皮脂、相對清爽的植物油'},
    {k:'摩洛哥堅果油', a:['摩洛哥堅果油','阿甘油','arganiaspinosa','arganoil'], g:['保濕'], fit:['dry'], n:'滋潤的植物油'},
    {k:'乳油木果脂', a:['乳油木果脂','乳油木果油','乳木果油','butyrospermumparkii','sheabutter'], g:['保濕','修護'], fit:['dry'], warn:{oily:'質地厚重，油肌擦了容易悶',acne:'比較厚重，易長痘的人可能悶出粉刺'}, n:'很滋潤的植物脂，乾肌的好朋友'},
    {k:'礦物油', a:['礦物油','液態石蠟','白礦油','mineraloil','paraffinumliquidum','paraffinoil'], g:['保濕'], fit:['dry'], warn:{oily:'封閉性強，油肌會覺得油膩'}, n:'封住水分、很少過敏，但質地偏油'},
    {k:'凡士林', a:['凡士林','礦脂','petrolatum','whitepetrolatum','矿脂'], g:['保濕','修護'], fit:['dry'], warn:{oily:'很厚重，油肌會覺得悶',acne:'封閉性高，易長痘的人斟酌'}, n:'最強的鎖水封閉成分，極乾、脫皮時好用'},
    {k:'羊毛脂', a:['羊毛脂','綿羊油','羊毛醇','lanolin','lanolinalcohol'], g:['保濕'], fit:['dry'], warn:{sensitive:'少數人會對羊毛脂過敏',acne:'比較厚重，可能悶痘'}, n:'滋潤度高的動物油脂'},
    {k:'蜂蠟', a:['蜂蠟','beeswax','ceraalba'], g:['保濕'], n:'讓質地變稠、形成保護膜'},
    {k:'椰子油', a:['椰子油','椰子果油','cocosnucifera','coconutoil'], g:['保濕'], warn:{acne:'容易堵塞毛孔，易長痘的人不建議'}, n:'滋潤，但致粉刺性偏高'},
    {k:'肉豆蔻酸異丙酯', a:['肉豆蔻酸異丙酯','isopropylmyristate'], warn:{acne:'很容易堵塞毛孔，易長痘的人避開'}, n:'讓質地好推的潤膚劑，致粉刺性高'},
    {k:'棕櫚酸異丙酯', a:['棕櫚酸異丙酯','isopropylpalmitate'], warn:{acne:'容易堵塞毛孔，易長痘的人避開'}, n:'潤膚劑，致粉刺性偏高'},
    {k:'聚二甲基矽氧烷', a:['聚二甲基矽氧烷','二甲基矽油','矽靈','dimethicone','聚二甲基矽氧烷醇','dimethiconol'], g:['保濕'], n:'矽靈，讓質地滑順、形成薄膜，一般膚質都可以'},
    {k:'環五聚二甲基矽氧烷', a:['環五聚二甲基矽氧烷','環狀矽靈','cyclopentasiloxane','cyclomethicone'], n:'揮發性矽靈，讓擦起來清爽不黏'},
    {k:'鯨蠟硬脂醇', a:['鯨蠟硬脂醇','十六十八醇','cetearylalcohol','cetostearylalcohol'], n:'「脂肪醇」，讓乳液變稠，跟會乾的酒精不一樣，不用擔心'},
    {k:'鯨蠟醇', a:['鯨蠟醇','十六醇','cetylalcohol'], n:'脂肪醇，讓質地變稠，不是會乾的酒精'},
    {k:'硬脂醇', a:['硬脂醇','十八醇','stearylalcohol'], n:'脂肪醇，增稠用，不是會乾的酒精'},
    {k:'其他脂肪醇', a:['山崳醇','behenylalcohol','花生醇','arachidylalcohol','肉豆蔻醇','myristylalcohol','異硬脂醇','isostearylalcohol','c20-22alcohols','c12-15alcohols','c14-22alcohols'], n:'脂肪醇，讓質地變稠，不是會乾的酒精'},
    {k:'聚甘油酯類', a:['聚甘油','polyglyceryl'], n:'溫和的乳化劑'},
    {k:'甘油硬脂酸酯', a:['甘油硬脂酸酯','單硬脂酸甘油酯','glycerylstearate'], n:'乳化劑，讓油和水混在一起'},
    {k:'卡波姆', a:['卡波姆','卡波莫','聚丙烯酸','carbomer'], n:'增稠劑，讓質地變成凝露或乳液狀'},
    {k:'三仙膠', a:['三仙膠','黃原膠','xanthangum'], n:'增稠劑'},
    // 美白、抗老、控油
    {k:'菸鹼醯胺', a:['菸鹼醯胺','煙醯胺','尼古丁醯胺','維生素b3','維他命b3','niacinamide','nicotinamide'], g:['美白','控油','修護','抗老'], fit:['oily','acne','dry'], warn:{sensitive:'少數敏感肌第一次用會泛紅，可先局部試'}, n:'全能型：淡斑、控油、修護屏障，大部分人都適合'},
    {k:'維生素C', a:['維生素c','維他命c','抗壞血酸','l-抗壞血酸','左旋c','左旋維他命c','ascorbicacid','l-ascorbicacid'], g:['美白','抗老'], warn:{sensitive:'偏酸，敏感肌容易刺痛'}, n:'原型維 C，美白抗氧化效果好，但不穩定也較刺激'},
    {k:'抗壞血酸葡糖苷', a:['抗壞血酸葡糖苷','維生素c葡萄糖苷','維生素c醣苷','維他命c醣苷','ascorbylglucoside'], g:['美白'], n:'溫和的維 C 衍生物'},
    {k:'乙基維生素C', a:['乙基維生素c','3-o-乙基抗壞血酸','乙基抗壞血酸','3-o-ethylascorbicacid','ethylascorbicacid'], g:['美白'], n:'穩定的維 C 衍生物'},
    {k:'抗壞血酸磷酸酯鎂', a:['抗壞血酸磷酸酯鎂','維生素c磷酸鎂','magnesiumascorbylphosphate'], g:['美白'], n:'溫和的維 C 衍生物'},
    {k:'抗壞血酸磷酸酯鈉', a:['抗壞血酸磷酸酯鈉','維生素c磷酸鈉','sodiumascorbylphosphate'], g:['美白'], fit:['acne'], n:'溫和的維 C 衍生物，對痘痘肌也友善'},
    {k:'抗壞血酸四異棕櫚酸酯', a:['抗壞血酸四異棕櫚酸酯','油溶性維生素c','ascorbyltetraisopalmitate','tetrahexyldecylascorbate'], g:['美白','抗老'], n:'油溶性維 C，比較溫和'},
    {k:'傳明酸', a:['傳明酸','凝血酸','tranexamicacid'], g:['美白'], n:'淡斑、改善暗沉，溫和'},
    {k:'熊果素', a:['熊果素','α-熊果素','阿爾法熊果素','arbutin','alpha-arbutin'], g:['美白'], n:'抑制黑色素，溫和的美白成分'},
    {k:'麴酸', a:['麴酸','曲酸','kojicacid'], g:['美白'], warn:{sensitive:'有些人會刺激、過敏'}, n:'美白成分，刺激性比熊果素高'},
    {k:'甲氧基水楊酸鉀', a:['甲氧基水楊酸鉀','4msk','potassium4-methoxysalicylate'], g:['美白'], n:'日系常見的美白成分'},
    {k:'甘草萃取', a:['甘草','甘草萃取','光果甘草','光甘草定','甘草酸二鉀','glycyrrhizaglabra','glabridin','dipotassiumglycyrrhizate'], g:['舒緩','美白'], fit:['sensitive'], n:'舒緩泛紅，也有一點淡斑效果'},
    {k:'視黃醇', a:['視黃醇','a醇','維生素a醇','維他命a醇','retinol'], g:['抗老'], warn:{sensitive:'容易脫皮、刺痛，要從低濃度、晚上用開始',dry:'可能讓皮膚更乾、脫皮'}, flag:'acids', n:'抗老效果最確定的成分，但刺激性高；孕期不建議'},
    {k:'視黃醇棕櫚酸酯', a:['視黃醇棕櫚酸酯','a酯','維生素a棕櫚酸酯','retinylpalmitate'], g:['抗老'], n:'溫和的 A 醇衍生物，效果也比較溫和'},
    {k:'羥基頻哪酮視黃酸酯', a:['羥基頻哪酮視黃酸酯','視黃酸酯','hydroxypinacoloneretinoate','granactive'], g:['抗老'], n:'較新的 A 醇類，刺激性比 A 醇低'},
    {k:'補骨脂酚', a:['補骨脂酚','bakuchiol'], g:['抗老'], fit:['sensitive'], n:'植物來源的抗老成分，比 A 醇溫和'},
    {k:'胜肽', a:['胜肽','棕櫚醯五胜肽','棕櫚醯三胜肽','乙醯基六胜肽','藍銅胜肽','銅胜肽','peptide','palmitoylpentapeptide','palmitoyltripeptide','acetylhexapeptide','coppertripeptide','argireline','matrixyl'], g:['抗老'], n:'抗老成分，溫和'},
    {k:'腺苷', a:['腺苷','adenosine'], g:['抗老'], n:'韓系常見的抗皺成分，溫和'},
    {k:'輔酶Q10', a:['輔酶q10','泛醌','ubiquinone','coenzymeq10'], g:['抗老'], n:'抗氧化'},
    {k:'維生素E', a:['維生素e','維他命e','生育酚','生育酚醋酸酯','維生素e醋酸酯','tocopherol','tocopherylacetate'], g:['抗老','保濕'], n:'抗氧化，也保護配方不變質'},
    {k:'綠茶萃取', a:['綠茶','綠茶萃取','茶葉萃取','camelliasinensis','greentea'], g:['抗老','舒緩'], n:'抗氧化、舒緩'},
    {k:'積雪草', a:['積雪草','積雪草萃取','雷公根','羥基積雪草苷','積雪草苷','積雪草酸','centellaasiatica','madecassoside','asiaticoside','cica'], g:['舒緩','修護'], fit:['sensitive','acne'], n:'韓系「CICA」成分，舒緩泛紅、幫助修復'},
    {k:'紅沒藥醇', a:['紅沒藥醇','沒藥醇','bisabolol'], g:['舒緩'], fit:['sensitive'], n:'洋甘菊裡的舒緩成分'},
    {k:'吡咯烷酮羧酸鋅', a:['吡咯烷酮羧酸鋅','pca鋅','zincpca'], g:['控油'], fit:['oily','acne'], n:'調理油脂分泌'},
    // 去角質酸類
    {k:'水楊酸', a:['水楊酸','bha','柳酸','salicylicacid'], g:['控油','去角質'], fit:['oily','acne'], warn:{dry:'會讓乾肌更乾',sensitive:'容易刺痛'}, flag:'acids', n:'能進毛孔的酸，改善粉刺、出油'},
    {k:'甘醇酸', a:['甘醇酸','乙醇酸','glycolicacid'], g:['去角質','美白'], warn:{sensitive:'刺激性較高，容易刺痛泛紅'}, flag:'acids', n:'果酸，代謝老廢角質、讓膚色變亮'},
    {k:'乳酸', a:['乳酸','lacticacid'], g:['去角質','保濕'], warn:{sensitive:'濃度高時會刺痛'}, flag:'acids', n:'溫和一點的果酸，兼具保濕'},
    {k:'杏仁酸', a:['杏仁酸','mandelicacid'], g:['去角質'], fit:['acne'], flag:'acids', n:'分子大、比較溫和的果酸'},
    {k:'葡萄糖酸內酯', a:['葡萄糖酸內酯','pha','gluconolactone','乳糖酸','lactobionicacid'], g:['去角質','保濕'], fit:['sensitive'], n:'PHA，最溫和的酸類，敏感肌也能試'},
    {k:'壬二酸', a:['壬二酸','杜鵑花酸','azelaicacid'], g:['美白','控油'], fit:['acne'], warn:{sensitive:'剛開始用可能刺癢'}, n:'改善痘痘、泛紅與痘疤'},
    // 防曬劑
    {k:'氧化鋅', a:['氧化鋅','zincoxide'], g:['防曬'], fit:['sensitive'], n:'物理性防曬，溫和，敏感肌適合'},
    {k:'二氧化鈦', a:['二氧化鈦','titaniumdioxide','ci77891'], g:['防曬'], fit:['sensitive'], n:'物理性防曬，溫和'},
    {k:'甲氧基肉桂酸乙基己酯', a:['甲氧基肉桂酸乙基己酯','甲氧基肉桂酸辛酯','桂皮酸鹽','ethylhexylmethoxycinnamate','octinoxate','octylmethoxycinnamate'], g:['防曬'], warn:{sensitive:'化學性防曬，少數人會刺激'}, n:'常見的化學性防曬劑（UVB）'},
    {k:'阿伏苯宗', a:['阿伏苯宗','丁基甲氧基二苯甲醯基甲烷','avobenzone','butylmethoxydibenzoylmethane'], g:['防曬'], n:'化學性防曬劑（UVA）'},
    {k:'奧克立林', a:['奧克立林','氰雙苯丙烯酸辛酯','octocrylene'], g:['防曬'], warn:{sensitive:'偶爾引起過敏'}, n:'化學性防曬劑'},
    {k:'二苯甲酮-3', a:['二苯甲酮-3','羥苯甲酮','oxybenzone','benzophenone-3'], g:['防曬'], warn:{sensitive:'比較容易過敏的防曬劑'}, n:'化學性防曬劑，致敏性較高'},
    {k:'Tinosorb S', a:['雙-乙基己氧苯酚甲氧苯基三嗪','tinosorbs','bemotrizinol','bis-ethylhexyloxyphenolmethoxyphenyltriazine'], g:['防曬'], n:'新一代廣效防曬劑，穩定溫和'},
    // 要注意的：香料、酒精、精油、防腐劑、色素
    {k:'香料', a:['香料','香精','香味','parfum','fragrance','aroma'], warn:{sensitive:'最常見的過敏來源之一'}, flag:'fragrance', n:'讓味道好聞，但對皮膚沒有好處，敏感肌最好避開'},
    {k:'芳樟醇', a:['芳樟醇','沉香醇','linalool'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分，被列為常見過敏原'},
    {k:'檸檬烯', a:['檸檬烯','苧烯','limonene'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分，被列為常見過敏原'},
    {k:'香茅醇', a:['香茅醇','citronellol'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分'},
    {k:'香葉醇', a:['香葉醇','牻牛兒醇','geraniol'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分'},
    {k:'丁香酚', a:['丁香酚','eugenol'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分'},
    {k:'香豆素', a:['香豆素','coumarin'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分'},
    {k:'檸檬醛', a:['檸檬醛','citral'], warn:{sensitive:'香料過敏原'}, flag:'fragrance', n:'香料成分'},
    {k:'酒精', a:['酒精','乙醇','變性酒精','alcohol','alcoholdenat','alcoholdenat.','sdalcohol','ethanol','ethylalcohol'], warn:{dry:'會帶走水分，越用越乾',sensitive:'容易刺痛'}, flag:'alcohol', n:'讓擦起來清爽、快乾，排在前面時乾肌和敏感肌要小心'},
    {k:'薄荷醇', a:['薄荷醇','薄荷腦','menthol'], warn:{sensitive:'涼感會刺激泛紅'}, flag:'rosacea_general', n:'帶來涼感，對敏感肌是刺激'},
    {k:'植物精油', a:['精油','薰衣草油','薰衣草精油','茶樹油','茶樹精油','檸檬果皮油','甜橙果皮油','佛手柑油','薄荷油','胡椒薄荷油','尤加利油','迷迭香油','lavandulaangustifoliaoil','lavenderoil','melaleucaalternifolialeafoil','teatreeoil','citruslimonpeeloil','citrusaurantiumdulcispeeloil','citrusaurantiumbergamiafruitoil','peppermintoil','menthapiperitaoil','eucalyptusglobulusleafoil','rosmarinusofficinalisleafoil','essentialoil'], warn:{sensitive:'精油是常見的接觸性過敏原'}, flag:'oil', n:'天然不等於溫和，精油容易刺激敏感肌'},
    {k:'苯甲醇', a:['苯甲醇','苄醇','benzylalcohol'], warn:{sensitive:'少數人會過敏'}, flag:'fragrance', n:'防腐兼香料成分，被列為香料過敏原'},
    {k:'苯乙醇', a:['苯乙醇','phenethylalcohol'], n:'帶玫瑰香味的防腐輔助成分'},
    {k:'苯氧乙醇', a:['苯氧乙醇','phenoxyethanol'], n:'最常見的防腐劑，正常濃度下刺激性低'},
    {k:'乙基己基甘油', a:['乙基己基甘油','ethylhexylglycerin'], n:'保濕兼輔助防腐'},
    {k:'對羥基苯甲酸酯', a:['對羥基苯甲酸甲酯','對羥基苯甲酸乙酯','對羥基苯甲酸丙酯','對羥基苯甲酸丁酯','羥苯甲酯','羥苯乙酯','羥苯丙酯','羥苯丁酯','paraben','methylparaben','ethylparaben','propylparaben','butylparaben'], warn:{sensitive:'少數人會過敏'}, flag:'preservative', n:'Paraben 防腐劑，合法濃度下安全，對 Paraben 過敏的人才需要避開'},
    {k:'甲基異噻唑啉酮', a:['甲基異噻唑啉酮','甲基氯異噻唑啉酮','methylisothiazolinone','methylchloroisothiazolinone','mit','mci'], warn:{sensitive:'致敏性很高的防腐劑'}, flag:'preservative', n:'MIT／MCI 防腐劑，是出名的過敏原，敏感肌一定要避開'},
    {k:'DMDM乙內醯脲', a:['dmdm乙內醯脲','dmdmhydantoin','咪唑烷基脲','imidazolidinylurea','重氮咪唑烷基脲','diazolidinylurea'], warn:{sensitive:'會釋放微量甲醛，敏感肌避開'}, flag:'preservative', n:'甲醛釋放型防腐劑'},
    {k:'氯苯甘醚', a:['氯苯甘醚','chlorphenesin'], n:'防腐劑'},
    {k:'月桂醇硫酸酯鈉', a:['月桂醇硫酸酯鈉','月桂基硫酸鈉','sls','sodiumlaurylsulfate'], warn:{dry:'清潔力強，會帶走油脂',sensitive:'刺激性高'}, n:'強力清潔劑，出現在乳液裡不常見'},
    {k:'色素', a:['色素','著色劑','ci','ci15985','ci19140','ci42090','ci14700','ci17200','ci16035','red40','yellow5','blue1'], warn:{sensitive:'色料可能引起過敏'}, flag:'cosmetic_dye', n:'讓顏色好看，對皮膚沒有幫助'}
  ];

  var GOALS = ['保濕','修護','美白','抗老','控油','舒緩','去角質','防曬'];
  var SKIN = [{v:'dry',t:'乾性'},{v:'normal',t:'中性'},{v:'combo',t:'混合性'},{v:'oily',t:'油性'}];
  var TYPES = ['乳液','乳霜','化妝水','精華液','凝露','防曬乳','其他（彩妝等）'];
  var FLAG_TEXT = { fragrance:'香料', alcohol:'酒精', acids:'酸類／A 醇', oil:'植物精油', preservative:'特定防腐劑', cosmetic_dye:'色素', rosacea_general:'酒精、薄荷、酸類' };

  /* ---------- 小工具 ---------- */
  function $(id){ return document.getElementById(id); }
  function mk(tag, cls, text){ var e = document.createElement(tag); if(cls){ e.className = cls; } if(text != null){ e.textContent = text; } return e; }
  function store(k, v){ try{ if(v === undefined){ return JSON.parse(localStorage.getItem(k) || 'null'); } localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
  function norm(s){ return String(s).toLowerCase().replace(/[\s　·・．。\.'"’()（）\[\]【】]/g, '').replace(/[ⅰ-ⅻ]/g, ''); }

  var ALIAS = [];
  PICK_INGS.forEach(function(ing, i){ ing.a.forEach(function(a){ ALIAS.push({ n: norm(a), i: i, raw: a }); }); });
  // 研究簡稱與代號（NAM、SA、TXA、CI 77891…，資料在 codes.js）也當成別名
  (window.INGREDIENT_CODES || []).forEach(function(c){
    if(!c.pk){ return; }
    var i = -1;
    for(var x = 0; x < PICK_INGS.length; x++){ if(PICK_INGS[x].k === c.pk){ i = x; break; } }
    if(i < 0){ return; }
    [c.c].concat(c.alt).forEach(function(a){
      var n = norm(a);
      ALIAS.push({ n: n, i: i, raw: a, code: 1 });
      if(n.indexOf('-') !== -1){ ALIAS.push({ n: n.replace(/-/g, ''), i: i, raw: a, code: 1 }); }
    });
  });
  ALIAS.sort(function(x, y){ return y.n.length - x.n.length; });

  /* 比對：完全相同優先，再找「這個成分名稱裡含有的最長別名」 */
  function match(token){
    var t = norm(token);
    if(!t){ return null; }
    for(var j = 0; j < ALIAS.length; j++){ if(ALIAS[j].n === t){ return PICK_INGS[ALIAS[j].i]; } }
    var byCode = matchCode(token);
    if(byCode){ return byCode; }
    for(j = 0; j < ALIAS.length; j++){
      var a = ALIAS[j].n;
      if(a.length < 2){ continue; }
      // 太短的英文別名（mit、bha、ci…）只接受完全相同，避免誤判
      if(/^[a-z0-9\-]+$/.test(a) && a.length <= 4){ continue; }
      if(t.indexOf(a) !== -1){ return PICK_INGS[ALIAS[j].i]; }
    }
    return null;
  }
  /* 代號（E330、CI 77891、VC…）：有對應成分就用那個成分，沒有就當一般成分顯示代號名稱 */
  var CODE_ING = {};
  function matchCode(token){
    if(typeof window.lookupCode !== 'function'){ return null; }
    var hits = window.lookupCode(token);
    if(!hits.length){ return null; }
    // 同一個縮寫有多種意思時，店內挑選優先用保養品、化妝品的意思
    var c = hits.filter(function(h){ return h.pk; })[0] || hits.filter(function(h){ return /[kc]/.test(h.at); })[0] || hits[0];
    if(c.pk){
      for(var i = 0; i < PICK_INGS.length; i++){ if(PICK_INGS[i].k === c.pk){ return PICK_INGS[i]; } }
    }
    if(!CODE_ING[c.c]){
      CODE_ING[c.c] = { k: c.zh + '（' + c.c + '）', a: [], n: c.n, warn: c.w ? { sensitive: c.w } : undefined };
    }
    return CODE_ING[c.c];
  }
  function splitTokens(raw){
    return raw.split(/[,，、;；\n\r\/／]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s; });
  }

  /* ---------- 狀態 ---------- */
  var profile = store('mm_pick_profile') || { skin:'', sensitive:false, acne:false, goals:['保濕'] };
  var saved = store('mm_pick_saved') || [];
  function allergyFlags(){ return store('mm_allergy_flags') || []; }

  /* ---------- 評估 ---------- */
  function evaluate(tokens){
    var flags = allergyFlags();
    var items = [];
    var good = [], bad = [], neutral = [], unknown = [];
    var score = 0;
    var hitGoals = {};
    tokens.forEach(function(tok, pos){
      var ing = match(tok);
      if(!ing){ unknown.push(tok); return; }
      if(items.some(function(x){ return x.ing === ing; })){ return; }
      // 越前面的成分份量越多：前 5 個全算、6～10 個算 6 成、之後算 3 成
      var w = pos < 5 ? 1 : (pos < 10 ? 0.6 : 0.3);
      var reasons = [], warns = [];
      (ing.g || []).forEach(function(g){ if(profile.goals.indexOf(g) !== -1){ reasons.push('有你想要的「' + g + '」效果'); hitGoals[g] = true; } });
      var fit = ing.fit || [];
      if(profile.skin === 'dry' && fit.indexOf('dry') !== -1){ reasons.push('適合乾性肌'); }
      if((profile.skin === 'oily' || profile.skin === 'combo') && fit.indexOf('oily') !== -1){ reasons.push('適合出油的肌膚'); }
      if(profile.sensitive && fit.indexOf('sensitive') !== -1){ reasons.push('對敏感肌友善'); }
      if(profile.acne && fit.indexOf('acne') !== -1){ reasons.push('對痘痘肌有幫助'); }
      var wn = ing.warn || {};
      if(profile.skin === 'dry' && wn.dry){ warns.push(wn.dry); }
      if((profile.skin === 'oily' || profile.skin === 'combo') && wn.oily){ warns.push(wn.oily); }
      if(profile.sensitive && wn.sensitive){ warns.push(wn.sensitive); }
      if(profile.acne && wn.acne){ warns.push(wn.acne); }
      if(ing.flag && flags.indexOf(ing.flag) !== -1){ warns.unshift('你的過敏問卷勾了「' + (FLAG_TEXT[ing.flag] || ing.flag) + '」'); }
      // 過敏類成分就算排很後面，份量少也可能引起反應，最少算 7 成
      var ww = ing.flag ? Math.max(w, 0.7) : w;
      var entry = { tok: tok, ing: ing, pos: pos, reasons: reasons, warns: warns };
      items.push(entry);
      if(warns.length){ bad.push(entry); score -= 3 * ww * Math.min(2, warns.length); }
      else if(reasons.length){ good.push(entry); score += (reasons.length > 1 ? 2.5 : 1.8) * w; }
      else { neutral.push(entry); }
    });
    var missing = profile.goals.filter(function(g){ return !hitGoals[g]; });
    var pct = Math.round(Math.max(10, Math.min(100, 55 + score * 6 - missing.length * 4)));
    if(!good.length && !bad.length){ pct = Math.min(pct, 55); }
    // 碰到過敏問卷勾過的成分，最多只給「普通」；要小心的有 2 個以上，最多「可以考慮」
    if(bad.some(function(e){ return e.warns[0] && e.warns[0].indexOf('過敏問卷') !== -1; })){ pct = Math.min(pct, 58); }
    if(bad.length >= 2){ pct = Math.min(pct, 70); }
    var verdict = pct >= 80 ? '很適合你' : pct >= 62 ? '可以考慮' : pct >= 45 ? '普通，沒有特別適合' : '不太建議';
    var tone = pct >= 80 ? 'ok' : pct >= 62 ? 'mid' : pct >= 45 ? 'meh' : 'no';
    return { pct: pct, verdict: verdict, tone: tone, good: good, bad: bad, neutral: neutral, unknown: unknown, missing: missing, count: tokens.length, matched: items.length };
  }

  function summaryLine(r){
    var parts = [];
    if(r.good.length){ parts.push('有 ' + r.good.length + ' 個對你有幫助的成分'); }
    if(r.bad.length){ parts.push(r.bad.length + ' 個要小心'); }
    var s = parts.length ? parts.join('、') + '。' : '沒有找到特別適合或要小心的成分。';
    if(r.missing.length && r.missing.length < profile.goals.length){ s += '沒看到你想要的「' + r.missing.join('、') + '」相關成分。'; }
    if(r.missing.length === profile.goals.length && profile.goals.length){ s += '這瓶的主要成分跟你想要的效果（' + profile.goals.join('、') + '）沒什麼關係。'; }
    return s;
  }

  /* ---------- 畫面 ---------- */
  function profileText(){
    var sk = SKIN.find(function(s){ return s.v === profile.skin; });
    var t = [sk ? sk.t : '還沒選膚質'];
    if(profile.sensitive){ t.push('容易敏感'); }
    if(profile.acne){ t.push('容易長痘'); }
    t.push('想要：' + (profile.goals.length ? profile.goals.join('、') : '未選'));
    var f = allergyFlags();
    if(f.length){ t.push('避開：' + f.map(function(x){ return FLAG_TEXT[x] || x; }).join('、')); }
    return t.join('｜');
  }

  function renderProfile(){
    var box = $('pick-profile');
    if(!profile.skin){ box.dataset.open = '1'; }
    var open = box.dataset.open === '1';
    box.innerHTML = '';
    var head = mk('div', 'pick-prof-head');
    head.appendChild(mk('span', 'pick-step', '1'));
    var ht = mk('div', 'pick-prof-title');
    ht.appendChild(mk('b', null, '我的肌膚'));
    ht.appendChild(mk('span', 'pick-prof-sum', profileText()));
    head.appendChild(ht);
    if(profile.skin){
      var eb = mk('button', 'pick-link', open ? '收起' : '修改');
      eb.type = 'button';
      eb.addEventListener('click', function(){ box.dataset.open = open ? '' : '1'; renderProfile(); });
      head.appendChild(eb);
    }
    box.appendChild(head);
    if(!open){ return; }

    var body = mk('div', 'pick-prof-body');
    body.appendChild(mk('p', 'adv-label', '膚質'));
    var sk = mk('div', 'pick-chips');
    SKIN.forEach(function(s){
      var b = mk('button', 'pick-chip' + (profile.skin === s.v ? ' on' : ''), s.t);
      b.type = 'button'; b.setAttribute('aria-pressed', String(profile.skin === s.v));
      b.addEventListener('click', function(){ profile.skin = s.v; saveProfile(); });
      sk.appendChild(b);
    });
    body.appendChild(sk);

    var ex = mk('div', 'pick-chips');
    [['sensitive','容易敏感、泛紅、刺痛'],['acne','容易長痘痘、粉刺']].forEach(function(p){
      var b = mk('button', 'pick-chip' + (profile[p[0]] ? ' on' : ''), (profile[p[0]] ? '✓ ' : '') + p[1]);
      b.type = 'button'; b.setAttribute('aria-pressed', String(!!profile[p[0]]));
      b.addEventListener('click', function(){ profile[p[0]] = !profile[p[0]]; saveProfile(); });
      ex.appendChild(b);
    });
    body.appendChild(ex);

    body.appendChild(mk('p', 'adv-label', '想要的效果（可複選）'));
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
    var f = allergyFlags();
    body.appendChild(mk('p', 'pick-hint', f.length ? '已自動帶入你的過敏問卷：' + f.map(function(x){ return FLAG_TEXT[x] || x; }).join('、') + '。' : '還沒填過敏問卷。填了之後，你會過敏的成分會直接標紅色（頁面上方「填寫問卷」）。'));
    if(profile.skin){
      var done = mk('button', 'btn btn-primary', '設定好了');
      done.type = 'button'; done.style.marginTop = '10px';
      done.addEventListener('click', function(){ box.dataset.open = ''; renderProfile(); var i = $('pick-input'); if(i){ i.focus(); } });
      body.appendChild(done);
    }
    box.appendChild(body);
  }
  function saveProfile(){ store('mm_pick_profile', profile); renderProfile(); renderLive(); if(lastResult){ runPick(true); } renderCompare(); }

  /* 打字建議：完全相同 → 開頭相同（英文前幾個字母、簡稱）→ 中間含有 */
  function suggestFor(text, max){
    var q = norm(text);
    if(!q){ return []; }
    var ascii = /^[a-z0-9\-,]+$/.test(q);
    if(ascii && q.length < 2){ return []; }
    var best = {};
    ALIAS.forEach(function(a){
      var sc = a.n === q ? 0 : a.n.indexOf(q) === 0 ? 1 : (q.length >= (ascii ? 4 : 1) && a.n.indexOf(q) !== -1) ? 2 : -1;
      if(sc < 0){ return; }
      var ing = PICK_INGS[a.i], cur = best[ing.k];
      if(!cur || sc < cur.sc || (sc === cur.sc && a.n.length < norm(cur.raw).length)){ best[ing.k] = { ing: ing, sc: sc, raw: a.raw }; }
    });
    return Object.keys(best).map(function(k){ return best[k]; })
      .sort(function(x, y){ return x.sc - y.sc || norm(x.raw).length - norm(y.raw).length; })
      .slice(0, max || 8);
  }

  /* 單一成分說明卡（給「依成分查詢」查不到完整資料時用） */
  var FIT_TEXT = { dry:'乾性肌', oily:'油性肌', sensitive:'敏感肌', acne:'痘痘肌' };
  function renderInfo(container, ing, typed){
    container.textContent = '';
    var card = mk('div', 'code-card');
    var top = mk('div', 'code-card-top');
    top.appendChild(mk('span', 'code-type', '🧴 保養品成分'));
    if(typed && norm(typed) !== norm(ing.k)){ top.appendChild(mk('span', 'code-badge mono', typed)); }
    card.appendChild(top);
    card.appendChild(mk('div', 'code-card-name', ing.k));
    var d = mk('div', 'code-detail');
    if(ing.g && ing.g.length){ d.appendChild(mk('div', 'code-detail-use', '功效：' + ing.g.join('、'))); }
    d.appendChild(mk('p', 'code-detail-note', ing.n));
    if(ing.fit && ing.fit.length){ d.appendChild(mk('div', 'code-detail-where', '特別適合：' + ing.fit.map(function(f){ return FIT_TEXT[f]; }).join('、'))); }
    var en = (ing.a || []).filter(function(a){ return /^[a-z0-9 ,.\-\/]+$/i.test(a) && a.length > 4; })[0];
    if(en){ d.appendChild(mk('div', 'code-detail-en mono', en)); }
    var w = ing.warn || {};
    Object.keys(w).forEach(function(k){ d.appendChild(mk('p', 'code-warn', '⚠️ ' + (FIT_TEXT[k] || k) + '：' + w[k])); });
    card.appendChild(d);
    container.appendChild(card);
    container.appendChild(mk('p', 'code-foot', '想知道這瓶整體適不適合你，到「🛒 店內挑選」把成分表打進去。'));
  }

  /* 輸入時即時把認得的成分標顏色，並提示可能的成分名稱 */
  function renderLive(){
    var input = $('pick-input'), live = $('pick-live'), sug = $('pick-suggest');
    if(!input){ return; }
    var tokens = splitTokens(input.value);
    live.innerHTML = '';
    tokens.forEach(function(tok){
      var ing = match(tok);
      var r = ing ? evaluate([tok]) : null;
      var cls = !ing ? 'unk' : (r.bad.length ? 'bad' : r.good.length ? 'good' : 'neu');
      var c = mk('span', 'pick-tag ' + cls, ing ? (ing.k === tok ? tok : tok + '→' + ing.k) : tok + '？');
      live.appendChild(c);
    });
    // 建議：最後一段正在打的字
    sug.innerHTML = '';
    var last = input.value.split(/[,，、;；\n\r\/／]/).pop().trim();
    var q = norm(last);
    if(q.length >= 1 && !/[,，、]\s*$/.test(input.value)){
      var list = suggestFor(last, 8);
      if(list.length && !(list.length === 1 && norm(list[0].ing.k) === q)){
        list.forEach(function(it){
          var ing = it.ing;
          var b = mk('button', 'pick-sug', ing.k);
          if(it.raw && norm(it.raw) !== norm(ing.k)){ b.appendChild(mk('small', 'pick-sug-sub', it.raw)); }
          b.type = 'button';
          b.addEventListener('click', function(){
            var v = input.value, idx = Math.max(v.lastIndexOf(','), v.lastIndexOf('，'), v.lastIndexOf('、'), v.lastIndexOf('\n'));
            input.value = (idx >= 0 ? v.slice(0, idx + 1) : '') + ing.k + '、';
            input.focus(); renderLive();
          });
          sug.appendChild(b);
        });
      }
    }
  }

  var lastResult = null;
  function runPick(quiet){
    var raw = $('pick-input').value;
    var err = $('pick-error');
    err.hidden = true;
    var tokens = splitTokens(raw);
    if(!profile.skin){ err.textContent = '先在上面選你的膚質，才知道適不適合你。'; err.hidden = false; $('pick-profile').dataset.open = '1'; renderProfile(); return; }
    if(tokens.length < 2){ if(!quiet){ err.textContent = '至少輸入 2 個成分，用逗號或頓號隔開。前 5～8 個最重要。'; err.hidden = false; } return; }
    lastResult = { tokens: tokens, name: $('pick-name').value.trim(), type: $('pick-type').value, r: evaluate(tokens) };
    renderResult();
    if(!quiet){ $('pick-result').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function ingRow(e, kind){
    var li = mk('li', 'pick-row ' + kind);
    var top = mk('div', 'pick-row-top');
    top.appendChild(mk('b', null, e.ing.k));
    if(norm(e.tok) !== norm(e.ing.k)){ top.appendChild(mk('span', 'pick-orig', e.tok)); }
    top.appendChild(mk('span', 'pick-pos', '第 ' + (e.pos + 1) + ' 個'));
    li.appendChild(top);
    var msg = kind === 'bad' ? e.warns.join('；') : kind === 'good' ? e.reasons.join('、') : '';
    if(msg){ li.appendChild(mk('p', 'pick-why', msg)); }
    li.appendChild(mk('p', 'pick-note', e.ing.n));
    return li;
  }

  function renderResult(){
    var box = $('pick-result');
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
    ht.appendChild(mk('p', 'pick-name-out', (lastResult.name || '這瓶' + lastResult.type) + ' 適合度'));
    ht.appendChild(mk('p', 'pick-verdict', r.verdict));
    ht.appendChild(mk('p', 'pick-sum', summaryLine(r)));
    head.appendChild(ht);
    box.appendChild(head);

    function block(title, list, kind, emptyText){
      var sec = mk('div', 'pick-sec');
      sec.appendChild(mk('p', 'pick-sec-title ' + kind, title + '（' + list.length + '）'));
      if(!list.length){ sec.appendChild(mk('p', 'pick-empty', emptyText)); return sec; }
      var ul = mk('ul', 'pick-list');
      list.forEach(function(e){ ul.appendChild(ingRow(e, kind)); });
      sec.appendChild(ul);
      return sec;
    }
    box.appendChild(block('🟢 對你有幫助', r.good, 'good', '前面幾個成分裡，沒有特別針對你需求的成分。'));
    box.appendChild(block('🔴 你要小心', r.bad, 'bad', '沒有發現你要避開的成分。'));
    if(r.neutral.length){
      var d = mk('details', 'pick-more');
      d.appendChild(mk('summary', null, '⚪ 其他成分（' + r.neutral.length + '）：基底、增稠、防腐等，沒有特別影響'));
      var ul = mk('ul', 'pick-list');
      r.neutral.forEach(function(e){ ul.appendChild(ingRow(e, 'neu')); });
      d.appendChild(ul);
      box.appendChild(d);
    }
    if(r.unknown.length){ box.appendChild(mk('p', 'pick-hint', '資料庫裡沒有、沒列入判斷的：' + r.unknown.join('、') + '。多半是植物萃取或少量添加物，影響通常不大；擔心的話可以拍下來回家查。')); }
    var tip = typeTip(lastResult.type);
    if(tip){ box.appendChild(mk('p', 'pick-hint', tip)); }

    var act = mk('div', 'pick-actions');
    var sv = mk('button', 'btn btn-primary', saved.length >= 3 ? '已存 3 瓶（先刪一瓶）' : '存起來，跟其他瓶比較');
    sv.type = 'button'; sv.disabled = saved.length >= 3;
    sv.addEventListener('click', function(){
      if(saved.length >= 3){ return; }
      saved.push({ name: lastResult.name || ('第 ' + (saved.length + 1) + ' 瓶'), type: lastResult.type, tokens: lastResult.tokens, at: Date.now() });
      store('mm_pick_saved', saved);
      $('pick-input').value = ''; $('pick-name').value = '';
      lastResult = null; renderLive(); renderResult(); renderCompare();
      $('pick-compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    act.appendChild(sv);
    box.appendChild(act);
    box.appendChild(mk('p', 'db-note', '依成分特性與你填的膚況做的一般性判斷，不是醫療建議；第一次用新產品，先擦在耳後或手腕內側試 1～2 天。'));
  }

  function typeTip(t){
    if(t === '乳霜' && (profile.skin === 'oily' || profile.skin === 'combo')){ return '乳霜通常比乳液厚重，油性、混合肌可以只擦在乾燥的地方，或改挑乳液、凝露。'; }
    if(t === '化妝水' && profile.skin === 'dry'){ return '化妝水保濕力有限，乾性肌後面記得再擦乳液或乳霜鎖水。'; }
    if(t === '凝露' && profile.skin === 'dry'){ return '凝露偏清爽，乾性肌在冬天可能不夠滋潤。'; }
    if(t === '防曬乳' && profile.goals.indexOf('防曬') === -1){ return '防曬乳要看 SPF 和 PA：日常通勤 SPF30、PA+++ 就夠，戶外活動再選更高的。'; }
    return '';
  }

  function renderCompare(){
    var box = $('pick-compare');
    box.innerHTML = '';
    if(!saved.length){ box.hidden = true; return; }
    box.hidden = false;
    box.appendChild(mk('p', 'pick-cmp-title', '比較（' + saved.length + ' / 3 瓶）'));
    var rows = saved.map(function(s){ return { s: s, r: evaluate(s.tokens) }; });
    var best = rows.slice().sort(function(a, b){ return b.r.pct - a.r.pct; })[0];
    if(rows.length >= 2){
      var tie = rows.filter(function(x){ return x.r.pct === best.r.pct; }).length > 1;
      box.appendChild(mk('p', 'pick-best', tie ? '有幾瓶分數一樣，看下面哪瓶「要小心」比較少。' : '以你的膚況來看，最推薦「' + best.s.name + '」（' + best.r.pct + ' 分）。'));
    } else {
      box.appendChild(mk('p', 'pick-hint', '再評估一瓶並存起來，就會幫你比較。'));
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
      var row = mk('div', 'pick-cmp-actions');
      var ed = mk('button', 'pick-link', '看詳細');
      ed.type = 'button';
      ed.addEventListener('click', function(){ $('pick-name').value = x.s.name; $('pick-type').value = x.s.type; $('pick-input').value = x.s.tokens.join('、'); renderLive(); runPick(); });
      var del = mk('button', 'pick-link', '刪除');
      del.type = 'button';
      del.addEventListener('click', function(){ saved.splice(i, 1); store('mm_pick_saved', saved); renderCompare(); if(lastResult){ renderResult(); } });
      row.appendChild(ed); row.appendChild(del);
      c.appendChild(row);
      grid.appendChild(c);
    });
    box.appendChild(grid);
    var clr = mk('button', 'pick-link', '全部清掉，挑下一種商品');
    clr.type = 'button';
    clr.addEventListener('click', function(){ saved = []; store('mm_pick_saved', saved); renderCompare(); if(lastResult){ renderResult(); } });
    box.appendChild(clr);
  }

  function init(){
    if(!$('pick-mode')){ return; }
    var sel = $('pick-type');
    TYPES.forEach(function(t){ var o = mk('option', null, t); o.value = t; sel.appendChild(o); });
    var lastType = store('mm_pick_type'); if(lastType){ sel.value = lastType; }
    sel.addEventListener('change', function(){ store('mm_pick_type', sel.value); if(lastResult){ lastResult.type = sel.value; renderResult(); } });
    $('pick-input').addEventListener('input', renderLive);
    $('pick-btn').addEventListener('click', function(){ runPick(); });
    $('pick-clear').addEventListener('click', function(){ $('pick-input').value = ''; $('pick-name').value = ''; lastResult = null; renderLive(); renderResult(); $('pick-input').focus(); });
    // 過敏問卷存檔後，重新帶入
    window.addEventListener('storage', function(){ renderProfile(); });
    document.addEventListener('click', function(e){ if(e.target && /allergy|q[1-4]/.test(e.target.id || e.target.name || '')){ setTimeout(renderProfile, 50); } });
    renderProfile(); renderLive(); renderCompare();
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }

  // 給測試用
  function matchExact(token){
    var t = norm(token);
    for(var j = 0; j < ALIAS.length; j++){ if(ALIAS[j].n === t){ return PICK_INGS[ALIAS[j].i]; } }
    return null;
  }
  function addToCompare(name, type, tokens){
    if(saved.length >= 3){ return false; }
    saved.push({ name: name || ('第 ' + (saved.length + 1) + ' 瓶'), type: TYPES.indexOf(type) !== -1 ? type : TYPES[0], tokens: tokens.slice(), at: Date.now() });
    store('mm_pick_saved', saved);
    renderCompare(); if(lastResult){ renderResult(); }
    return true;
  }
  window.__pick = { match: match, matchExact: matchExact, suggest: suggestFor, renderInfo: renderInfo, ings: PICK_INGS, evaluate: evaluate,
    add: addToCompare, savedCount: function(){ return saved.length; },
    hasProfile: function(){ return !!profile.skin; }, getProfile: function(){ return profile; },
    setProfile: function(p){ profile = p; }, TYPES: TYPES };
})();
