const idioms = require('./data.js');

class Level2 {
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
    this.difficultyLevel = 1;
    this.buttonUsageLimits = { remove: 3, undo: 3, shuffle: 3 };
    this.buttonUsageRemaining = { remove: 3, undo: 3, shuffle: 3 };
    this.bgImage = null;
    this.bgImageLoaded = false;
    this.allBlocks = [];
    this.blockData = {};
    
    // 标识第三关
    this.levelName = 'level2';
    // 金字塔层数（用于阴影与明暗计算）
    this.maxPyramidLayers = 4;
    
    // 每一层的颜色（层级区分用）
    this.layerColors = [
      // '#FFCDD2', // L1 轻粉
      // '#F8BBD0', // L2 轻粉紫
      // '#E1BEE7', // L3 轻紫
      // '#D1C4E9', // L4 轻淡紫
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
      const randomIndices = this.generateRandomIndices(this.idiomsData.length, 14);
      for (const index of randomIndices) {
        this.selectedIdioms.push(this.idiomsData[index]);
      }
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        if (idiom && idiom.idiom) {
          this.idiomCharacters.push(...idiom.idiom.split(''));
        }
      });
      this.shuffleArray(this.idiomCharacters);
    } catch (error) {
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(idioms.length, 14);
      for (const index of randomIndices) {
        this.selectedIdioms.push(idioms[index]);
      }
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        if (idiom && idiom.idiom) {
          this.idiomCharacters.push(...idiom.idiom.split(''));
        }
      });
      this.shuffleArray(this.idiomCharacters);
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
    // 难度1：完全不打乱，按顺序排列
    if (this.difficultyLevel === 1) {
      return;
    }

    // 难度2-10：根据难度系数控制打乱程度
    const shuffleIntensity = (this.difficultyLevel - 1) / 9; // 转换为0-1的比例

    if (this.difficultyLevel === 10) {
      // 难度10：打乱但保持一半成语卡片能挨着排列
      this.shuffleWithGrouping(array);
    } else {
      // 难度2-9：渐进式打乱
      this.gradualShuffle(array, shuffleIntensity);
    }
  }

  // 渐进式打乱方法（按难度强度控制交换距离与次数）
  gradualShuffle(array, intensity) {
    const shuffleCount = Math.floor(array.length * intensity * 2);

    for (let count = 0; count < shuffleCount; count++) {
      for (let i = array.length - 1; i > 0; i--) {
        // 根据强度调整交换范围，强度越低交换距离越近
        const maxDistance = Math.max(1, Math.floor(i * intensity * 0.5));
        const j = Math.max(0, i - maxDistance);
        const randomJ = j + Math.floor(Math.random() * (maxDistance + 1));
        [array[i], array[randomJ]] = [array[randomJ], array[i]];
      }
    }
  }

  // 分组打乱方法（难度10专用，按 4 字成语分组，保持一半组较完整）
  shuffleWithGrouping(array) {
    const groupSize = 4;
    const idiomGroups = [];

    for (let i = 0; i < array.length; i += groupSize) {
      idiomGroups.push(array.slice(i, i + groupSize));
    }

    const keepIntactCount = Math.floor(idiomGroups.length / 2);
    const intactGroups = idiomGroups.slice(0, keepIntactCount);
    const shuffleGroups = idiomGroups.slice(keepIntactCount);

    // 对需要打乱的组进行打乱
    for (let group of shuffleGroups) {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
    }

    // 重新组合数组
    array.length = 0;
    intactGroups.forEach(group => array.push(...group));
    shuffleGroups.forEach(group => array.push(...group));

    // 对整体进行轻微打乱，避免完全固定
    for (let i = 0; i < 3; i++) {
      const pos1 = Math.floor(Math.random() * array.length);
      const pos2 = Math.floor(Math.random() * array.length);
      [array[pos1], array[pos2]] = [array[pos2], array[pos1]];
    }
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
    this.cardSlot = {
      maxCards: 10,
      cards: [],
      x: 0,
      y: 0,
      width: 0,
      height: 60,
      cardWidth: 30,
      cardHeight: 50,
      cardSpacing: 5
    };
    
    this.removedCards = {
      cards: [],
      maxCards: 10,
      x: 0,
      y: 0,
      width: 0,
      height: 50,
      cardWidth: 30,
      cardHeight: 50,
      cardSpacing: 5
    };
    
    this.movingCard = null;
    this.animationDuration = 550;
  }

  // 生成金字塔各层的位置（底层 9×9，逐层递减 2，保证完全居中）
  generatePyramidPositions() {
    this.pyramidPositions = [];
    this.layerShiftCells = {}; // 每层的居中偏移（以格子为单位，支持 0.5 居中）

    const baseRows = 5;
    const baseCols = 5;

    let rows = baseRows; // 底层行数
    let cols = baseCols; // 底层列数

    let L = 1;
    while (rows > 0 && cols > 0) {
      // 绝对居中偏移：相对于底层 5×5 的中心
      const centerRow = (baseRows - rows) / 2;
      const centerCol = (baseCols - cols) / 2;
      const rowOffset = Math.floor(centerRow);
      const colOffset = Math.floor(centerCol);

      // 记录像素渲染用的半格偏移（例如 0.5），确保视觉居中（可处于两卡片之间）
      const fracRowShift = centerRow - rowOffset; // 0 或 0.5
      const fracColShift = centerCol - colOffset; // 0 或 0.5
      this.layerShiftCells[L] = { dx: fracColShift, dy: fracRowShift };
      // 顶层两张卡片：横向与下层 2×2 区域宽度一致（左移半格），纵向位于两张卡片的中线位置（不作纵向半格偏移）
      if (rows === 1 && cols === 1) {
        this.layerShiftCells[L] = { dx: -0.5, dy: 0 };
      }
      for (let y = rowOffset; y < rowOffset + rows; y++) {
        for (let x = colOffset; x < colOffset + cols; x++) {
          this.pyramidPositions.push({ x, y, layer: L });
          // 顶层增加一个卡片：在 1×1 层的右侧增加一格（确保不越界），总数从 55 -> 56
          if (rows === 1 && cols === 1) {
            const extraX = Math.min(baseCols - 1, x + 1);
            const extraY = y;
            if (!(extraX === x && extraY === y)) {
              this.pyramidPositions.push({ x: extraX, y: extraY, layer: L });
            }
          }
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

  // 初始化块数据结构（按金字塔 7×9 -> ... -> 1×2 层级堆叠）
  initBlocks() {
    this.allBlocks = [];
    this.blockData = {};
    this.generatePyramidPositions();

    let blockId = 0;
    this.pyramidPositions.forEach(pos => {
      const charType = this.idiomCharacters[blockId % this.idiomCharacters.length];
      const block = {
        id: blockId,
        x: pos.x,
        y: pos.y,
        type: charType,
        status: 0, // 0=可见，1=已点击/移除
        level: pos.layer, // 层级：数值越大越靠上（上层遮挡下层）
        area: 'pyramid',
        higherThanBlocks: [],
        lowerThanBlocks: []
      };
      this.allBlocks.push(block);
      this.blockData[blockId] = block; // 关键：用于撤回通过 blockId 找回原块
      blockId++;
    });

    // 建立层级遮挡关系：同一坐标（x,y）上，level 更大的压在更小的上面
    this.allBlocks.forEach(block => this.genLevelRelation(block));
  }

  // 生成块的层级关系
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

  // 计算网格（仅基于金字塔位置）
  calculateGrid() {
    const allPositions = this.pyramidPositions;
    const minX = Math.min(...allPositions.map(p => p.x));
    const maxX = Math.max(...allPositions.map(p => p.x));
    const minY = Math.min(...allPositions.map(p => p.y));
    const maxY = Math.max(...allPositions.map(p => p.y));

    const totalWidth = (maxX - minX) * (this.cellSize + this.gridSpacing) + this.cellSize;
    const totalHeight = (maxY - minY) * (this.cellSize + this.gridSpacing) + this.cellSize;

    // 使布局居中，向下留出顶部标题区域
    this.gridStartX = (this.width - totalWidth) / 2;
    this.gridStartY = 125 - this.cellSize / 3;

    // 底层边界（像素范围），用于后续各层位置的限制
    this.bottomBounds = {
      left: this.gridStartX,
      top: this.gridStartY,
      right: this.gridStartX + totalWidth,
      bottom: this.gridStartY + totalHeight
    };

    // 存储网格范围与步长（用于命中检测）
    this.minGridX = minX;
    this.maxGridX = maxX;
    this.minGridY = minY;
    this.maxGridY = maxY;
    this.stepX = this.cellSize + this.gridSpacing;
    this.stepY = this.cellSize + this.gridSpacing;
    this.matrixCols = this.maxGridX - this.minGridX + 1; // 预期=5
    this.matrixRows = this.maxGridY - this.minGridY + 1; // 预期=5

    // 初始化网格单元格位置
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

    // 计算卡槽位置（在整个布局下方）
    const slotY = this.gridStartY + totalHeight + 40;
    this.cardSlot.y = slotY;
    this.cardSlot.x = (this.width - this.cardSlot.maxCards * (this.cardSlot.cardWidth + this.cardSlot.cardSpacing)) / 2;
    this.cardSlot.width = this.cardSlot.maxCards * (this.cardSlot.cardWidth + this.cardSlot.cardSpacing);

    // 移出卡片区域位置（在卡槽下方）
    this.removedCards.y = slotY + this.cardSlot.height + 30;
    this.removedCards.x = 20;
    this.removedCards.width = this.width - 40;

    // 边界保护
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
  
    // 检查卡槽中卡片点击（禁用点击移出，必须通过“移出”按钮）
    const clickedSlotCard = this.getClickedSlotCard(x, y);
    if (clickedSlotCard !== -1) {
      // 禁止通过点击卡槽中的卡片移出，必须点击“移出”按钮才会移动到移出卡槽区域
      return; // 直接吞掉点击，不执行移动
    }
  
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
    
    const availableWidth = this.removedCards.width - 20;
    const totalCardWidth = this.removedCards.cards.length * this.removedCards.cardWidth + 
                          (this.removedCards.cards.length - 1) * this.removedCards.cardSpacing;
    
    let actualCardSpacing = this.removedCards.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.removedCards.cards.length * this.removedCards.cardWidth) / 
                                     (this.removedCards.cards.length - 1));
    }
    
    const clickYOffset = 0;
    
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      const cardX = this.removedCards.x + 10 + i * (this.removedCards.cardWidth + actualCardSpacing);
      const hitTop = this.removedCards.y + clickYOffset;
      const hitBottom = hitTop + this.removedCards.cardHeight;
      
      if (x >= cardX && x <= cardX + this.removedCards.cardWidth &&
          y >= hitTop && y <= hitBottom) {
        return i;
      }
    }
    
    return -1;
  }

  getClickedSlotCard(x, y) {
    if (this.cardSlot.cards.length === 0) {
      return -1;
    }
    
    const availableWidth = this.cardSlot.width - 20;
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    let actualCardSpacing = this.cardSlot.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }
    
    const clickYOffset = 5;
    
    for (let i = 0; i < this.cardSlot.cards.length; i++) {
      const cardX = this.cardSlot.x + 10 + i * (this.cardSlot.cardWidth + actualCardSpacing);
      const cardY = this.cardSlot.y + clickYOffset;
      
      if (cardX + this.cardSlot.cardWidth <= this.cardSlot.x + this.cardSlot.width - 10) {
        if (x >= cardX && x <= cardX + this.cardSlot.cardWidth &&
            y >= cardY && y <= cardY + this.cardSlot.cardHeight) {
          return i;
        }
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
      if (!this.hasCompletableIdiom()) {
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
    this.checkIdiomCompletion();
    this.checkGameEnd();
    this.startCardMoveAnimation(card, block.x, block.y);
  }

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
    const availableWidth = this.cardSlot.width - 20;
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    let actualCardSpacing = this.cardSlot.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }

    const targetX = this.cardSlot.x + 10 + targetIndex * (this.cardSlot.cardWidth + actualCardSpacing) + this.cardSlot.cardWidth / 2;
    const targetY = this.cardSlot.y + 5 + this.cardSlot.cardHeight / 2;

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

    // 若按钮已禁用，直接不响应
    if (button.disabled) return;

    // 先判断是否可执行（不符合条件不扣减机会，提示“目前没有可执行目标”）
    let canExecute = true;
    if (buttonId === 'remove' || buttonId === 'undo') {
      // 第二关：卡槽中有卡片即可执行
      canExecute = this.cardSlot && Array.isArray(this.cardSlot.cards) && this.cardSlot.cards.length > 0;
    } else if (buttonId === 'shuffle') {
      // 主棋盘剩余可见卡片（status === 0）> 0 才可执行
      const availableCount = (this.allBlocks || []).filter(block => block.status === 0).length;
      canExecute = availableCount > 0;
    }

    if (!canExecute) {
      if (this.game && typeof this.game.showModalDialog === 'function') {
        console.log('无法执行此操作')
      }
      return;
    }

    // 使用次数限制判定，仅在可执行时才进行扣减
    const limit = this.buttonUsageLimits[buttonId];
    if (limit != null) {
      const remaining = this.buttonUsageRemaining[buttonId] ?? limit;
      if (remaining <= 0) {
        if (this.game && typeof this.game.showModalDialog === 'function') {
          console.log('使用次数已用完')
        }
        return;
      }

      // 执行动作
      if (button.action) {
        button.action();
      }

      // 扣减一次机会（执行成功后）
      this.buttonUsageRemaining[buttonId] = remaining - 1;
      if (this.buttonUsageRemaining[buttonId] <= 0) {
        button.disabled = true;
      }

      // 提示已扣减一次机会
      if (this.game && typeof this.game.showModalDialog === 'function') {
        // this.game.showModalDialog('提示', '已扣减一次机会', [
        //   { text: '知道了' }
        // ]);
        console.log('已扣减一次机会')
      }
    } else {
      // 无次数限制的按钮，直接执行
      if (button.action) {
        button.action();
      }
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
    // 动态调整移出卡片区域的高度
    const maxCardsPerRow = Math.floor((this.removedCards.width - 20) / (this.removedCards.cardWidth + this.removedCards.cardSpacing));
    const rows = Math.ceil(this.removedCards.cards.length / maxCardsPerRow);
    this.removedCards.height = Math.max(50, rows * (this.removedCards.cardHeight + 5));
  }

  addRemovedCardToSlot(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.removedCards.cards.length && this.cardSlot.cards.length < this.cardSlot.maxCards) {
      const card = this.removedCards.cards.splice(cardIndex, 1)[0];
      this.cardSlot.cards.push(card);
      this.updateRemovedCardsLayout();
    }
  }

  shuffleBlocks() {
    const availableBlocks = this.allBlocks.filter(block => block.status === 0);
    const characters = availableBlocks.map(block => block.type);
    this.shuffleArray(characters);
    
    availableBlocks.forEach((block, index) => {
      block.type = characters[index];
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
              await this.game.initLevel3();
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
    context.fillText('第2关', this.width / 2, 85);

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
    const h = this.cardSlot.height;
    const radius = 10;

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

    // 计算插槽位置（空位也画占位）
    const availableWidth = w - 20;
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    let actualCardSpacing = this.cardSlot.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }

    for (let i = 0; i < this.cardSlot.maxCards; i++) {
      const cardX = x + 10 + i * (this.cardSlot.cardWidth + actualCardSpacing);
      const cardY = y + 5; // 点击命中区域与渲染对齐

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
        this.ctx.font = 'normal 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(card.characterType, drawX + drawWidth / 2, drawY + drawHeight / 2 + 6);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }

  renderRemovedCards() {
    if (this.removedCards.cards.length === 0) return;
    
    this.ctx.save();
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    const availableWidth = this.removedCards.width - 20;
    const maxCardsPerRow = Math.floor(availableWidth / (this.removedCards.cardWidth + this.removedCards.cardSpacing));
    
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      const card = this.removedCards.cards[i];
      const row = Math.floor(i / maxCardsPerRow);
      const col = i % maxCardsPerRow;
      
      const cardX = this.removedCards.x + 10 + col * (this.removedCards.cardWidth + this.removedCards.cardSpacing);
      const cardY = this.removedCards.y + 5 + row * (this.removedCards.cardHeight + 5);
      
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillRect(cardX, cardY, this.removedCards.cardWidth, this.removedCards.cardHeight);
      
      this.ctx.strokeStyle = '#666666';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(cardX, cardY, this.removedCards.cardWidth, this.removedCards.cardHeight);
      
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(card.characterType, cardX + this.removedCards.cardWidth / 2, 
                        cardY + this.removedCards.cardHeight / 2 + 5);
    }
    
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

} // end of Level4 class
module.exports = Level2;