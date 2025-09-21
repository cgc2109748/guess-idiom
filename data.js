const idioms = [
  {
    "idiom": "一心一意",
    "pinyin": "yi xin yi yi",
    "wrong_pinyin": "yi xin yi yi"
  },
  {
    "idiom": "三心二意",
    "pinyin": "san xin er yi",
    "wrong_pinyin": "san xin er yi"
  },
  {
    "idiom": "四面八方",
    "pinyin": "si mian ba fang",
    "wrong_pinyin": "si mian ba fang"
  },
  {
    "idiom": "五光十色",
    "pinyin": "wu guang shi se",
    "wrong_pinyin": "wu guang shi she"
  },
  {
    "idiom": "六神无主",
    "pinyin": "liu shen wu zhu",
    "wrong_pinyin": "liu shen wu zhu"
  },
  {
    "idiom": "七上八下",
    "pinyin": "qi shang ba xia",
    "wrong_pinyin": "qi shang ba xia"
  },
  {
    "idiom": "八仙过海",
    "pinyin": "ba xian guo hai",
    "wrong_pinyin": "ba xian guo hai"
  },
  {
    "idiom": "九牛一毛",
    "pinyin": "jiu niu yi mao",
    "wrong_pinyin": "jiu niu yi mao"
  },
  {
    "idiom": "十全十美",
    "pinyin": "shi quan shi mei",
    "wrong_pinyin": "shi quan shi mei"
  },
  {
    "idiom": "百发百中",
    "pinyin": "bai fa bai zhong",
    "wrong_pinyin": "bai fa bai zhong"
  },
  {
    "idiom": "千军万马",
    "pinyin": "qian jun wan ma",
    "wrong_pinyin": "qian jun wan ma"
  },
  {
    "idiom": "万紫千红",
    "pinyin": "wan zi qian hong",
    "wrong_pinyin": "wan zi qian hong"
  },
  {
    "idiom": "画龙点睛",
    "pinyin": "hua long dian jing",
    "wrong_pinyin": "hua long dian jing"
  },
  {
    "idiom": "守株待兔",
    "pinyin": "shou zhu dai tu",
    "wrong_pinyin": "shou zhu dai tu"
  },
  {
    "idiom": "亡羊补牢",
    "pinyin": "wang yang bu lao",
    "wrong_pinyin": "wang yang bu lao"
  },
  {
    "idiom": "杯弓蛇影",
    "pinyin": "bei gong she ying",
    "wrong_pinyin": "bei gong she ying"
  },
  {
    "idiom": "井底之蛙",
    "pinyin": "jing di zhi wa",
    "wrong_pinyin": "jing di zhi wa"
  },
  {
    "idiom": "狐假虎威",
    "pinyin": "hu jia hu wei",
    "wrong_pinyin": "hu jia hu wei"
  },
  {
    "idiom": "鸡鸣狗盗",
    "pinyin": "ji ming gou dao",
    "wrong_pinyin": "ji ming gou dao"
  },
  {
    "idiom": "马到成功",
    "pinyin": "ma dao cheng gong",
    "wrong_pinyin": "ma dao cheng gong"
  },
  {
    "idiom": "龙飞凤舞",
    "pinyin": "long fei feng wu",
    "wrong_pinyin": "long fei feng wu"
  },
  {
    "idiom": "虎头蛇尾",
    "pinyin": "hu tou she wei",
    "wrong_pinyin": "hu tou she wei"
  },
  {
    "idiom": "鱼目混珠",
    "pinyin": "yu mu hun zhu",
    "wrong_pinyin": "yu mu hun zhu"
  },
  {
    "idiom": "鸟语花香",
    "pinyin": "niao yu hua xiang",
    "wrong_pinyin": "niao yu hua xiang"
  },
  {
    "idiom": "花好月圆",
    "pinyin": "hua hao yue yuan",
    "wrong_pinyin": "hua hao yue yuan"
  },
  {
    "idiom": "春暖花开",
    "pinyin": "chun nuan hua kai",
    "wrong_pinyin": "chun nuan hua kai"
  },
  {
    "idiom": "秋高气爽",
    "pinyin": "qiu gao qi shuang",
    "wrong_pinyin": "qiu gao qi shuang"
  },
  {
    "idiom": "冬雪皑皑",
    "pinyin": "dong xue ai ai",
    "wrong_pinyin": "dong xue ai ai"
  },
  {
    "idiom": "风和日丽",
    "pinyin": "feng he ri li",
    "wrong_pinyin": "feng he ri li"
  },
  {
    "idiom": "雷声大雨点小",
    "pinyin": "lei sheng da yu dian xiao",
    "wrong_pinyin": "lei sheng da yu dian xiao"
  },
  {
    "idiom": "一鸣惊人",
    "pinyin": "yi ming jing ren",
    "wrong_pinyin": "yi ming jin ren"
  },
  {
    "idiom": "二龙戏珠",
    "pinyin": "er long xi zhu",
    "wrong_pinyin": "er long shi zhu"
  },
  {
    "idiom": "三思而行",
    "pinyin": "san si er xing",
    "wrong_pinyin": "san si er xin"
  },
  {
    "idiom": "四海为家",
    "pinyin": "si hai wei jia",
    "wrong_pinyin": "si hai wei jia"
  },
  {
    "idiom": "五颜六色",
    "pinyin": "wu yan liu se",
    "wrong_pinyin": "wu yan liu she"
  },
  {
    "idiom": "六亲不认",
    "pinyin": "liu qin bu ren",
    "wrong_pinyin": "liu qin bu ren"
  },
  {
    "idiom": "七嘴八舌",
    "pinyin": "qi zui ba she",
    "wrong_pinyin": "qi zui ba she"
  },
  {
    "idiom": "八面玲珑",
    "pinyin": "ba mian ling long",
    "wrong_pinyin": "ba mian ling long"
  },
  {
    "idiom": "九死一生",
    "pinyin": "jiu si yi sheng",
    "wrong_pinyin": "jiu si yi sheng"
  },
  {
    "idiom": "十指连心",
    "pinyin": "shi zhi lian xin",
    "wrong_pinyin": "shi zhi lian xin"
  },
  {
    "idiom": "百折不挠",
    "pinyin": "bai zhe bu nao",
    "wrong_pinyin": "bai zhe bu nao"
  },
  {
    "idiom": "千钧一发",
    "pinyin": "qian jun yi fa",
    "wrong_pinyin": "qian jun yi fa"
  },
  {
    "idiom": "万古长青",
    "pinyin": "wan gu chang qing",
    "wrong_pinyin": "wan gu chang qing"
  },
  {
    "idiom": "画蛇添足",
    "pinyin": "hua she tian zu",
    "wrong_pinyin": "hua she tian zu"
  },
  {
    "idiom": "守口如瓶",
    "pinyin": "shou kou ru ping",
    "wrong_pinyin": "shou kou ru ping"
  },
  {
    "idiom": "亡命之徒",
    "pinyin": "wang ming zhi tu",
    "wrong_pinyin": "wang ming zhi tu"
  },
  {
    "idiom": "杯水车薪",
    "pinyin": "bei shui che xin",
    "wrong_pinyin": "bei shui che xin"
  },
  {
    "idiom": "井井有条",
    "pinyin": "jing jing you tiao",
    "wrong_pinyin": "jing jing you tiao"
  },
  {
    "idiom": "狐朋狗友",
    "pinyin": "hu peng gou you",
    "wrong_pinyin": "hu peng gou you"
  },
  {
    "idiom": "鸡犬不宁",
    "pinyin": "ji quan bu ning",
    "wrong_pinyin": "ji quan bu ning"
  },
  {
    "idiom": "马不停蹄",
    "pinyin": "ma bu ting ti",
    "wrong_pinyin": "ma bu ting ti"
  },
  {
    "idiom": "龙马精神",
    "pinyin": "long ma jing shen",
    "wrong_pinyin": "long ma jing shen"
  },
  {
    "idiom": "虎视眈眈",
    "pinyin": "hu shi dan dan",
    "wrong_pinyin": "hu shi dan dan"
  },
  {
    "idiom": "鱼跃龙门",
    "pinyin": "yu yue long men",
    "wrong_pinyin": "yu yue long men"
  },
  {
    "idiom": "鸟尽弓藏",
    "pinyin": "niao jin gong cang",
    "wrong_pinyin": "niao jin gong cang"
  },
  {
    "idiom": "花团锦簇",
    "pinyin": "hua tuan jin cu",
    "wrong_pinyin": "hua tuan jin cu"
  },
  {
    "idiom": "春华秋实",
    "pinyin": "chun hua qiu shi",
    "wrong_pinyin": "chun hua qiu shi"
  },
  {
    "idiom": "秋收冬藏",
    "pinyin": "qiu shou dong cang",
    "wrong_pinyin": "qiu shou dong cang"
  },
  {
    "idiom": "冬去春来",
    "pinyin": "dong qu chun lai",
    "wrong_pinyin": "dong qu chun lai"
  },
  {
    "idiom": "风花雪月",
    "pinyin": "feng hua xue yue",
    "wrong_pinyin": "feng hua xue yue"
  },
  {
    "idiom": "雷厉风行",
    "pinyin": "lei li feng xing",
    "wrong_pinyin": "lei li feng xing"
  },
  {
    "idiom": "电光火石",
    "pinyin": "dian guang huo shi",
    "wrong_pinyin": "dian guang huo shi"
  },
  {
    "idiom": "水到渠成",
    "pinyin": "shui dao qu cheng",
    "wrong_pinyin": "shui dao qu cheng"
  },
  {
    "idiom": "火树银花",
    "pinyin": "huo shu yin hua",
    "wrong_pinyin": "huo shu yin hua"
  },
  {
    "idiom": "土崩瓦解",
    "pinyin": "tu beng wa jie",
    "wrong_pinyin": "tu beng wa jie"
  },
  {
    "idiom": "金玉满堂",
    "pinyin": "jin yu man tang",
    "wrong_pinyin": "jin yu man tang"
  },
  {
    "idiom": "木已成舟",
    "pinyin": "mu yi cheng zhou",
    "wrong_pinyin": "mu yi cheng zhou"
  },
  {
    "idiom": "一石二鸟",
    "pinyin": "yi shi er niao",
    "wrong_pinyin": "yi shi er niao"
  },
  {
    "idiom": "二虎相争",
    "pinyin": "er hu xiang zheng",
    "wrong_pinyin": "er hu xiang zheng"
  },
  {
    "idiom": "三顾茅庐",
    "pinyin": "san gu mao lu",
    "wrong_pinyin": "san gu mao lu"
  },
  {
    "idiom": "四面楚歌",
    "pinyin": "si mian chu ge",
    "wrong_pinyin": "si mian chu ge"
  },
  {
    "idiom": "五体投地",
    "pinyin": "wu ti tou di",
    "wrong_pinyin": "wu ti tou di"
  },
  {
    "idiom": "六畜兴旺",
    "pinyin": "liu chu xing wang",
    "wrong_pinyin": "liu chu xing wang"
  },
  {
    "idiom": "七情六欲",
    "pinyin": "qi qing liu yu",
    "wrong_pinyin": "qi qing liu yu"
  },
  {
    "idiom": "八拜之交",
    "pinyin": "ba bai zhi jiao",
    "wrong_pinyin": "ba bai zhi jiao"
  },
  {
    "idiom": "九霄云外",
    "pinyin": "jiu xiao yun wai",
    "wrong_pinyin": "jiu xiao yun wai"
  },
  {
    "idiom": "十恶不赦",
    "pinyin": "shi e bu she",
    "wrong_pinyin": "shi e bu she"
  },
  {
    "idiom": "百战百胜",
    "pinyin": "bai zhan bai sheng",
    "wrong_pinyin": "bai zhan bai sheng"
  },
  {
    "idiom": "千载难逢",
    "pinyin": "qian zai nan feng",
    "wrong_pinyin": "qian zai nan feng"
  },
  {
    "idiom": "万无一失",
    "pinyin": "wan wu yi shi",
    "wrong_pinyin": "wan wu yi shi"
  },
  {
    "idiom": "画饼充饥",
    "pinyin": "hua bing chong ji",
    "wrong_pinyin": "hua bing chong ji"
  },
  {
    "idiom": "守身如玉",
    "pinyin": "shou shen ru yu",
    "wrong_pinyin": "shou shen ru yu"
  },
  {
    "idiom": "亡国之音",
    "pinyin": "wang guo zhi yin",
    "wrong_pinyin": "wang guo zhi yin"
  },
  {
    "idiom": "杯盘狼藉",
    "pinyin": "bei pan lang ji",
    "wrong_pinyin": "bei pan lang ji"
  },
  {
    "idiom": "井蛙之见",
    "pinyin": "jing wa zhi jian",
    "wrong_pinyin": "jing wa zhi jian"
  },
  {
    "idiom": "狐死首丘",
    "pinyin": "hu si shou qiu",
    "wrong_pinyin": "hu si shou qiu"
  },
  {
    "idiom": "鸡飞狗跳",
    "pinyin": "ji fei gou tiao",
    "wrong_pinyin": "ji fei gou tiao"
  },
  {
    "idiom": "马革裹尸",
    "pinyin": "ma ge guo shi",
    "wrong_pinyin": "ma ge guo shi"
  },
  {
    "idiom": "龙腾虎跃",
    "pinyin": "long teng hu yue",
    "wrong_pinyin": "long teng hu yue"
  },
  {
    "idiom": "虎踞龙盘",
    "pinyin": "hu ju long pan",
    "wrong_pinyin": "hu ju long pan"
  },
  {
    "idiom": "鱼贯而入",
    "pinyin": "yu guan er ru",
    "wrong_pinyin": "yu guan er ru"
  },
  {
    "idiom": "鸟语花香",
    "pinyin": "niao yu hua xiang",
    "wrong_pinyin": "niao yu hua xiang"
  },
  {
    "idiom": "花枝招展",
    "pinyin": "hua zhi zhao zhan",
    "wrong_pinyin": "hua zhi zhao zhan"
  },
  {
    "idiom": "春意盎然",
    "pinyin": "chun yi ang ran",
    "wrong_pinyin": "chun yi ang ran"
  },
  {
    "idiom": "秋色宜人",
    "pinyin": "qiu se yi ren",
    "wrong_pinyin": "qiu se yi ren"
  },
  {
    "idiom": "冬暖夏凉",
    "pinyin": "dong nuan xia liang",
    "wrong_pinyin": "dong nuan xia liang"
  },
  {
    "idiom": "风雨同舟",
    "pinyin": "feng yu tong zhou",
    "wrong_pinyin": "feng yu tong zhou"
  },
  {
    "idiom": "雷打不动",
    "pinyin": "lei da bu dong",
    "wrong_pinyin": "lei da bu dong"
  },
  {
    "idiom": "电闪雷鸣",
    "pinyin": "dian shan lei ming",
    "wrong_pinyin": "dian shan lei ming"
  },
  {
    "idiom": "水落石出",
    "pinyin": "shui luo shi chu",
    "wrong_pinyin": "shui luo shi chu"
  },
  {
    "idiom": "火烧眉毛",
    "pinyin": "huo shao mei mao",
    "wrong_pinyin": "huo shao mei mao"
  },
  {
    "idiom": "土生土长",
    "pinyin": "tu sheng tu zhang",
    "wrong_pinyin": "tu sheng tu zhang"
  },
  {
    "idiom": "金科玉律",
    "pinyin": "jin ke yu lv",
    "wrong_pinyin": "jin ke yu lv"
  },
  {
    "idiom": "木讷寡言",
    "pinyin": "mu ne gua yan",
    "wrong_pinyin": "mu ne gua yan"
  },
  {
    "idiom": "一箭双雕",
    "pinyin": "yi jian shuang diao",
    "wrong_pinyin": "yi jian shuang diao"
  },
  {
    "idiom": "二心两意",
    "pinyin": "er xin liang yi",
    "wrong_pinyin": "er xin liang yi"
  },
  {
    "idiom": "三长两短",
    "pinyin": "san chang liang duan",
    "wrong_pinyin": "san chang liang duan"
  },
  {
    "idiom": "四通八达",
    "pinyin": "si tong ba da",
    "wrong_pinyin": "si tong ba da"
  },
  {
    "idiom": "五湖四海",
    "pinyin": "wu hu si hai",
    "wrong_pinyin": "wu hu si hai"
  },
  {
    "idiom": "六根清净",
    "pinyin": "liu gen qing jing",
    "wrong_pinyin": "liu gen qing jing"
  },
  {
    "idiom": "七零八落",
    "pinyin": "qi ling ba luo",
    "wrong_pinyin": "qi ling ba luo"
  },
  {
    "idiom": "八面威风",
    "pinyin": "ba mian wei feng",
    "wrong_pinyin": "ba mian wei feng"
  },
  {
    "idiom": "九泉之下",
    "pinyin": "jiu quan zhi xia",
    "wrong_pinyin": "jiu quan zhi xia"
  },
  {
    "idiom": "十拿九稳",
    "pinyin": "shi na jiu wen",
    "wrong_pinyin": "shi na jiu wen"
  },
  {
    "idiom": "百依百顺",
    "pinyin": "bai yi bai shun",
    "wrong_pinyin": "bai yi bai shun"
  },
  {
    "idiom": "千变万化",
    "pinyin": "qian bian wan hua",
    "wrong_pinyin": "qian bian wan hua"
  },
  {
    "idiom": "万古流芳",
    "pinyin": "wan gu liu fang",
    "wrong_pinyin": "wan gu liu fang"
  },
  {
    "idiom": "画地为牢",
    "pinyin": "hua di wei lao",
    "wrong_pinyin": "hua di wei lao"
  },
  {
    "idiom": "守正不阿",
    "pinyin": "shou zheng bu e",
    "wrong_pinyin": "shou zheng bu e"
  },
  {
    "idiom": "亡命天涯",
    "pinyin": "wang ming tian ya",
    "wrong_pinyin": "wang ming tian ya"
  },
  {
    "idiom": "杯觥交错",
    "pinyin": "bei gong jiao cuo",
    "wrong_pinyin": "bei gong jiao cuo"
  },
  {
    "idiom": "井底捞月",
    "pinyin": "jing di lao yue",
    "wrong_pinyin": "jing di lao yue"
  },
  {
    "idiom": "狐疑不决",
    "pinyin": "hu yi bu jue",
    "wrong_pinyin": "hu yi bu jue"
  },
  {
    "idiom": "鸡犬升天",
    "pinyin": "ji quan sheng tian",
    "wrong_pinyin": "ji quan sheng tian"
  },
  {
    "idiom": "马首是瞻",
    "pinyin": "ma shou shi zhan",
    "wrong_pinyin": "ma shou shi zhan"
  },
  {
    "idiom": "龙争虎斗",
    "pinyin": "long zheng hu dou",
    "wrong_pinyin": "long zheng hu dou"
  },
  {
    "idiom": "虎背熊腰",
    "pinyin": "hu bei xiong yao",
    "wrong_pinyin": "hu bei xiong yao"
  },
  {
    "idiom": "鱼游釜中",
    "pinyin": "yu you fu zhong",
    "wrong_pinyin": "yu you fu zhong"
  },
  {
    "idiom": "鸟枪换炮",
    "pinyin": "niao qiang huan pao",
    "wrong_pinyin": "niao qiang huan pao"
  },
  {
    "idiom": "花容月貌",
    "pinyin": "hua rong yue mao",
    "wrong_pinyin": "hua rong yue mao"
  },
  {
    "idiom": "春色满园",
    "pinyin": "chun se man yuan",
    "wrong_pinyin": "chun se man yuan"
  },
  {
    "idiom": "秋月春风",
    "pinyin": "qiu yue chun feng",
    "wrong_pinyin": "qiu yue chun feng"
  },
  {
    "idiom": "冬虫夏草",
    "pinyin": "dong chong xia cao",
    "wrong_pinyin": "dong chong xia cao"
  },
  {
    "idiom": "风调雨顺",
    "pinyin": "feng tiao yu shun",
    "wrong_pinyin": "feng tiao yu shun"
  },
  {
    "idiom": "雷声阵阵",
    "pinyin": "lei sheng zhen zhen",
    "wrong_pinyin": "lei sheng zhen zhen"
  },
  {
    "idiom": "电光石火",
    "pinyin": "dian guang shi huo",
    "wrong_pinyin": "dian guang shi huo"
  },
  {
    "idiom": "水涨船高",
    "pinyin": "shui zhang chuan gao",
    "wrong_pinyin": "shui zhang chuan gao"
  },
  {
    "idiom": "火眼金睛",
    "pinyin": "huo yan jin jing",
    "wrong_pinyin": "huo yan jin jing"
  },
  {
    "idiom": "土里土气",
    "pinyin": "tu li tu qi",
    "wrong_pinyin": "tu li tu qi"
  },
  {
    "idiom": "金枝玉叶",
    "pinyin": "jin zhi yu ye",
    "wrong_pinyin": "jin zhi yu ye"
  },
  {
    "idiom": "木秀于林",
    "pinyin": "mu xiu yu lin",
    "wrong_pinyin": "mu xiu yu lin"
  }
];

module.exports = idioms;