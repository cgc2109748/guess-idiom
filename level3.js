const idioms = require('./data.js');

class Level3 {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.width = game.width;
    this.height = game.height;
    this.idiomsData = [];
    this.selectedIdioms = [];
    this.idiomCharacters = [];
    this.chessBoard = [];
    this.buttons = [];
    this.cardSlot = {};
    this.removedCards = {};
    this.movingCard = null;
    this.animationDuration = 500;
    this.cardCompletionAnimation = null;
    this.difficultyLevel = 2;
    this.buttonUsageLimits = { remove: 5, undo: 5, shuffle: 3 };
    this.buttonUsageRemaining = { remove: 5, undo: 5, shuffle: 3 };
    this.bgImage = null;
    this.bgImageLoaded = false;
    this.allBlocks = [];
    this.blockData = {};
    // 触摸状态变量
    this.touchStartX = null;
    this.touchCurrentX = null;
    this.isTouchingCardSlot = false;
    this.isTouchingRemovedCards = false;
    this.initialScrollOffset = 0;
    // 标识第三关
    this.levelName = 'level3';
    // 金字塔层数（用于阴影与明暗计算）
    this.maxPyramidLayers = 7;

    // 每一层的颜色（层级区分用）
    this.layerColors = [
      '#FFCDD2', // L1 轻粉
      '#F8BBD0', // L2 轻粉紫
      '#E1BEE7', // L3 轻紫
      '#D1C4E9', // L4 轻淡紫
      '#BBDEFB', // L5 轻蓝
      '#B2EBF2', // L6 轻青
      '#B2DFDB', // L7 轻绿青
      '#C8E6C9', // L8 轻绿
      '#FFE0B2'  // L9 轻橙
    ];
  }

  async init() {
    await this.loadBackgroundImage();
    await this.loadIdiomData();
    this.initLevel();
    if (this.removedCards && this.removedCards.cards) {
      this.removedCards.cards = [];
    }
    if (this.game && this.game.modalConfig) {
      this.game.modalConfig.show = false;
    }
  }

  async loadBackgroundImage() {
    return new Promise((resolve) => {
      if (typeof wx !== 'undefined') {
        this.bgImage = wx.createImage();
        this.bgImage.onload = () => { this.bgImageLoaded = true; resolve(); };
        this.bgImage.onerror = () => { console.warn('背景图片加载失败'); this.bgImageLoaded = false; resolve(); };
        this.bgImage.src = 'gameBG.png';
      } else {
        this.bgImage = new Image();
        this.bgImage.onload = () => { this.bgImageLoaded = true; resolve(); };
        this.bgImage.onerror = () => { console.warn('背景图片加载失败'); this.bgImageLoaded = false; resolve(); };
        this.bgImage.src = './gameBG.png';
      }
    });
  }

  async loadIdiomData() {
    try {
      let data;
      if (typeof wx !== 'undefined' && wx.request) {
        data = await new Promise((resolve, reject) => {
          wx.request({
            url: './data.js',
            success: (res) => resolve(res.data),
            fail: (res) => reject(res)
          });
        });
      } else {
        const response = await fetch('./data.js');
        data = await response.json();
      }
      this.idiomsData = data.idioms || [];
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(this.idiomsData.length, 71);
      for (const index of randomIndices) {
        this.selectedIdioms.push(this.idiomsData[index]);
      }
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        if (idiom && idiom.idiom) {
          this.idiomCharacters.push(...idiom.idiom.split(''));
        }
      });
      // 移除旧难度系数的打乱逻辑，保留按顺序生成字符池，由 arrangeCharactersByDifficulty 统一安排
    } catch (error) {
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(idioms.length, 71);
      for (const index of randomIndices) {
        this.selectedIdioms.push(idioms[index]);
      }
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        if (idiom && idiom.idiom) {
          this.idiomCharacters.push(...idiom.idiom.split(''));
        }
      });
      // 移除旧难度系数的打乱逻辑
    }
  }

  generateRandomIndices(maxIndex, count) {
    const indices = new Set();
    while (indices.size < count && indices.size < maxIndex) {
      const randomIndex = Math.floor(Math.random() * maxIndex);
      indices.add(randomIndex);
    }
    return Array.from(indices);
  }

  shuffleArray(array) {
    // 按难度等级系数进行重新排列：
    // 1: 不打乱；2-9：渐进式打乱；10：分组打乱并轻微打散组顺序
    if (!Array.isArray(array) || array.length <= 1) return array;
    if (this.difficultyLevel === 1) {
      return array;
    }

    if (this.difficultyLevel >= 10) {
      const shuffled = this.shuffleWithGrouping(array.slice());
      // 原地更新，保持调用方传入数组引用不变
      array.splice(0, array.length, ...shuffled);
      return array;
    }

    const shuffleIntensity = (this.difficultyLevel - 1) / 9; // 转换为0-1比例
    const shuffled = this.gradualShuffle(array.slice(), shuffleIntensity);
    array.splice(0, array.length, ...shuffled);
    return array;
  }

  gradualShuffle(array, intensity) {
    // 渐进式打乱：根据强度决定交换次数
    const result = array.slice();
    const n = result.length;
    const swaps = Math.max(1, Math.floor(n * intensity));
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(Math.random() * n);
      const j = Math.floor(Math.random() * n);
      if (i !== j) {
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
    return result;
  }

  shuffleWithGrouping(array) {
    // 分组打乱：按4字成语分组，保留约一半组的相对完整，其他组内部打乱，并轻微打乱组顺序
    const groupSize = 4;
    const groups = [];
    for (let i = 0; i < array.length; i += groupSize) {
      groups.push(array.slice(i, i + groupSize));
    }

    const totalGroups = groups.length;
    if (totalGroups <= 1) return array.slice();

    const keepCount = Math.floor(totalGroups / 2);
    const indices = [...groups.keys()];
    // 随机选择需要保持完整的组
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const keepSet = new Set(indices.slice(0, keepCount));

    // 对未保持的组进行内部打乱
    groups.forEach((g, idx) => {
      if (!keepSet.has(idx)) {
        for (let i = g.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [g[i], g[j]] = [g[j], g[i]];
        }
      }
    });

    // 轻微打乱组的顺序
    for (let i = groups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groups[i], groups[j]] = [groups[j], groups[i]];
    }

    return groups.flat();
  }

  initLevel() {
    this.cellSize = 35;
    this.gridSpacing = 1;
    this.layerOffset = 0;
    this.gridHitOffsetX = 0;
    this.gridHitOffsetY = 0;
    this.extraHitHeightY = 0;
    
    // 统一所有卡片颜色
    const unifiedColor = '#4caf50';
    this.characterTypes = {};
    this.idiomCharacters.forEach((char) => {
      this.characterTypes[char] = { name: char, color: unifiedColor, icon: char };
    });
    
    this.initBlocks();
    this.selectedCharacterType = this.idiomCharacters[0];
    this.initCardSlot();
    this.calculateGrid();
    this.initButtons();
  }

  initCardSlot() {
    // 固定显示10个卡片位置的宽度
    const visibleCards = 10;
    const cardWidth = 30;
    const cardSpacing = 5;
    
    this.cardSlot = {
      maxCards: 20,
      cards: [],
      x: 0,
      y: 0,
      // 固定宽度为10个卡片位置的宽度
      width: visibleCards * (cardWidth + cardSpacing) - cardSpacing,
      height: 60,
      cardWidth: cardWidth,
      cardHeight: 50,
      cardSpacing: cardSpacing,
      // 可见卡片数量
      visibleCards: visibleCards
    };
    // 固定显示10个卡片位置的宽度
    this.removedCards = {
      cards: [],
      maxCards: 16,
      x: 0,
      y: 0,
      // 固定宽度为10个卡片位置的宽度
      width: visibleCards * (cardWidth + cardSpacing) - cardSpacing,
      height: 40, // 固定高度为40，与后面布局计算中保持一致
      cardWidth: cardWidth,
      cardHeight: 40,
      cardSpacing: cardSpacing,
      // 新增：水平滚动偏移（仅格子滑动，边框固定）
      scrollOffset: 0,
      // 可见卡片数量
      visibleCards: visibleCards
    };
    
    this.movingCard = null;
    this.animationDuration = 550;
  }

  // 生成金字塔各层的位置（底层 9×9，逐层递减 2，保证完全居中）
  generatePyramidPositions() {
    this.pyramidPositions = [];
    this.layerShiftCells = {}; // 每层的居中偏移（以格子为单位，支持 0.5 居中）

    const baseRows = 9;
    const baseCols = 9;

    let rows = baseRows; // 底层行数
    let cols = baseCols; // 底层列数

    let L = 1;
    while (rows > 0 && cols > 0) {
      // 绝对居中偏移：相对于底层 9×9 的中心
      const centerRow = (baseRows - rows) / 2;
      const centerCol = (baseCols - cols) / 2;
      const rowOffset = Math.floor(centerRow);
      const colOffset = Math.floor(centerCol);

      // 记录像素渲染用的半格偏移（例如 0.5），确保视觉居中（可处于两卡片之间）
      const fracRowShift = centerRow - rowOffset; // 0 或 0.5
      const fracColShift = centerCol - colOffset; // 0 或 0.5
      this.layerShiftCells[L] = { dx: fracColShift, dy: fracRowShift };

      for (let y = rowOffset; y < rowOffset + rows; y++) {
        for (let x = colOffset; x < colOffset + cols; x++) {
          // 按需求：去掉顶层的那一张卡片（即 1×1 层不放置卡片）
          if (rows === 1 && cols === 1) {
            continue;
          }
          this.pyramidPositions.push({ x, y, layer: L });
        }
      }

      // 递减到下一层（递减 1）
      rows -= 1;
      cols -= 1;
      L++;
    }

    // 动态设置最大层数（用于阴影与明暗计算）
    this.maxPyramidLayers = L - 1;
  }

  // 新难度系数排列：按 1-4 级规则生成与金字塔位置一一对应的字符序列
  arrangeCharactersByDifficulty(sourceChars = []) {
    const total = this.pyramidPositions.length;
    const result = new Array(total);

    // 分层收集索引（layer 越大越靠上）
    const indicesByLayer = {};
    this.pyramidPositions.forEach((pos, idx) => {
      if (!indicesByLayer[pos.layer]) indicesByLayer[pos.layer] = [];
      indicesByLayer[pos.layer].push(idx);
    });
    const layerNumsAsc = Object.keys(indicesByLayer).map(n => parseInt(n, 10)).sort((a, b) => a - b); // 底层->顶层
    const layerNumsDesc = layerNumsAsc.slice().sort((a, b) => b - a); // 顶层->底层

    // 构建成语与字符池
    const idiomList = (this.selectedIdioms || []).slice();
    const idiomCharsList = idiomList.map(i => (i && i.idiom ? i.idiom.split('') : []));
    const flatChars = sourceChars && sourceChars.length ? sourceChars.slice() : idiomCharsList.flat();

    // 工具：浅随机打乱
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 工具：向指定层填充若干字符
    const layerFree = new Map(layerNumsAsc.map(L => [L, indicesByLayer[L].slice()]));
    const placeCharsToLayer = (chars, L, count) => {
      const slots = layerFree.get(L) || [];
      const n = Math.min(count, slots.length);
      for (let k = 0; k < n; k++) {
        result[slots.shift()] = chars.shift();
      }
      layerFree.set(L, slots);
      return count - n; // 返回剩余未放数量
    };

    // 难度 1：按顺序将所有成语文字依次填充到金字塔
    if (this.difficultyLevel === 1) {
      for (let i = 0; i < total; i++) {
        result[i] = flatChars[i % flatChars.length];
      }
      return result;
    }

    // 难度 4：顶层（2×2）放一个完整成语，其余完全随机
    if (this.difficultyLevel === 4) {
      const topL = layerNumsDesc[0];
      const topSlots = (layerFree.get(topL) || []).slice();
      const firstIdiom = idiomCharsList[0] ? shuffle(idiomCharsList[0].slice()) : [];
      for (let i = 0; i < Math.min(4, topSlots.length); i++) {
        result[topSlots[i]] = firstIdiom[i];
      }
      // 标记已使用顶层槽位
      layerFree.set(topL, topSlots.slice(Math.min(4, topSlots.length)));

      // 其余位置完全随机填充剩余字符
      let remainChars = idiomCharsList.slice(1).flat();
      remainChars = shuffle(remainChars);
      for (let i = 0; i < total; i++) {
        if (result[i] == null) {
          result[i] = remainChars.shift();
        }
      }
      return result;
    }

    // 难度 2/3：顶部若干层放指定数量的成语，要求每个成语的 4 字分布在最多两层内；剩余层随机
    const topLayers = this.difficultyLevel === 2 ? layerNumsDesc.slice(0, 5) : layerNumsDesc.slice(0, 4); // 2: [2×2..6×6]；3: [2×2..5×5]
    const idiomCount = this.difficultyLevel === 2 ? 16 : 7;

    // 预设相邻层配对方案，循环使用
    const pairs = [];
    for (let i = 0; i < topLayers.length - 1; i++) {
      pairs.push([topLayers[i], topLayers[i + 1]]);
    }
    if (pairs.length === 0) pairs.push([topLayers[0], topLayers[0]]);

    // 放置指定数量的成语
    for (let idx = 0; idx < Math.min(idiomCount, idiomCharsList.length); idx++) {
      const chars = shuffle(idiomCharsList[idx].slice()); // 略微打乱成语内部顺序
      const [L1, L2] = pairs[idx % pairs.length];
      let remaining = 4;
      // 先尝试两层各放 2 字
      remaining -= (2 - placeCharsToLayer(chars, L1, 2));
      remaining -= (2 - placeCharsToLayer(chars, L2, 2));
      // 若两层空间不足，继续在顶部其他层补齐
      if (remaining > 0) {
        for (const L of topLayers) {
          if (remaining <= 0) break;
          remaining -= (remaining - placeCharsToLayer(chars, L, remaining));
        }
      }
    }

    // 其余位置完全随机填充剩余字符
    let remainChars = idiomCharsList.slice(idiomCount).flat();
    remainChars = shuffle(remainChars);
    for (let i = 0; i < total; i++) {
      if (result[i] == null) {
        result[i] = remainChars.shift();
      }
    }
    return result;
  }

  initBlocks() {
    this.allBlocks = [];
    this.blockData = {};
    this.generatePyramidPositions();

    const arrangedChars = this.arrangeCharactersByDifficulty(this.idiomCharacters);

    let blockId = 0;
    this.pyramidPositions.forEach(pos => {
      const charType = arrangedChars[blockId] || this.idiomCharacters[blockId % this.idiomCharacters.length];
      const block = {
        id: blockId,
        x: pos.x,
        y: pos.y,
        type: charType,
        status: 0,
        level: pos.layer,
        area: 'pyramid',
        higherThanBlocks: [],
        lowerThanBlocks: []
      };
      this.allBlocks.push(block);
      this.blockData[blockId] = block;
      blockId++;
    });

    this.allBlocks.forEach(b => this.genLevelRelation(b));
  }

  genLevelRelation(block) {
    const { x, y, level } = block;
    block.higherThanBlocks = [];
    block.lowerThanBlocks = [];

    const blocksInSamePosition = this.allBlocks.filter(otherBlock =>
      otherBlock.x === x && otherBlock.y === y
    );

    blocksInSamePosition.forEach(otherBlock => {
      if (otherBlock.id !== block.id) {
        if (otherBlock.level > level) {
          block.higherThanBlocks.push(otherBlock);
          otherBlock.lowerThanBlocks.push(block);
        }
      }
    });
  }

  calculateGrid() {
    const allPositions = this.pyramidPositions;
    const minX = Math.min(...allPositions.map(p => p.x));
    const maxX = Math.max(...allPositions.map(p => p.x));
    const minY = Math.min(...allPositions.map(p => p.y));
    const maxY = Math.max(...allPositions.map(p => p.y));

    const totalWidth = (maxX - minX) * (this.cellSize + this.gridSpacing) + this.cellSize;
    const totalHeight = (maxY - minY) * (this.cellSize + this.gridSpacing) + this.cellSize;

    this.gridStartX = (this.width - totalWidth) / 2;
    this.gridStartY = 125 - this.cellSize / 3;

    this.bottomBounds = {
      left: this.gridStartX,
      top: this.gridStartY,
      right: this.gridStartX + totalWidth,
      bottom: this.gridStartY + totalHeight
    };

    this.minGridX = minX;
    this.maxGridX = maxX;
    this.minGridY = minY;
    this.maxGridY = maxY;
    this.stepX = this.cellSize + this.gridSpacing;
    this.stepY = this.cellSize + this.gridSpacing;
    this.matrixCols = this.maxGridX - this.minGridX + 1;
    this.matrixRows = this.maxGridY - this.minGridY + 1;

    this.gridCells = [];
    allPositions.forEach(pos => {
      if (!this.gridCells[pos.x]) {
        this.gridCells[pos.x] = [];
      }
      this.gridCells[pos.x][pos.y] = {
        x: this.gridStartX + (pos.x - minX) * (this.cellSize + this.gridSpacing),
        y: this.gridStartY + (pos.y - minY) * (this.cellSize + this.gridSpacing),
        width: this.cellSize,
        height: this.cellSize
      };
    });

    const slotY = this.gridStartY + totalHeight + 40;
    this.cardSlot.y = slotY;
    // 固定卡槽宽度：内容宽度 + 左右各10px内边距
    const fixedWidth = this.cardSlot.visibleCards * (this.cardSlot.cardWidth + this.cardSlot.cardSpacing) - this.cardSlot.cardSpacing;
    this.cardSlot.width = fixedWidth + 20;
    this.cardSlot.x = (this.width - this.cardSlot.width) / 2;

    // 动态高度：默认一行，当前卡片数量超过10个时按10列自动换行
    const cardsPerRow = this.cardSlot.visibleCards; // 10
    const rows = Math.max(1, Math.ceil(this.cardSlot.cards.length / cardsPerRow));
    this.cardSlot.height = rows * (this.cardSlot.cardHeight + 5) + 5;

    // 移出区位置跟随卡槽高度，宽度与卡槽一致（包含左右各10px内边距）
    this.removedCards.y = slotY + this.cardSlot.height + 30;
    this.removedCards.width = fixedWidth + 20;
    this.removedCards.x = (this.width - this.removedCards.width) / 2;
    // 初始高度保持，后续由 updateRemovedCardsLayout 动态更新
    // this.removedCards.height = 40;

    if (this.removedCards.y + this.removedCards.height > this.height - 100) {
      this.removedCards.y = this.height - this.removedCards.height - 100;
    }
  }

  initButtons() {
    const buttonWidth = 100;
    const buttonHeight = 56;
    const buttonSpacing = 24;
    const totalWidth = 3 * buttonWidth + 2 * buttonSpacing;
    const startX = (this.width - totalWidth) / 2;
    const buttonY = this.height - 110;
    
    this.buttons = [
      {
        id: 'remove',
        x: startX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        color: '#ff6b6b',
        icon: '🗑️',
        text: '移出',
        action: () => this.removeFirstCardsFromSlot(4)
      },
      {
        id: 'undo',
        x: startX + buttonWidth + buttonSpacing,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        color: '#4caf50',
        icon: '↶',
        text: '撤回',
        action: () => this.undoLastAction()
      },
      {
        id: 'shuffle',
        x: startX + 2 * (buttonWidth + buttonSpacing),
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        color: '#9c27b0',
        icon: '🔀',
        text: '洗牌',
        action: () => this.shuffleBlocks()
      }
    ];
}

  handleTouch(x, y) {
    if (this.game && this.game.modalConfig && this.game.modalConfig.show) {
      const modalWidth = this.width - 60;
      const modalHeight = 120;
      const modalX = 30;
      const modalY = (this.height - modalHeight) / 2;
  
      const closeButtonWidth = 60;
      const closeButtonHeight = 30;
      const closeButtonX = modalX + modalWidth - closeButtonWidth - 10;
      const closeButtonY = modalY + modalHeight - closeButtonHeight - 10;
  
      if (x >= closeButtonX && x <= closeButtonX + closeButtonWidth &&
          y >= closeButtonY && y <= closeButtonY + closeButtonHeight) {
        this.game.modalConfig.show = false;
        return;
      }
    }
  
    // 检查按钮点击
    for (let button of this.buttons) {
      const hitTop = button.y;
      const hitBottom = button.y + button.height;
      if (x >= button.x && x <= button.x + button.width &&
          y >= hitTop && y <= hitBottom) {
        this.handleButtonClick(button.id);
        return;
      }
    }
  
    // 检查移出卡片点击
    const clickedRemovedCard = this.getClickedRemovedCard(x, y);
    if (clickedRemovedCard !== -1) {
      this.addRemovedCardToSlot(clickedRemovedCard);
      return;
    }
    
    // 添加调试信息，帮助排查问题
    // console.log('点击位置:', x, y);
    // console.log('移出区域:', this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    // console.log('点击的卡片索引:', clickedRemovedCard);
    
    // 移出卡槽区域现在使用多行显示，不需要滑动逻辑
    if (clickedRemovedCard === -1 && 
        x >= this.removedCards.x && x <= this.removedCards.x + this.removedCards.width &&
        y >= this.removedCards.y && y <= this.removedCards.y + this.removedCards.height) {
      // 点击在移出卡槽区域但未命中卡片，不做任何处理
      return;
    }
  
    // 检查卡槽中卡片点击（禁用通过点击来移出，必须点击“移出”按钮）
    const clickedSlotCard = this.getClickedSlotCard(x, y);
    if (clickedSlotCard !== -1) {
      return; // 吞掉点击，不执行移动
    }
    
    // 卡槽区域不再支持横向滑动，点击空白处不做处理
  
    // 检查网格点击
    const clickedBlock = this.getClickedBlock(x, y);
    if (clickedBlock) {
      this.doClickBlock(clickedBlock);
    }
  }

  getClickedRemovedCard(x, y) {
    if (this.removedCards.cards.length === 0) {
      return -1;
    }
    
    // console.log('检测点击移出卡片，点击位置:', x, y);
    
    const cardsPerRow = 10; // 每行显示10个卡片，与renderRemovedCards保持一致
    const actualCardSpacing = this.removedCards.cardSpacing;
    
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      // 计算卡片所在的行和列，与renderRemovedCards保持一致
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      
      const cardX = this.removedCards.x + 10 + col * (this.removedCards.cardWidth + actualCardSpacing);
      const cardY = this.removedCards.y + 5 + row * (this.removedCards.cardHeight + 5);
      
      // 确保卡片高度与渲染时一致
      const cardHeight = Math.min(this.removedCards.cardHeight, this.removedCards.height - 10);
      
      // console.log(`卡片 ${i} 位置:`, cardX, cardY, this.removedCards.cardWidth, cardHeight);
      
      if (x >= cardX && x <= cardX + this.removedCards.cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        // console.log(`点击命中卡片 ${i}`);
        return i;
      }
    }
    
    return -1;
  }

  getClickedSlotCard(x, y) {
    if (this.cardSlot.maxCards === 0) {
      return -1;
    }

    const cardsPerRow = this.cardSlot.visibleCards;
    const actualCardSpacing = this.cardSlot.cardSpacing;
    // 防御性：根据当前卡片数量更新高度，避免外部未调用calculateGrid时高度不一致
    const rows = Math.max(1, Math.ceil(this.cardSlot.cards.length / cardsPerRow));
    this.cardSlot.height = rows * (this.cardSlot.cardHeight + 5) + 5;

    for (let i = 0; i < this.cardSlot.maxCards; i++) {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const cardX = this.cardSlot.x + 10 + col * (this.cardSlot.cardWidth + actualCardSpacing);
      const cardY = this.cardSlot.y + 5 + row * (this.cardSlot.cardHeight + 5);
      const hitTop = cardY;
      const hitBottom = hitTop + this.cardSlot.cardHeight;

      if (x >= cardX && x <= cardX + this.cardSlot.cardWidth && y >= hitTop && y <= hitBottom) {
        return i;
      }
    }
    return -1;
  }


  moveSlotCardToRemoved(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.cardSlot.cards.length) {
      const card = this.cardSlot.cards.splice(cardIndex, 1)[0];
      this.removedCards.cards.push(card);
      
      this.updateRemovedCardsLayout();

      if (this.removedCards.maxCards != null && this.removedCards.cards.length > this.removedCards.maxCards) {
        this.showGameFailure();
      }
    }
  }

  // 基于像素级覆盖关系的点击判定：任意上层块只要与当前块矩形有正面积重叠，则当前块不可点击
  isBlockClickable(block) {
    if (!this.gridCells) return false;
    if (!block || block.status !== 0) return false;

    const cell = this.gridCells[block.x]?.[block.y];
    if (!cell) return false;

    const shiftInfo = this.layerShiftCells?.[block.level] || { dx: 0, dy: 0 };
    const stepX = this.stepX || (this.cellSize + this.gridSpacing);
    const stepY = this.stepY || (this.cellSize + this.gridSpacing);
    let rectX = cell.x + stepX * shiftInfo.dx;
    let rectY = cell.y + stepY * shiftInfo.dy;
    const rectW = cell.width;
    const rectH = cell.height;

    // 约束到底层边界
    if (this.bottomBounds) {
      rectX = Math.min(Math.max(rectX, this.bottomBounds.left), this.bottomBounds.right - rectW);
      rectY = Math.min(Math.max(rectY, this.bottomBounds.top), this.bottomBounds.bottom - rectH);
    }

    // 查找所有比当前层级高且可见的块，判断是否有重叠
    const visibleHigherBlocks = this.allBlocks.filter(b => b.status === 0 && b.level > block.level);
    for (const hb of visibleHigherBlocks) {
      const hbCell = this.gridCells[hb.x]?.[hb.y];
      if (!hbCell) continue;
      const hbShift = this.layerShiftCells?.[hb.level] || { dx: 0, dy: 0 };
      let hbX = hbCell.x + stepX * hbShift.dx;
      let hbY = hbCell.y + stepY * hbShift.dy;
      const hbW = hbCell.width;
      const hbH = hbCell.height;

      if (this.bottomBounds) {
        hbX = Math.min(Math.max(hbX, this.bottomBounds.left), this.bottomBounds.right - hbW);
        hbY = Math.min(Math.max(hbY, this.bottomBounds.top), this.bottomBounds.bottom - hbH);
      }

      // 正面积交叠（边界相接不算覆盖）
      const overlap = !(hbX >= rectX + rectW || hbX + hbW <= rectX || hbY >= rectY + rectH || hbY + hbH <= rectY);
      if (overlap) {
        return false;
      }
    }

    return true;
  }

  // 命中检测使用像素级矩形（包含层居中偏移），选择最高层可点击块
  getClickedBlock(x, y) {
    if (!this.gridCells) return null;
    const visibleBlocks = this.allBlocks.filter(b => b.status === 0);

    let candidate = null;
    let candidateLevel = -Infinity;
    for (const block of visibleBlocks) {
      const cell = this.gridCells[block.x]?.[block.y];
      if (!cell) continue;
      const shiftInfo = this.layerShiftCells?.[block.level] || { dx: 0, dy: 0 };
      const stepX = this.stepX || (this.cellSize + this.gridSpacing);
      const stepY = this.stepY || (this.cellSize + this.gridSpacing);
      let rectX = cell.x + stepX * shiftInfo.dx;
      let rectY = cell.y + stepY * shiftInfo.dy;
      const rectW = cell.width;
      const rectH = cell.height;

      // 约束到底层边界
      if (this.bottomBounds) {
        rectX = Math.min(Math.max(rectX, this.bottomBounds.left), this.bottomBounds.right - rectW);
        rectY = Math.min(Math.max(rectY, this.bottomBounds.top), this.bottomBounds.bottom - rectH);
      }

      const inside = x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH;
      if (!inside) continue;

      if (this.isBlockClickable(block) && block.level > candidateLevel) {
        candidate = block;
        candidateLevel = block.level;
      }
    }

    return candidate || null;
  }

  doClickBlock(block) {
    if (block.status !== 0 || !this.isBlockClickable(block)) {
      return;
    }
    
    if (this.cardSlot.cards.length >= this.cardSlot.maxCards) {
      if (this.hasCompletableIdiom()) {
        // 卡槽已满但可组成成语：立即触发成语消除动画
        this.checkIdiomCompletion();
      } else {
        // 卡槽已满且不可组成成语：直接判定失败
        this.showGameFailure();
      }
      return;
    }
    
    block.status = 1;
    
    const card = {
      characterType: block.type,
      sourceRow: block.x,
      sourceCol: block.y,
      sourceLayer: block.level - 1,
      blockId: block.id,
      id: Date.now() + Math.random()
    };
    
    this.cardSlot.cards.push(card);
    this.updateBlockRelations(block);
    // 卡槽内容变化后，立即检测是否组成成语并触发消除（无需再点）
    this.checkIdiomCompletion();
    this.checkGameEnd();
    this.startCardMoveAnimation(card, block.x, block.y);
  }

  // duplicate addRemovedCardToSlot removed

  updateBlockRelations(removedBlock) {
    removedBlock.higherThanBlocks.forEach(higherBlock => {
      const index = higherBlock.lowerThanBlocks.findIndex(b => b.id === removedBlock.id);
      if (index > -1) {
        higherBlock.lowerThanBlocks.splice(index, 1);
      }
    });
    
    removedBlock.lowerThanBlocks.forEach(lowerBlock => {
      const index = lowerBlock.higherThanBlocks.findIndex(b => b.id === removedBlock.id);
      if (index > -1) {
        lowerBlock.higherThanBlocks.splice(index, 1);
      }
    });
  }

  // 动画起点使用层居中偏移后的像素中心
  startCardMoveAnimation(card, sourceRow, sourceCol) {
    const cell = this.gridCells[sourceRow][sourceCol];
    const shiftInfo = this.layerShiftCells?.[(card.sourceLayer + 1)] || { dx: 0, dy: 0 }; // sourceLayer 是从 0 开始
    const stepX = this.stepX || (this.cellSize + this.gridSpacing);
    const stepY = this.stepY || (this.cellSize + this.gridSpacing);

    let startX = cell.x + stepX * shiftInfo.dx + cell.width / 2;
    let startY = cell.y + stepY * shiftInfo.dy + cell.height / 2;

    // 约束到底层边界
    if (this.bottomBounds) {
      const minX = this.bottomBounds.left + cell.width / 2;
      const maxX = this.bottomBounds.right - cell.width / 2;
      const minY = this.bottomBounds.top + cell.height / 2;
      const maxY = this.bottomBounds.bottom - cell.height / 2;
      startX = Math.min(Math.max(startX, minX), maxX);
      startY = Math.min(Math.max(startY, minY), maxY);
    }

    const targetIndex = this.cardSlot.cards.length - 1;
    const cardsPerRow = this.cardSlot.visibleCards;
    const actualCardSpacing = this.cardSlot.cardSpacing;
    const row = Math.floor(targetIndex / cardsPerRow);
    const col = targetIndex % cardsPerRow;

    const targetX = this.cardSlot.x + 10 + col * (this.cardSlot.cardWidth + actualCardSpacing) + this.cardSlot.cardWidth / 2;
    const targetY = this.cardSlot.y + 5 + row * (this.cardSlot.cardHeight + 5) + this.cardSlot.cardHeight / 2;

    this.movingCard = {
      card: card,
      startX: startX,
      startY: startY,
      targetX: targetX,
      targetY: targetY,
      currentX: startX,
      currentY: startY,
      startTime: Date.now()
    };
  }

  handleButtonClick(buttonId) {
    const button = this.buttons.find(b => b.id === buttonId);
    if (!button) return;

    // 先判断是否可执行，不可执行则仅提示，不扣减机会
    let executable = false;
    if (buttonId === 'remove' || buttonId === 'undo') {
      executable = this.cardSlot.cards && this.cardSlot.cards.length > 0;
    } else if (buttonId === 'shuffle') {
      const availableBlocks = this.allBlocks.filter(b => b.status === 0);
      executable = availableBlocks.length > 0;
    } else {
      executable = true;
    }

    if (!executable) {
      if (this.game && typeof this.game.showModalDialog === 'function') {
        // debug log removed
      }
      return;
    }

    // 判断使用次数限制，仅在可执行时扣减
    const limit = this.buttonUsageLimits[buttonId];
    if (limit != null) {
      const remaining = this.buttonUsageRemaining[buttonId] ?? limit;
      if (remaining <= 0) {
        if (this.game && typeof this.game.showModalDialog === 'function') {
          // debug log removed
        }
        return;
      }
      this.buttonUsageRemaining[buttonId] = remaining - 1;
      if (this.buttonUsageRemaining[buttonId] <= 0) {
        button.disabled = true;
      }
    }

    if (button.action) {
      button.action();
    }
  }

  undoLastAction() {
    if (this.cardSlot.cards.length > 0) {
      const lastCard = this.cardSlot.cards.pop();
      
      const block = this.blockData[lastCard.blockId];
      if (block) {
        block.status = 0;
        this.allBlocks.forEach(b => this.genLevelRelation(b));
      }
    }
  }

  removeLastCard() {
    if (this.cardSlot.cards.length > 0) {
      const card = this.cardSlot.cards.pop();
      this.removedCards.cards.push(card);
      this.updateRemovedCardsLayout();

      if (this.removedCards.maxCards != null && this.removedCards.cards.length > this.removedCards.maxCards) {
        this.showGameFailure();
      }
    }
  }

  removeFirstCardsFromSlot(count) {
    const remainingCapacity = (this.removedCards.maxCards != null)
      ? Math.max(0, this.removedCards.maxCards - this.removedCards.cards.length)
      : Number.POSITIVE_INFINITY;
    const toRemove = Math.min(count, remainingCapacity, this.cardSlot.cards.length);
    if (toRemove <= 0) return;

    for (let i = 0; i < toRemove; i++) {
      const card = this.cardSlot.cards.shift();
      if (!card) break;
      this.removedCards.cards.push(card);
    }

    this.updateRemovedCardsLayout();

    if (this.removedCards.maxCards != null && this.removedCards.cards.length > this.removedCards.maxCards) {
      this.showGameFailure();
    }
  }

  updateRemovedCardsLayout() {
    // 计算需要的行数
    const cardsPerRow = 10; // 每行显示10个卡片
    const removedRows = Math.ceil(this.removedCards.cards.length / cardsPerRow);
    // 设置移出卡片区域的高度，根据行数动态调整
    this.removedCards.height = removedRows * (this.removedCards.cardHeight + 5) + 5;

    // 同步卡槽高度（按可见列数进行换行，以当前卡片数量为准）
    const slotCardsPerRow = this.cardSlot.visibleCards;
    const slotRows = Math.max(1, Math.ceil(this.cardSlot.cards.length / slotCardsPerRow));
    this.cardSlot.height = slotRows * (this.cardSlot.cardHeight + 5) + 5;

    // 调整移出区位置，跟随卡槽高度
    this.removedCards.y = this.cardSlot.y + this.cardSlot.height + 30;
  }

  addRemovedCardToSlot(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.removedCards.cards.length && this.cardSlot.cards.length < this.cardSlot.maxCards) {
      const card = this.removedCards.cards.splice(cardIndex, 1)[0];
      this.cardSlot.cards.push(card);
      this.updateRemovedCardsLayout();
      // 从移出区回填卡槽后，立即检测是否组成成语并触发消除
      this.checkIdiomCompletion();
    }
  }

  shuffleBlocks() {
    // 洗牌：按当前难度系数重新安排字符到金字塔位置（保留已移除的块状态不变）
    const arrangedFull = this.arrangeCharactersByDifficulty(this.idiomCharacters);
    this.allBlocks.forEach(block => {
      if (block.status === 0) {
        const ch = arrangedFull[block.id] || block.type;
        block.type = ch;
      }
    });
  }

  async resetLevel() {
    await this.init();
  }

  switchCharacterType() {
    const currentIndex = this.idiomCharacters.indexOf(this.selectedCharacterType);
    const nextIndex = (currentIndex + 1) % this.idiomCharacters.length;
    this.selectedCharacterType = this.idiomCharacters[nextIndex];
  }

  checkLevelComplete() {
    const hasRemainingBlocks = this.allBlocks.some(block => block.status === 0);
    if (this.selectedIdioms.length === 0 && !hasRemainingBlocks && this.cardSlot.cards.length === 0) {
      this.game.showModalDialog(
        '恭喜过关',
        '您已成功消除所有成语！',
        [
          {
            text: '下一关',
            callback: async () => {
              await this.game.initLevel4();
            }
          }
        ]
      );
    }
  }

  hasCompletableIdiom() {
    const collectedChars = this.cardSlot.cards.map(card => card.characterType);
    
    for (let idiom of this.selectedIdioms) {
      const idiomChars = idiom.idiom.split('');
      const charCount = {};
      for (let char of idiomChars) {
        charCount[char] = (charCount[char] || 0) + 1;
      }
      
      const availableCount = {};
      for (let char of collectedChars) {
        availableCount[char] = (availableCount[char] || 0) + 1;
      }
      
      let isMatch = true;
      for (let char in charCount) {
        if (!availableCount[char] || availableCount[char] < charCount[char]) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        return true;
      }
    }
    
    return false;
  }

  showGameFailure() {
    this.game.showModalDialog(
      '游戏失败',
      '卡槽已满，下次努力！',
      [
        {
          text: '重新开始',
          callback: async () => {
            await this.game.initLevel1();
          }
        },
        {
          text: '返回菜单',
          callback: () => {
            if (this.game && this.game.GameState) {
              this.game.gameState = this.game.GameState.MENU;
            } else {
              this.game.gameState = 'menu';
            }
          }
        }
      ]
    );
  }

  checkGameEnd() {
    const clickableBlocks = this.allBlocks.filter(block => 
      block.status === 0 && this.isBlockClickable(block)
    );
    
    if (clickableBlocks.length === 0) {
      if (this.selectedIdioms.length > 0) {
        // TODO: 补全没有更多可点击块时的处理逻辑
      }
    }
  }

  checkIdiomCompletion() {
    const collectedChars = this.cardSlot.cards.map(card => card.characterType);
    
    for (let idiom of this.selectedIdioms) {
      const idiomChars = idiom.idiom.split('');
      const usedCardIndices = [];
      let isMatch = true;
      
      const charCount = {};
      for (let char of idiomChars) {
        charCount[char] = (charCount[char] || 0) + 1;
      }
      
      const availableCount = {};
      for (let char of collectedChars) {
        availableCount[char] = (availableCount[char] || 0) + 1;
      }
      
      for (let char in charCount) {
        if (!availableCount[char] || availableCount[char] < charCount[char]) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        const tempCharCount = {...charCount};
        for (let i = 0; i < this.cardSlot.cards.length; i++) {
          const char = this.cardSlot.cards[i].characterType;
          if (tempCharCount[char] && tempCharCount[char] > 0) {
            usedCardIndices.push(i);
            tempCharCount[char]--;
          }
        }
      }
      
      if (isMatch) {
        if (!this.cardCompletionAnimation) {
          this.cardCompletionAnimation = {
            indices: usedCardIndices.slice(),
            idiom,
            startTime: Date.now(),
            duration: 550,
            progress: 0
          };
        }
        return;
      }
    }
  }

  update() {
    if (this.cardCompletionAnimation) {
      const elapsed = Date.now() - this.cardCompletionAnimation.startTime;
      const progress = Math.min(elapsed / this.cardCompletionAnimation.duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.cardCompletionAnimation.progress = easeProgress;
      
      if (progress >= 1) {
        const indices = this.cardCompletionAnimation.indices.slice().sort((a, b) => b - a);
        indices.forEach(index => {
          this.cardSlot.cards.splice(index, 1);
        });
        
        const completedIdiom = this.cardCompletionAnimation.idiom;
        const idiomIndex = this.selectedIdioms.findIndex(idiom => idiom.idiom === completedIdiom.idiom);
        if (idiomIndex > -1) {
          this.selectedIdioms.splice(idiomIndex, 1);
        }
        
        this.cardCompletionAnimation = null;
        this.checkLevelComplete();
      }
    }
    
    if (this.movingCard) {
      const elapsed = Date.now() - this.movingCard.startTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const deltaX = this.movingCard.targetX - this.movingCard.startX;
      const deltaY = this.movingCard.targetY - this.movingCard.startY;
      
      this.movingCard.currentX = this.movingCard.startX + deltaX * easeProgress;
      this.movingCard.currentY = this.movingCard.startY + deltaY * easeProgress;
      
      if (progress >= 1) {
        this.movingCard = null;
      }
    }
  }

  // 渲染（仅变更关卡文案为"第3关"，其他逻辑沿用第二关）
  render(ctx) {
    const context = ctx || this.ctx;

    // 背景图片或渐变
    if (this.bgImageLoaded && this.bgImage) {
      const imageAspect = this.bgImage.width / this.bgImage.height;
      const canvasAspect = this.width / this.height;
      let drawWidth, drawHeight, drawX, drawY;
      if (imageAspect > canvasAspect) {
        drawHeight = this.height;
        drawWidth = drawHeight * imageAspect;
        drawX = (this.width - drawWidth) / 2;
        drawY = (this.height - drawHeight) / 2;
      } else {
        drawWidth = this.width * 1.05;
        drawHeight = drawWidth / imageAspect;
        drawX = (this.width - drawWidth) / 2;
        drawY = (this.height - drawHeight) / 2;
      }
      context.drawImage(this.bgImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      const gradient = context.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      context.fillStyle = gradient;
      context.fillRect(0, 0, this.width, this.height);
    }

    // 标题与关卡信息（改为白色）
    context.fillStyle = '#333333';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText('拼来凑去', this.width / 2, 55);

    context.fillStyle = '#666666';
    context.font = '16px Arial';
    context.fillText('第3关', this.width / 2, 85);

    const remainingBlocks = this.allBlocks.filter(block => block.status === 0).length;
    context.fillStyle = '#4caf50';
    context.font = 'normal 16px Arial';
    context.textAlign = 'center';
    context.fillText(`剩余卡片: ${remainingBlocks}`, this.width / 2, 105);

    // 网格、按钮、卡槽、移出区、移动动画
    this.renderBlocks();
    this.renderButtons();
    this.renderCardSlot();
    this.renderRemovedCards();
    if (this.movingCard) {
      this.renderMovingCard();
    }
  }

  // 块渲染，按层级从低到高绘制以体现俯视金字塔的层级结构
  renderBlocks() {
    const visibleBlocks = this.allBlocks.filter(block => block.status === 0);
    // 下层先画，上层后画
    visibleBlocks.sort((a, b) => a.level - b.level);
    visibleBlocks.forEach(block => this.renderSingleBlock(block));
  }

  // 单块渲染，加入层级阴影与明暗，体现俯视金字塔效果
  renderSingleBlock(block) {
    if (!this.gridCells[block.x] || !this.gridCells[block.x][block.y]) return;

    const cell = this.gridCells[block.x][block.y];
    const character = this.characterTypes[block.type];
    if (!character) return;

    // 应用层级居中偏移（允许处于两个卡片之间的居中视觉）
    const shiftInfo = this.layerShiftCells?.[block.level] || { dx: 0, dy: 0 };
    const stepX = this.stepX || (this.cellSize + this.gridSpacing);
    const stepY = this.stepY || (this.cellSize + this.gridSpacing);
    let layerX = cell.x + stepX * shiftInfo.dx;
    let layerY = cell.y + stepY * shiftInfo.dy;

    // 约束到底层边界
    if (this.bottomBounds) {
      layerX = Math.min(Math.max(layerX, this.bottomBounds.left), this.bottomBounds.right - cell.width);
      layerY = Math.min(Math.max(layerY, this.bottomBounds.top), this.bottomBounds.bottom - cell.height);
    }

    const isClickable = this.isBlockClickable(block);
    const blocksAtPos = this.allBlocks.filter(b => b.x === block.x && b.y === block.y && b.status === 0);
    const isTopMostVisible = blocksAtPos.length > 0 && block.level === Math.max(...blocksAtPos.map(b => b.level));

    // 计算层级相关的阴影与明暗参数
    const levelRatio = Math.max(0, Math.min(1, (block.level - 1) / (this.maxPyramidLayers - 1))); // 0~1，层越高越大
    const baseShadowAlpha = 0.08; // 基础阴影透明度
    const shadowAlpha = Math.min(0.28, baseShadowAlpha + 0.20 * levelRatio); // 高层阴影更明显
    const darkenFactor = Math.max(0, (this.maxPyramidLayers - block.level) * 0.06); // 下层更暗

    // 阴影（层级越高越明显）
    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    this.ctx.fillRect(layerX + 2, layerY + 2, cell.width, cell.height);
    this.ctx.restore();

    // 透明度：顶层半透明以便隐约看到下一张
    this.ctx.save();
    this.ctx.globalAlpha = 0.7;

    // 背景明暗：基于层级对基础底色做暗化，下层更暗，上层更亮
    const baseBG = isClickable ? '#ffffff' : '#f7f7f7';
    const shadedBG = this.darkenColor(baseBG, isClickable ? Math.min(0.08, darkenFactor * 0.3) : Math.min(0.12, 0.06 + darkenFactor * 0.4));
    this.ctx.fillStyle = shadedBG;
    this.ctx.fillRect(layerX, layerY, cell.width, cell.height);

    // 边框（可点击更深棕色，不可点击偏灰）
    this.ctx.strokeStyle = isClickable ? '#8b4513' : '#999999';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(layerX, layerY, cell.width, cell.height);

    // 字符背景色：按层级颜色区分，随层级略做暗化；不可点击则再暗一些（但整体更亮于之前）
    const layerColor = this.layerColors[(block.level - 1) % this.layerColors.length] || '#4caf50';
    const charBG = isClickable
      ? this.darkenColor(layerColor, Math.min(0.12, darkenFactor * 0.6))
      : this.darkenColor(layerColor, Math.min(0.24, 0.10 + darkenFactor * 0.55));
    this.ctx.fillStyle = charBG;
    this.ctx.fillRect(layerX + 3, layerY + 3, cell.width - 6, cell.height - 6);

    // 顶光线性渐变叠加：左上更亮，右下更暗，强度随层级增加
    const grad = this.ctx.createLinearGradient(layerX, layerY, layerX + cell.width, layerY + cell.height);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.12 * levelRatio})`);
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.12 * levelRatio})`);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(layerX + 3, layerY + 3, cell.width - 6, cell.height - 6);

    // 结束半透明绘制
    this.ctx.restore();

    // 绘制文字前强制不透明并添加白色描边以提升可读性
    this.ctx.save();
    this.ctx.globalAlpha = 1.0;

    // 字符图标
    const textLineWidth = isClickable ? 2 : 1;
    this.ctx.lineWidth = textLineWidth;
    this.ctx.font = 'normal 16px Arial';
    this.ctx.textAlign = 'center';
    // 不可点击：不描边，文字颜色为 #FFFFF0；可点击：保留白描边并使用黑色文字
    this.ctx.fillStyle = isClickable ? '#000000' : '#FFFFF0';
    if (isClickable) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.strokeText(character.icon, layerX + cell.width / 2, layerY + cell.height / 2 + 7);
    }
    this.ctx.fillText(character.icon, layerX + cell.width / 2, layerY + cell.height / 2 + 7);

    this.ctx.restore();

    // 高亮选中的字符类型
    if (isClickable && block.type === this.selectedCharacterType) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(layerX - 2, layerY - 2, cell.width + 4, cell.height + 4);
    }

    // 遮罩不可点击（不受透明度影响）
    if (!isClickable) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      this.ctx.fillRect(layerX, layerY, cell.width, cell.height);
    }
  }

  renderButtons() {
    const roundRect = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    for (let button of this.buttons) {
      const limit = this.buttonUsageLimits && this.buttonUsageLimits[button.id];
      const remaining = (this.buttonUsageRemaining && this.buttonUsageRemaining[button.id] != null)
        ? this.buttonUsageRemaining[button.id]
        : limit;
      const isDisabled = button.disabled || (remaining != null && remaining <= 0);

      const x = button.x, y = button.y, w = button.width, h = button.height;
      const radius = 8;

      // 平面填充：无阴影、无渐变、无高光条
      const baseColor = isDisabled ? '#bdbdbd' : button.color;
      this.ctx.save();
      this.ctx.fillStyle = baseColor;
      roundRect(this.ctx, x, y, w, h, radius);
      this.ctx.fill();

      // 简单描边
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = isDisabled ? '#9e9e9e' : '#ffffff';
      roundRect(this.ctx, x, y, w, h, radius);
      this.ctx.stroke();

      // 文字（居中）
      this.ctx.fillStyle = isDisabled ? '#eeeeee' : '#ffffff';
      this.ctx.font = 'normal 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(button.text, x + w / 2, y + h / 2 + 6);

      // 右上角使用次数 (remaining/limit)
      if (limit != null) {
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = isDisabled ? '#f0f0f0' : '#ffffff';
        const showRemain = remaining != null ? remaining : limit;
        this.ctx.fillText(`(${showRemain}/${limit})`, x + w - 6, y + 16);
      }

      this.ctx.restore();
    }
  }

  darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
    const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  renderCardSlot() {
    this.ctx.save();

    // 容器：浅色背景 + 棕色边框，圆角
    const x = this.cardSlot.x;
    const y = this.cardSlot.y;
    const w = this.cardSlot.width;
    // 保证高度按当前卡片数量计算：11张即换行
    const cardsPerRow = this.cardSlot.visibleCards;
    const computedRows = Math.max(1, Math.ceil(this.cardSlot.cards.length / cardsPerRow));
    this.cardSlot.height = computedRows * (this.cardSlot.cardHeight + 5) + 5;
    const h = this.cardSlot.height;
    const radius = 10;

    // 新增：卡槽高度变化后，立即刷新移出区位置/高度，避免与卡槽重叠
    if (this.updateRemovedCardsLayout) {
      this.updateRemovedCardsLayout();
    }

    const roundRect = (ctx, rx, ry, rw, rh, r) => {
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
    };

    // 背景与边框
    this.ctx.fillStyle = '#fafafa';
    roundRect(this.ctx, x, y, w, h, radius);
    this.ctx.fill();

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#8b4513';
    roundRect(this.ctx, x, y, w, h, radius);
    this.ctx.stroke();

    // 左上角标题（左对齐）
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`卡槽 (${this.cardSlot.cards.length}/${this.cardSlot.maxCards})`, x, y - 10);

    // 使用上方已计算的 cardsPerRow
    const actualCardSpacing = this.cardSlot.cardSpacing;

    // 使用裁剪区域确保内容不越过边框
    this.ctx.save();
    this.ctx.beginPath();
    // 扩大裁剪区域以容纳内容与左右10px内边距
    this.ctx.rect(x + 3, y + 3, w - 6, h - 6);
    this.ctx.clip();

    for (let i = 0; i < this.cardSlot.maxCards; i++) {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const cardX = x + 10 + col * (this.cardSlot.cardWidth + actualCardSpacing);
      const cardY = y + 5 + row * (this.cardSlot.cardHeight + 5);

      // 占位底卡（浅灰）
      this.ctx.save();
      this.ctx.fillStyle = '#e6e6e6';
      this.ctx.fillRect(cardX, cardY, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
      this.ctx.strokeStyle = '#d0d0d0';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(cardX, cardY, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
      this.ctx.restore();

      // 真实卡片（覆盖在占位之上）
      const card = this.cardSlot.cards[i];
      if (card) {
        let shouldAnimate = false;
        let animScale = 1;
        if (this.cardCompletionAnimation && this.cardCompletionAnimation.indices.includes(i)) {
          shouldAnimate = true;
          const pulseStrength = 0.2;
          animScale = 1 + pulseStrength * Math.sin(this.cardCompletionAnimation.progress * Math.PI);
        }

        const drawWidth = this.cardSlot.cardWidth * animScale;
        const drawHeight = this.cardSlot.cardHeight * animScale;
        const drawX = cardX + (this.cardSlot.cardWidth - drawWidth) / 2;
        const drawY = cardY + (this.cardSlot.cardHeight - drawHeight) / 2;

        this.ctx.save();
        if (shouldAnimate) {
          this.ctx.strokeStyle = '#ff6b6b';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(drawX - 2, drawY - 2, drawWidth + 4, drawHeight + 4);
        }
        this.ctx.fillStyle = '#ff8c42';
        this.ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(card.characterType, drawX + drawWidth / 2, drawY + drawHeight / 2 + 6);
        this.ctx.restore();
      }
    }

    this.ctx.restore(); // 结束裁剪
    this.ctx.restore();
  }

  renderRemovedCards() {
    if (this.removedCards.cards.length === 0) return;
    
    this.ctx.save();
    // 边框固定
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    const cardsPerRow = 10; // 每行显示10个卡片
    const actualCardSpacing = this.removedCards.cardSpacing;
    
    // 内容裁剪区域
    this.ctx.save();
    this.ctx.beginPath();
    // 容器裁剪区域与宽度已包含左右边距，这里保持一致
    this.ctx.rect(this.removedCards.x + 3, this.removedCards.y + 3, this.removedCards.width - 6, this.removedCards.height - 6);
    this.ctx.clip();
    
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      const card = this.removedCards.cards[i];
      // 计算卡片所在的行和列
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      
      const cardX = this.removedCards.x + 10 + col * (this.removedCards.cardWidth + actualCardSpacing);
      const cardY = this.removedCards.y + 5 + row * (this.removedCards.cardHeight + 5);
      
      this.ctx.fillStyle = '#ffd700';
      // 确保卡片高度不超过容器高度
      const cardHeight = Math.min(this.removedCards.cardHeight, this.removedCards.height - 10);
      this.ctx.fillRect(cardX, cardY, this.removedCards.cardWidth, cardHeight);
      
      this.ctx.strokeStyle = '#666666';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(cardX, cardY, this.removedCards.cardWidth, cardHeight);
      
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(card.characterType, cardX + this.removedCards.cardWidth / 2, 
                        cardY + this.removedCards.cardHeight / 2 + 5);
    }

    this.ctx.restore(); // 内容裁剪结束
    
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`移出区 (${this.removedCards.cards.length}/${this.removedCards.maxCards})`, 
                      this.removedCards.x + 5, this.removedCards.y - 5);
}

