(function(){
  const P={
    index:{file:'index.html',label:'主頁',icon:'🏠',title:'🌟 繁星仙境模擬器',subtitle:'古雲防上頭用V777（機率僅供參考，實際依遊戲為主）',blocks:[
      ['workflow','自訂流程'],['dropRate','🎁 掉落率計算器'],['cardDecompose','🧩 卡片分解模擬'],['urGem1','💎 UR寶石箱(1)'],['refineBox','🧰 精煉箱'],['xrGacha','🎰 XR 轉蛋'],['urGacha','🎟️ UR 轉蛋'],['runeMonument','🗿 符文石碑模擬器'],['autocast','⚡ 自動詠唱機率模擬器'],['sss','🏆 SSS評級系統'],['refine2030','🔨 +20 → +30 精煉模擬'],['shieldStone','🛡️ 盾牌石'],['gloveStone','🧤 手套石']
    ]},
    game:{file:'game.html',label:'遊戲區',icon:'🎮',title:'🎮 繁星遊戲區',subtitle:'',blocks:[
      ['fullFlow','完整流程'],['urGem1','💎 UR寶石箱(1)'],['xrGacha','🎰 XR 轉蛋'],['urGacha','🎟️ UR 轉蛋'],['timeBoot','💎 時光超越靴附魔'],['dragon','🐉 龍甲附魔'],['evil','⚔️ 善惡武器附魔'],['weaponIdentify','🗡️ 進階武器鑑定'],['weaponChip','💠 武器指定晶片'],['huajinArmor','🔥 華金一條龍(鎧甲/戰靴)'],['huajinAccessory','💎 華金一條龍(耳環/飾品)'],['midIdentify','🎀 頭中鑑定棒'],['midBook','📕 頭中指定書'],['lowIdentify','🎗️ 頭下鑑定棒'],['lowBook','📙 頭下指定書'],['shoeIdentify','👟 鞋子鑑定棒'],['shoeBook','📘 鞋子指定書'],['accIdentify','🪄 飾品鑑定棒'],['accBook','📖 飾品指定魔法書'],['sss','🏆 SSS評級系統'],['refine2030','🔨 +20 → +30 精煉模擬'],['shieldStone','🛡️ 盾牌石'],['gloveStone','🧤 手套石'],['wheel','🎡 繁星大輪盤'],['baccarat','🎴 百家樂'],['blackjack','🃏 21點'],['tongzi','🀙 推筒子']
    ]},
    enchant:{file:'enchant.html',label:'附魔區',icon:'✨',title:'✨ 繁星附魔區',subtitle:'古雲防上頭用V777（機率僅供參考，實際依遊戲為主）',blocks:[
      ['dragon','🐉 龍甲附魔'],['evil','⚔️ 善惡武器附魔'],['timeBoot','💎 時光超越靴附魔'],['isHead','🪽 伊斯頭幻象附魔']
    ]},
    identify:{file:'identify.html',label:'洗詞鑑定區',icon:'🔍',title:'🔍 繁星洗詞鑑定區',subtitle:'古雲防上頭用V777（機率僅供參考，實際依遊戲為主）',blocks:[
      ['huajinArmor','🔥 華金一條龍(鎧甲/戰靴)'],['huajinAccessory','💎 華金一條龍(耳環/飾品)'],['auctionNeedle','🪡 競標針'],['weaponIdentify','🗡️ 進階武器鑑定'],['weaponChip','💠 武器指定晶片'],['midIdentify','🎀 頭中鑑定棒'],['midBook','📕 頭中指定書'],['lowIdentify','🎗️ 頭下鑑定棒'],['lowBook','📙 頭下指定書'],['shoeIdentify','👟 鞋子鑑定棒'],['shoeBook','📘 鞋子指定書'],['accIdentify','🪄 飾品鑑定棒'],['accBook','📖 飾品指定魔法書']
    ]},
    collection:{file:'collection.html',label:'收藏區',icon:'📚',title:'⭐ 繁星收藏模擬',subtitle:'',blockMode:'selectors',blocks:[
      ['toolbar','收藏工具列','.wrap > .toolbar'],['subcats','子分類','.wrap > .subcats'],['special','自選特定分類','.wrap > .special-box'],['summary','收藏摘要','.wrap > .summary'],['owned','已選收藏總道具','.wrap > .req-summary-box|0'],['missing','已選收藏所缺道具','.wrap > .req-summary-box|1'],['layout','收藏清單 / 能力 / 計算機','.wrap > .layout']
    ]},
    equipment:{file:'equipment.html',label:'裝備成本區',icon:'💰',title:'💰 繁星裝備成本區',subtitle:'',blocks:[
      ['craft','🧰 裝備製作模擬'],['servicePrices','💲 代敲材料預設價格 (P)'],['serviceFee','🔨 古雲代敲／代評費用試算']
    ]},
    cash:{file:'CASH.html',label:'現金區',icon:'💳',title:'💳 繁星現金區',subtitle:'比例計算｜儲值 X T ＝ X 紅＋商城點數',blocks:[
      ['headline','儲值主說明'],['calculator','單筆儲值計算器'],['tiers','單筆儲值比例'],['urBox2','💎 UR(2)寶石箱子'],['cumulative','🎁 累計儲值道具'],['priceTable','儲值物價表']
    ]},
    shadow:{file:'shadow.html',label:'影子區',icon:'💎',title:'💎 影子區',subtitle:'影子結晶、升級素質與傷害倍率比較。',blocks:[['crystal','💎 影子區']]}
  };
  for(const [key,page] of Object.entries(P)){
    page.key=key;
    page.blocks=page.blocks.map((x,i)=>({key:x[0],label:x[1],selector:x[2]||null,index:i,visible:true,title:x[1]}));
  }
  window.STARRO_CMS_DEFS=P;
})();
