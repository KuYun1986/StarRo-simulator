/* Verified effects from Taiwan RO operator's published equipment announcements.
 * These are concise official-effect summaries, not private-server balance values.
 * Source is shown once at the end of item detail, not on collection cards. */
(function(root){
'use strict';
const rows=[["翡翠戒指-LT[1]","All State+5；BaseLv每+1，箭雨／二連矢傷害+1%；每10級，大暴雨／殘響傷害+2%；每7級，金屬狂怒傷害+1%；二連矢技能每2級再增加All State+1、SPL+2、ATK及MATK+20。","205519"],["翡翠耳環-LT[1]","All State+5；BaseLv每+1，奧義箭亂舞、纏箭投擲、樂器攻擊傷害+1%；每5級，重金屬音樂傷害+2%；每7級，玫瑰箭矢傷害+1%；課程技能每2級增All State+1、CON+2、ATK及MATK+20；與翡翠戒指-LT搭配，對全體型物理／魔法傷害+12%。","205519"],["翡翠玉結晶戰靴-LT[1]","精煉每+2增加DEX+3、CON+1、SPL+1；每+3增加大暴雨、奧義箭亂舞、重金屬音樂及殘響傷害20%；+7時ATK／MATK+7%；+9時遠距離物理與全屬性魔法傷害+10%；+11時有機率暫時增加INT與DEX；與翡翠戒指-LT、翡翠耳環-LT另有技能冷卻及傷害套裝效果。","205519"],["魔力星陣-LT","固定詠唱-0.2秒、ASPD+1；搭配魔力之星-LT後，基本六大素質每12點分別增益MATK、技能後延遲及全種族／全階級／全體型／全屬性魔法傷害；六大特性素質合計160以上時MATK+100。","205519"],["魔力之星-LT[1]","變動詠唱-10%；基本STR／AGI／VIT／INT／DEX／LUK每12點，分別增加無／風／水／火／地／聖屬性魔法傷害2%；六大基本屬性合計600以上時，對全屬性對象魔法傷害+10%、ASPD+1；六大特性素質合計160以上時SPL+5、S.MATK+5。","205519"],["深紅寶石結晶之墜-LT[1]","MDEF+15、技能後延遲-5%、ATK及MATK+12%；全屬性攻擊與遠距離攻擊抗性各+5%；可使用魔法醒悟Lv1，並附帶冷卻時間限制。","205519"],["深紅寶石胸針-LT[1]","MDEF+15、技能後延遲-5%、ATK及MATK+12%；全屬性攻擊與遠距離攻擊抗性各+5%；可使用吸氣Lv1；與深紅寶石結晶之墜-LT及深紅魔術之靴-LT另有抗性、精煉與階級套裝加成。","205519"],["深紅魔術之靴-LT[1]","MDEF+15、ATK及MATK+5%；遠距離及無屬性攻擊抗性各+5%；每精煉+2增加ATK／MATK+1%，每+3增加P.ATK／S.MATK+1；+11時其他屬性抗性+10%；+13時固定詠唱-0.6秒、技能後延遲-6%；具有深紅寶石系列套裝與階級加成。","215911"],["阿斯特莉亞戰靴-LT[1]","All State+3、MDEF+10；精煉+10時依STR、INT、VIT、AGI、DEX及LUK各達100的條件，提供HP／SP、固定詠唱、物理抗性、攻速、後延遲、CRI及完全迴避加成；+13時依六項特性素質達60提供近／遠距物理、魔法傷害及防禦等加成。","205519"],["阿斯特莉亞鎧甲-LT[1]","MDEF+10、全體型物理傷害減免5%、MaxHP+20%；精煉每+2增加VIT、ATK、MATK；每+3增加MaxHP；+7後延遲-12%、+9全屬性對象物理／魔法傷害+15%、+13全體型物理／魔法傷害+15%；特性素質及卡片搭配另有套裝能力。","205519"],["阿斯特莉亞指環-LT[1]","MDEF+10、六項特性素質各+1；可使用聖典Lv5；對全階級物理／魔法傷害+8%，無視全種族物理／魔法防禦10%；與阿斯特莉亞戰靴-LT及戰盔-LT另有傷害、後延遲及防禦套裝效果。","216929"],["時光超越者斗篷-LT[1]","MDEF+10；精煉每+2增加ATK／MATK+15、每+3增加ATK／MATK+4%及CRI+3、每+4增加物理／魔法傷害、HP、ASPD、暴擊傷害及後延遲；+7時ATK／MATK+7%、+9與+12有全體型及全屬性傷害加成；與時光超越者之靴-LT及階級另有套裝效果。","205519"],["時光超越者之戒-LT[1]","ATK、MATK+7%；依搭配餓熊威力、光速瞬移、無感肌肉、暴走魔法、犀利鷹眼或幸運之日，增加ATK、後延遲、MaxHP、MATK、遠距離物理或爆擊傷害；搭配時光超越者之靴-LT，依精煉與A階級另有P.ATK、S.MATK、HP/SP及傷害效果。","216130"],["萬物與靈魂的真諦-LT[1]","精煉每+2增加ATK／MATK+20、每+3增加滿月腳、流星殞落、邪靈爆炸、艾斯帕傷害20%；+7時ATK／MATK+10%、攻速加成；+9對全體型物理／魔法傷害+10%；+11近距離物理與全屬性魔法傷害+15%；+12縮短次元之書與邪靈爆炸冷卻，階級另有追加能力。","216252"],["深淵湖水咆嘯鎧甲-LT[1]","MDEF+10、All State+12、MaxHP／MaxSP+15%；BaseLv每10級ATK+12；精煉每+2增加ATK+15，每+3增加POW、CON+2；+9近／遠距離物理傷害+20%；+11對中、大型物理傷害+30%；+13技能後延遲-15%；與指定卡片另有額外效果。","205519"],["烏爾蒂奧聖魔法斗篷-LT[1]","MDEF+10；精煉每+2增加MATK+15、每+3增加聖／無屬性魔法傷害10%；+7 MATK+15%；+9聖十字雨及聖靈鎮魂傷害+20%；+11技能後延遲-12%；+12全體型魔法傷害+15%；+13無視首領魔防10%；搭配指定武器與階級另有加成。","205519"],["朱比特輕甲-LT[1]","MATK+150；精煉每+2增加MATK+15，每+3增加靈魂爆炸、地獄火焰、鑽石星塵、大地墳場傷害20%；+9 MATK+15%；+11對全種族魔法傷害+15%；+13技能後延遲-15%；搭配指定卡片及階級另有魔法效果。","216107"],["馬爾斯戰甲-LT[1]","ATK+150；精煉每+2增加ATK+15，每+3增加十字斬、迴旋刀刃、三角射擊、致命威脅傷害20%；+9近／遠距離物理傷害+10%；+11對全種族物理傷害+15%；+13技能後延遲-15%；搭配指定卡片與階級另有技能加成。","216107"],["武爾坎努斯機甲-LT[1]","ATK+150；精煉每+2增加ATK+15，每+3增加加農砲、戰斧颶風、瘋狂野草、手推車龍捲風傷害20%；+9近／遠距離物理傷害+10%；+11對全種族物理傷害+15%；+13技能後延遲-15%；搭配指定卡片與階級另有加成。","216107"],["刻瑞斯皮甲-LT[1]","ATK及MATK+100；精煉每+2增加ATK及MATK+10，每+3增加狼突擊、瞄準標靶、殘響、重金屬音樂傷害20%；+9 ATK／MATK+10%；+11對全種族物理／魔法傷害+15%；+13技能後延遲-15%；另有卡片及階級增益。","216107"],["阿波羅盔甲-LT[1]","MaxHP+20%；精煉每+2增加MaxHP+500及VIT+8，每+3增加龍之氣息、水屬性龍之氣息、大地毀滅與重壓盾擊傷害20%；+9 MaxHP+5000；+11受全體型物理傷害-10%；+13技能後延遲-15%；卡片組合另有攻擊與抗性效果。","216107"],["涅普頓道服-LT[1]","ATK及MATK+120；精煉每+2增加ATK及MATK+10，每+3增加太陽爆炸、滿月腳、艾斯核、邪靈爆炸傷害20%；+9 ATK／MATK+12%；+11對全種族物理／魔法傷害+15%；+13技能後延遲-15%；指定卡片與階級另有技能及抗性效果。","216107"],["狄安娜外套-LT[1]","ATK及MATK+120；精煉每+2增加ATK及MATK+10，每+3增加小雞啄擊、瘋兔胡蘿蔔重擊、獼猴桃梗槍、貓薄荷隕石傷害20%；+9 ATK／MATK+12%；+11對全種族物理／魔法傷害+15%；+13技能後延遲-15%；指定卡片及階級另有加成。","216107"]];
const urls={205519:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=205519',
 215911:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=215911',
 216929:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=216929',
 216130:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=216130',
 216252:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=216252',
 216107:'https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=216107'};
const clean=s=>String(s??'').normalize('NFKC').trim()
 .replace(/\s*(?:×|x|\*)\s*\d+(?:\.\d+)?$/i,'')
 .replace(/^\+\d+\s*/,'')
 .replace(/^(?:[A-DＳS]階|\([A-D]級\))\s*/i,'')
 .replace(/\s+/g,'').replace(/[－–—]/g,'-').toLowerCase();
const isLT=s=>/-lt(?=(?:\[\d+\])?$)/i.test(clean(s));
const baseCandidates=s=>{
 const normalized=clean(s);
 if(!isLT(s))return [];
 const stripped=normalized.replace(/-lt(?=(?:\[\d+\])?$)/i,'');
 const original=String(s).normalize('NFKC').trim().replace(/\s*(?:×|x|\*)\s*\d+(?:\.\d+)?$/i,'').replace(/[－–—]/g,'-');
 const simple=original.replace(/-LT(?=(?:\[\d+\])?$)/i,'');
 const values=[simple,simple.replace(/^\+\d+\s*/,''),simple.replace(/^\+\d+\s*/,'').replace(/^(?:[A-DＳS]階|\([A-D]級\))\s*/i,''),stripped];
 const dedup=new Map();
 for(const value of values){if(value&&!dedup.has(clean(value)))dedup.set(clean(value),value);}
 return [...dedup.values()];
};
const map=new Map(rows.map(([name,effect,id])=>[clean(name),Object.freeze({name,effect,source:urls[id],publisher:'RO仙境傳說Online 台灣官方',status:'verified-summary'})]));
function lookup(name){return map.get(clean(name))||null;}
function annotation(){return '※ 轉蛋提供的是非LT原版裝備；取得後需依遊戲內規定另外改造／升階為LT，並非轉蛋直接取得LT。';}
root.StarroOfficialEquipment=Object.freeze({clean,isLT,baseCandidates,lookup,annotation,entries:map.size,source:'https://event.gnjoy.com.tw/Ro/RoItemSearch'});
if(typeof module!=='undefined'&&module.exports)module.exports=root.StarroOfficialEquipment;
})(typeof window==='undefined'?globalThis:window);