renderMovingCard() {
  const mc = this.movingCard;
  if (!mc) return;
  const drawW = this.cardSlot.cardWidth;
  const drawH = this.cardSlot.cardHeight;
  const drawX = mc.currentX - drawW / 2;
  const drawY = mc.currentY - drawH / 2;

  this.ctx.save();
  this.ctx.fillStyle = '#ffffff';
  this.ctx.fillRect(drawX, drawY, drawW, drawH);

  this.ctx.strokeStyle = '#333333';
  this.ctx.lineWidth = 1;
  this.ctx.strokeRect(drawX, drawY, drawW, drawH);

  this.ctx.fillStyle = '#000000';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText(mc.card.characterType, drawX + drawW / 2, drawY + drawH / 2 + 6);
  this.ctx.restore();
}

// 触摸开始事件处理
handleTouchStart(x, y) {
  this.touchStartX = x;
  this.touchCurrentX = x;
  
  // 检查是否触摸在卡槽区域
  if (x >= this.cardSlot.x && x <= this.cardSlot.x + this.cardSlot.width &&
      y >= this.cardSlot.y && y <= this.cardSlot.y + this.cardSlot.height) {
    this.isTouchingCardSlot = true;
    return;
  }
  
  // 移出卡片区域现在使用多行显示，不需要滑动逻辑
  // 直接使用普通点击处理
  
  // 如果不是在卡槽或移出卡片区域，则使用普通点击处理
  this.handleTouch(x, y);
}

// 触摸移动事件处理
handleTouchMove(x, y) {
  if (!this.touchStartX) return;
  
  this.touchCurrentX = x;
  const deltaX = this.touchCurrentX - this.touchStartX;
  
  // 处理卡槽滑动
  if (this.isTouchingCardSlot) {
    // 多行格子布局下卡槽不支持滚动
    return;
  }
  
  // 移出卡片区域使用多行显示，不需要滑动逻辑
  if (this.isTouchingRemovedCards) {
    return;
  }
}

// 触摸结束事件处理
handleTouchEnd() {
  // 重置触摸状态
  this.touchStartX = null;
  this.touchCurrentX = null;
  this.isTouchingCardSlot = false;
  this.isTouchingRemovedCards = false;
}
} // end of Level3 class
module.exports = Level3;