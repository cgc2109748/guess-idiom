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
    this.difficultyLevel = 6;
    this.showMatrixOverlay = false;
    this.buttonUsageLimits = { remove: 3, undo: 3, shuffle: 3 };
    this.buttonUsageRemaining = { remove: 3, undo: 3, shuffle: 3 };
    this.bgImage = null;
    this.bgImageLoaded = false;
    this.allBlocks = [];
  }
  
  async init() {
    // 加载背景图片和成语数据，然后初始化关卡
    await this.loadBackgroundImage();
    await this.loadIdiomData();
    this.initLevel();
    // 清空移出卡片区域并关闭弹窗（保持与第一关一致的初始化体验）
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
        // 微信小程序环境
        this.bgImage = wx.createImage();
        this.bgImage.onload = () => { this.bgImageLoaded = true; resolve(); };
        this.bgImage.onerror = () => { console.warn('背景图片加载失败'); this.bgImageLoaded = false; resolve(); };
        this.bgImage.src = 'gameBG.png';
      } else {
        // 浏览器环境
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
        // 微信小程序环境
        data = await new Promise((resolve, reject) => {
          wx.request({
            url: './data.json',
            success: (res) => resolve(res.data),
            fail: (res) => reject(res)
          });
        });
      } else {
        // 浏览器环境
        const response = await fetch('./data.json');
        data = await response.json();
      }
      this.idiomsData = data.idioms || [];
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(this.idiomsData.length, 9);
      for (const index of randomIndices) {
        this.selectedIdioms.push(this.idiomsData[index]);
      }
      // 收集所有选中成语的字符并打乱
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        if (idiom && idiom.idiom) {
          this.idiomCharacters.push(...idiom.idiom.split(''));
        }
      });
      this.shuffleArray(this.idiomCharacters);
    } catch (error) {
      console.error('加载成语数据失败:', error);
      // 使用默认数据：从 data.js 中随机选择
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(require('./data.js').length, 56);
      for (const index of randomIndices) {
        this.selectedIdioms.push(require('./data.js')[index]);
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
    // 难度1：不打乱
    if (this.difficultyLevel === 1) return;
    // Fisher–Yates 打乱
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  initLevel() {
    // 初始化猜成语游戏
    this.gameDate = '9月15日';
    
    // 菱形布局配置
    this.diamondLayers = 8; // 每一叠卡片都有8层
    this.bottomRowLayers = 0; // 不要下方区域
    this.bottomRowCols = 0; // 不要下方区域
    
    // 四个角的三角形区域配置
    this.triangleLayers = 8; // 每个三角形区域的卡片层数
    
    this.cellSize = 35; // 缩小卡片尺寸使整个区域在页面上半部分
    this.gridSpacing = 1; // 进一步减小间距
    this.layerOffset = 0; // 不使用层级偏移

    // 点击校准偏移
    this.gridHitOffsetX = 0;
    this.gridHitOffsetY = (3 * this.cellSize) / 4 + this.gridSpacing;
    this.extraHitHeightY = 0;
    
    // 字符类型（基于成语字符）
    this.characterTypes = {};
    const colors = ['#ff8c42', '#ffd700', '#4caf50', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    
    // 为每个成语字符创建类型
    this.idiomCharacters.forEach((char, index) => {
      this.characterTypes[char] = {
        name: char,
        color: colors[index % colors.length],
        icon: char
      };
    });
    
    // 初始化块数据结构
    this.initBlocks();
    
    // 选中的字符类型
    this.selectedCharacterType = this.idiomCharacters[0];
    
    // 初始化卡槽
    this.initCardSlot();
    
    // 计算网格位置
    this.calculateGrid();

    // 基于用户提供的第一行坐标进行命中区域校准（全局偏移与尺寸修正）
    this.hitCalibration = { offsetX: 0, offsetY: 0, extraWidth: 0, extraHeight: 0 };
    (() => {
      try {
        const allPositions = [...this.diamondPositions, ...this.trianglePositions];
        if (allPositions.length === 0) return;
        const minY = Math.min(...allPositions.map(p => p.y));
        const rowCells = allPositions
          .filter(p => p.y === minY)
          .map(p => (this.gridCells[p.x] && this.gridCells[p.x][p.y]) ? this.gridCells[p.x][p.y] : null)
          .filter(Boolean);
        if (rowCells.length === 0) return;
        const leftCell = rowCells.reduce((min, c) => c.x < min.x ? c : min);
        const rightCell = rowCells.reduce((max, c) => c.x > max.x ? c : max);
        const computedLeftTopX = leftCell.x;
        const computedLeftTopY = leftCell.y;
        const computedRightBottomX = rightCell.x + rightCell.width;
        const computedRightBottomY = rightCell.y + rightCell.height;
        const targetLeftTopX = 177.484375;
        const targetLeftTopY = 137.875;
        const targetRightBottomX = 212.953125;
        const targetRightBottomY = 179.28125;
        this.hitCalibration.offsetX = targetLeftTopX - computedLeftTopX;
        this.hitCalibration.offsetY = targetLeftTopY - computedLeftTopY;
        const computedWidth = computedRightBottomX - computedLeftTopX;
        const computedHeight = computedRightBottomY - computedLeftTopY;
        const targetWidth = targetRightBottomX - targetLeftTopX;
        const targetHeight = targetRightBottomY - targetLeftTopY;
        this.hitCalibration.extraWidth = targetWidth - computedWidth;
        this.hitCalibration.extraHeight = targetHeight - computedHeight;
        console.log('[命中校准] offsetX:', this.hitCalibration.offsetX.toFixed(6), 'offsetY:', this.hitCalibration.offsetY.toFixed(6), 'extraW:', this.hitCalibration.extraWidth.toFixed(6), 'extraH:', this.hitCalibration.extraHeight.toFixed(6));
      } catch (e) {
        console.warn('命中校准失败：', e);
      }
    })();
    
    // 初始化按钮
    this.initButtons();
    
    // 打印每行卡片的边界坐标
    this.printRowBounds();
  }
  
  printRowBounds() { /* 调试函数移除 */ return; }
  
  initCardSlot() {
    // 卡槽配置
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
    
    // 移出卡片区域配置
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
    
    // 移动动画相关
    this.movingCard = null;
    this.animationDuration = 500; // 毫秒
  }
  
  // 初始化块数据结构（菱形布局 + 四个三角形区域）
  initBlocks() {
    this.allBlocks = [];
    this.blockData = {};
    this.diamondPositions = []; // 菱形位置
    this.trianglePositions = []; // 四个三角形区域位置
    
    // 生成菱形位置
    this.generateDiamondPositions();
    
    // 生成四个三角形区域位置
    this.generateTrianglePositions();
    
    // 创建菱形区域的块
    let blockId = 0;
    this.diamondPositions.forEach(pos => {
      for (let layer = 0; layer < this.diamondLayers; layer++) {
        const charType = this.idiomCharacters[blockId % this.idiomCharacters.length];
        const block = {
          id: blockId,
          x: pos.x,
          y: pos.y,
          level: layer + 1,
          type: charType,
          status: 0,
          higherThanBlocks: [],
          lowerThanBlocks: [],
          area: 'diamond' // 标记为菱形区域
        };
        
        this.allBlocks.push(block);
        this.blockData[blockId] = block;
        blockId++;
      }
    });
    
    // 创建四个三角形区域的块
    this.trianglePositions.forEach(pos => {
      for (let layer = 0; layer < this.triangleLayers; layer++) {
        const charType = this.idiomCharacters[blockId % this.idiomCharacters.length];
        const block = {
          id: blockId,
          x: pos.x,
          y: pos.y,
          level: layer + 1,
          type: charType,
          status: 0,
          higherThanBlocks: [],
          lowerThanBlocks: [],
          area: pos.area // 标记为对应的三角形区域
        };
        
        this.allBlocks.push(block);
        this.blockData[blockId] = block;
        blockId++;
      }
    });
    
    // 建立层级关系
    this.allBlocks.forEach(block => {
      this.genLevelRelation(block);
    });
  }
  
  // 生成菱形位置（8层菱形）
  generateDiamondPositions() {
    this.diamondPositions = [];
    const centerX = 4; // 菱形中心X坐标
    const centerY = 4; // 菱形中心Y坐标
    
    // 菱形的每一行（删除第四行）
    const diamondPattern = [
      [0], // 第1行：1个
      [-1, 1], // 第2行：2个
      [-2, 0, 2], // 第3行：3个
      // 删除第4行：[-3, -1, 1, 3]
      [-3, -1, 1, 3], // 第5行：4个
      [-2, 0, 2], // 第6行：3个
      [-1, 1], // 第7行：2个
      [0] // 第8行：1个
    ];
    
    diamondPattern.forEach((row, rowIndex) => {
      const y = centerY + rowIndex - 3; // 调整Y坐标使菱形居中（删除一行后调整）
      row.forEach(offset => {
        this.diamondPositions.push({
          x: centerX + offset,
          y: y
        });
      });
    });
  }
  
  // 生成四个三角形区域位置
  generateTrianglePositions() {
    this.trianglePositions = [];
    
    // 左上角三角形区域（倒三角形：第一行2列，第二行1列与第一列对齐）
    // 与菱形区域的第2、3行对齐（Y坐标2、3）
    this.trianglePositions.push(
      { x: 0, y: 2, area: 'topLeft' },
      { x: 1, y: 2, area: 'topLeft' },
      { x: 0, y: 3, area: 'topLeft' }
    );
    
    // 右上角三角形区域（倒三角形：第一行2列，第二行1列与第二列对齐）
    // 与菱形区域的第2、3行对齐（Y坐标2、3）
    this.trianglePositions.push(
      { x: 7, y: 2, area: 'topRight' },
      { x: 8, y: 2, area: 'topRight' },
      { x: 8, y: 3, area: 'topRight' }
    );
    
    // 左下角三角形区域（正三角形：第一行1列与第二行第一列对齐，第二行2列）
    // 与菱形区域的第6、7行对齐（Y坐标5、6）
    this.trianglePositions.push(
      { x: 0, y: 5, area: 'bottomLeft' },
      { x: 0, y: 6, area: 'bottomLeft' },
      { x: 1, y: 6, area: 'bottomLeft' }
    );
    
    // 右下角三角形区域（正三角形：第一行1列与第二行第二列对齐，第二行2列）
    // 与菱形区域的第6、7行对齐（Y坐标5、6）
    this.trianglePositions.push(
      { x: 8, y: 5, area: 'bottomRight' },
      { x: 7, y: 6, area: 'bottomRight' },
      { x: 8, y: 6, area: 'bottomRight' }
    );
  }
  
  // 生成块的层级关系
  genLevelRelation(block) {
    const { x, y, level, area } = block;
    
    // 清空之前的关系
    block.higherThanBlocks = [];
    block.lowerThanBlocks = [];
    
    // 在同一位置的其他块建立层级关系
    const blocksInSamePosition = this.allBlocks.filter(otherBlock => 
      otherBlock.x === x && otherBlock.y === y && otherBlock.area === area
    );
    
    blocksInSamePosition.forEach(otherBlock => {
      if (otherBlock.id !== block.id) {
        if (otherBlock.level > level) {
          // 其他块压在当前块上面
          block.higherThanBlocks.push(otherBlock);
          otherBlock.lowerThanBlocks.push(block);
        }
      }
    });
  }
  
  calculateGrid() {
    // 计算所有区域的边界（菱形 + 三角形）
    const allPositions = [...this.diamondPositions, ...this.trianglePositions];
    const minX = Math.min(...allPositions.map(p => p.x));
    const maxX = Math.max(...allPositions.map(p => p.x));
    const minY = Math.min(...allPositions.map(p => p.y));
    const maxY = Math.max(...allPositions.map(p => p.y));
    
    // 计算总布局尺寸（菱形区域 + 三角形区域）
    const totalWidth = (maxX - minX) * (this.cellSize + this.gridSpacing) + this.cellSize;
    const totalHeight = (maxY - minY) * (this.cellSize + this.gridSpacing) + this.cellSize;
    
    // 计算起始位置使布局居中，并向上移动三分之一卡片高度
    this.gridStartX = (this.width - totalWidth) / 2;
    this.gridStartY = 120 - this.cellSize / 3; // 从顶部留出空间给标题、日期和剩余卡片数，向上移动1/3卡片高度
    
    // 存储网格范围与步长，用于“7行×9列”矩阵命中检测
    this.minGridX = minX;
    this.maxGridX = maxX;
    this.minGridY = minY;
    this.maxGridY = maxY;
    this.stepX = this.cellSize + this.gridSpacing;
    this.stepY = this.cellSize + this.gridSpacing;
    this.matrixCols = this.maxGridX - this.minGridX + 1; // 预期=9
    this.matrixRows = this.maxGridY - this.minGridY + 1; // 预期=7
    
    // 初始化网格单元格位置（菱形区域 + 三角形区域）
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
    
    // 计算移出卡片区域位置（在卡槽下方，与按钮保持间隔）
    this.removedCards.y = slotY + this.cardSlot.height + 30; // 与卡槽保持30px间隙，与按钮保持距离
    this.removedCards.x = 20;
    this.removedCards.width = this.width - 40;
    
    // 确保移出卡片区域不会超出画布
    if (this.removedCards.y + this.removedCards.height > this.height - 100) {
      this.removedCards.y = this.height - this.removedCards.height - 100;
    }
  }
  
  initButtons() {
    // 计算按钮布局 - 三个按钮居中排列
    const buttonWidth = 80;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const totalWidth = 3 * buttonWidth + 2 * buttonSpacing;
    const startX = (this.width - totalWidth) / 2;
    const buttonY = this.height - 120; // 向下调整到距离底部120像素
    
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
        action: () => this.removeLastCard()
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
    // 打印点击坐标到控制台
    // console.log(`点击坐标: (${x}, ${y})`);
    // debug removed
    if (this.game.showModal) {
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
        this.game.showModal = false;
        return;
      }
    }
    
    // 检查按钮点击
    for (let button of this.buttons) {
      // 对齐渲染：不再对按钮点击区域施加额外偏移
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
    
    // 检查卡槽中卡片点击
    const clickedSlotCard = this.getClickedSlotCard(x, y);
    if (clickedSlotCard !== -1) {
      this.moveSlotCardToRemoved(clickedSlotCard);
      return;
    }
    
    // 检查网格点击（按钮与移出卡槽不受影响）
    // 命中判定偏移在 getClickedBlock 内部施加到九宫格的矩形上
    const clickedBlock = this.getClickedBlock(x, y);
    if (clickedBlock) {
      this.doClickBlock(clickedBlock);
    }
  }
  
  getClickedRemovedCard(x, y) {
    // 检查是否点击了移出的卡片
    if (this.removedCards.cards.length === 0) {
      return -1;
    }
    
    const availableWidth = this.removedCards.width - 20; // 左右各留10px边距
    const totalCardWidth = this.removedCards.cards.length * this.removedCards.cardWidth + 
                          (this.removedCards.cards.length - 1) * this.removedCards.cardSpacing;
    
    // 如果总宽度超出可用宽度，调整卡片间距
    let actualCardSpacing = this.removedCards.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.removedCards.cards.length * this.removedCards.cardWidth) / 
                                     (this.removedCards.cards.length - 1));
    }

    // 进一步微调：高度与渲染一致，则继续向下校正 1/3 × 卡片高度
    // 最终总校正量 = 8/3 × 卡片高度
    const clickYOffset = (8 * this.removedCards.cardHeight) / 3;
    
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
    // 检查是否点击了卡槽中的卡片
    if (this.cardSlot.cards.length === 0) {
      return -1;
    }
    
    // 计算可用宽度和每个卡片位置的实际宽度
    const availableWidth = this.cardSlot.width - 20; // 左右各留10px边距
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    
    // 如果总宽度超出可用宽度，调整卡片间距
    let actualCardSpacing = this.cardSlot.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }
    
    // 点击命中区域与渲染对齐：renderCardSlot 使用 y = this.cardSlot.y + 5
    const clickYOffset = 5;
    
    for (let i = 0; i < this.cardSlot.cards.length; i++) {
      const cardX = this.cardSlot.x + 10 + i * (this.cardSlot.cardWidth + actualCardSpacing);
      const cardY = this.cardSlot.y + clickYOffset;
      
      // 确保不超出卡槽边界
      if (cardX + this.cardSlot.cardWidth <= this.cardSlot.x + this.cardSlot.width - 10) {
        if (x >= cardX && x <= cardX + this.cardSlot.cardWidth &&
            y >= cardY && y <= cardY + this.cardSlot.cardHeight) {
          return i;
        }
      }
    }
    
    return -1;
  }
  
  getClickedBlock(x, y) {
    // 与渲染网格严格对齐的命中检测：使用 gridStartX/Y 与 step 直接量化
    if (this.gridStartX == null || this.gridStartY == null) return null;
    const stepX = this.stepX || (this.cellSize + this.gridSpacing);
    const stepY = this.stepY || (this.cellSize + this.gridSpacing);
    const minGX = (this.minGridX != null) ? this.minGridX : 0;
    const minGY = (this.minGridY != null) ? this.minGridY : 0;
    const cols = this.matrixCols || ((this.maxGridX != null && this.minGridX != null) ? (this.maxGridX - this.minGridX + 1) : 0);
    const rows = this.matrixRows || ((this.maxGridY != null && this.minGridY != null) ? (this.maxGridY - this.minGridY + 1) : 0);

    const colIndex = Math.floor((x - this.gridStartX) / stepX);
    const rowIndex = Math.floor((y - this.gridStartY) / stepY);
    if (colIndex < 0 || rowIndex < 0 || colIndex >= cols || rowIndex >= rows) return null;

    const gridX = minGX + colIndex;
    const gridY = minGY + rowIndex;
    
    const topBlock = this.getTopClickableBlock(gridX, gridY);
    return topBlock || null;
  }
  
  handleGridClick(row, col) {
    const topBlock = this.getTopClickableBlock(row, col);
    if (topBlock) {
      this.doClickBlock(topBlock);
    }
  }
  
  getTopClickableBlock(row, col) {
    // 找到指定位置的所有块
    const blocksAtPosition = this.allBlocks.filter(block => 
      block.x === row && block.y === col && block.status === 0
    );
    
    // 找到最高层的可点击块
    let topBlock = null;
    let maxLevel = 0;
    
    for (let block of blocksAtPosition) {
      if (this.isBlockClickable(block) && block.level > maxLevel) {
        topBlock = block;
        maxLevel = block.level;
      }
    }
    
    return topBlock;
  }
  
  isBlockClickable(block) {
    // 检查是否有其他块压在上面
    return block.higherThanBlocks.every(higherBlock => higherBlock.status !== 0);
  }
  
  doClickBlock(block) {
    // 检查是否可以点击
    if (block.status !== 0 || !this.isBlockClickable(block)) {
      return;
    }
    
    // 检查卡槽是否已满
    if (this.cardSlot.cards.length >= this.cardSlot.maxCards) {
      // 卡槽已满，检查是否有可消除的成语
      if (!this.hasCompletableIdiom()) {
        // 没有可消除的成语，游戏失败
        this.showGameFailure();
      }
      return;
    }
    
    // 标记块为已点击
    block.status = 1;
    
    // 创建卡片对象
    const card = {
      characterType: block.type,
      sourceRow: block.x,
      sourceCol: block.y,
      sourceLayer: block.level - 1,
      blockId: block.id,
      id: Date.now() + Math.random()
    };
    
    // 添加到卡槽
    this.cardSlot.cards.push(card);
    
    // 更新层级关系
    this.updateBlockRelations(block);
    
    // 检查是否完成成语
    this.checkIdiomCompletion();
    
    // 检查游戏是否结束（没有可点击的块）
    this.checkGameEnd();
    
    // 启动移动动画
    this.startCardMoveAnimation(card, block.x, block.y);
  }
  
  // 更新块的层级关系
  updateBlockRelations(removedBlock) {
    // 移除被点击块的层级关系
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
  
  startCardMoveAnimation(card, sourceRow, sourceCol) {
    const sourceCell = this.gridCells[sourceRow][sourceCol];
    const targetIndex = this.cardSlot.cards.length - 1;
    
    // 计算目标位置
    const availableWidth = this.cardSlot.width - 20;
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    let actualCardSpacing = this.cardSlot.cardWidth;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }
    
    const targetX = this.cardSlot.x + 10 + targetIndex * (this.cardSlot.cardWidth + actualCardSpacing) + this.cardSlot.cardWidth / 2;
    const targetY = this.cardSlot.y + 5 + this.cardSlot.cardHeight / 2;
    
    this.movingCard = {
      card: card,
      startX: sourceCell.x + sourceCell.width / 2,
      startY: sourceCell.y + sourceCell.height / 2,
      targetX: targetX,
      targetY: targetY,
      currentX: sourceCell.x + sourceCell.width / 2,
      currentY: sourceCell.y + sourceCell.height / 2,
      startTime: Date.now()
    };
  }
  
  handleButtonClick(buttonId) {
    const button = this.buttons.find(b => b.id === buttonId);
    if (!button) return;

    // 使用次数限制判定（第二关每个按钮3次）
    const limit = this.buttonUsageLimits[buttonId];
    if (limit != null) {
      const remaining = this.buttonUsageRemaining[buttonId] ?? limit;
      if (remaining <= 0) {
        if (this.game && typeof this.game.showModalDialog === 'function') {
          this.game.showModalDialog('提示', '使用机会已经没有了', [
            { text: '知道了' }
          ]);
        }
        return;
      }
      // 消耗一次机会并更新禁用状态
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
      
      // 恢复对应的块
      const block = this.blockData[lastCard.blockId];
      if (block) {
        block.status = 0;
        
        // 重新建立层级关系
        this.allBlocks.forEach(b => {
          if (b.id !== block.id) {
            this.genLevelRelation(b);
          }
        });
        this.genLevelRelation(block);
      }
    }
  }
  
  removeLastCard() {
    // 移出卡槽中的前四个卡片到下方区域
    const cardsToRemove = Math.min(4, this.cardSlot.cards.length);
    console.log("outside"+`Removing ${cardsToRemove} cards`);
    if (cardsToRemove > 0) {
      // 将前四个卡片移到移出区域
      console.log("inside"+`Removing ${cardsToRemove} cards`);
      const removedCards = this.cardSlot.cards.splice(0, cardsToRemove);
      this.removedCards.cards = this.removedCards.cards.concat(removedCards);
      
      // 更新移出卡片区域的位置和大小
      this.updateRemovedCardsLayout();
      
      // 限制：移出区最多10张，超过立即判定失败
      if (this.removedCards.maxCards != null && this.removedCards.cards.length > this.removedCards.maxCards) {
        this.showGameFailure();
      }
    }
  }
  
  updateRemovedCardsLayout() {
    // 计算移出卡片区域的位置（卡槽下方，向下移动以避免与卡槽重叠）
    this.removedCards.x = this.cardSlot.x;
    this.removedCards.y = this.cardSlot.y + this.cardSlot.height + 10; // 向下留出40像素间距
    this.removedCards.width = this.cardSlot.width;
  }
  
  addRemovedCardToSlot(cardIndex) {
    // 将移出的卡片重新添加到卡槽中
    if (cardIndex >= 0 && cardIndex < this.removedCards.cards.length && 
        this.cardSlot.cards.length < this.cardSlot.maxCards) {
      const card = this.removedCards.cards.splice(cardIndex, 1)[0];
      this.cardSlot.cards.push(card);
      
      // 检查是否完成成语
      this.checkIdiomCompletion();
    }
  }
  
  shuffleBlocks() {
    // 重新洗牌所有未被选择的块
    const availableCharacters = [];
    
    // 收集所有未被选择的块的字符
    this.allBlocks.forEach(block => {
      if (block.status === 0) {
        availableCharacters.push(block.type);
      }
    });
    
    // 打乱字符数组
    this.shuffleArray(availableCharacters);
    
    // 重新分配字符给未被选择的块
    let charIndex = 0;
    this.allBlocks.forEach(block => {
      if (block.status === 0) {
        block.type = availableCharacters[charIndex];
        charIndex++;
      }
    });
  }
  
  async resetLevel() {
    // 重新加载成语数据并重置关卡
    await this.loadIdiomData();
    this.initLevel();
    // 清空移出卡片区域
    this.removedCards.cards = [];
    // 关闭弹窗
    this.game.modalConfig.show = false;
  }
  
  switchCharacterType() {
    const types = Object.keys(this.characterTypes);
    const currentIndex = types.indexOf(this.selectedCharacterType);
    const nextIndex = (currentIndex + 1) % types.length;
    this.selectedCharacterType = types[nextIndex];
  }
  
  // 检查游戏是否结束
  checkLevelComplete() {
    // 检查九宫格是否还有未选择的卡片
    let hasRemainingBlocks = false;
    for (let row = 0; row < this.chessBoard.length; row++) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        const blocks = this.chessBoard[row][col].blocks;
        for (let block of blocks) {
          if (block.status === 0) { // status 0 表示未被选择
            hasRemainingBlocks = true;
            break;
          }
        }
        if (hasRemainingBlocks) break;
      }
      if (hasRemainingBlocks) break;
    }
    
    // 通关条件：所有成语完成 + 九宫格无剩余卡片 + 卡槽为空
    if (this.selectedIdioms.length === 0 && !hasRemainingBlocks && this.cardSlot.cards.length === 0) {
      this.game.showModalDialog(
        '恭喜过关',
        '您已成功完成所有成语！',
        [
          {
            text: '下一关',
            callback: async () => {
              if (this.game && this.game.initLevel2) {
                await this.game.initLevel2();
                if (this.game.GameState) {
                  this.game.gameState = this.game.GameState.LEVEL2;
                } else {
                  // 若未暴露枚举，直接设置字符串
                  this.game.gameState = 'level2';
                }
              }
            }
          }
        ]
      );
    }
  }
  
  // 检查是否有可完成的成语
  hasCompletableIdiom() {
    // 获取卡槽中的字符
    const cardCharacters = this.cardSlot.cards.map(card => card.characterType);
    
    // 检查每个成语是否可以完成
    for (let idiom of this.selectedIdioms) {
      const idiomChars = idiom.idiom.split('');
      const charCount = {};
      
      // 统计成语中每个字符的需求数量
      for (let char of idiomChars) {
        charCount[char] = (charCount[char] || 0) + 1;
      }
      
      // 统计卡槽中每个字符的数量
      const cardCharCount = {};
      for (let char of cardCharacters) {
        cardCharCount[char] = (cardCharCount[char] || 0) + 1;
      }
      
      // 检查是否满足成语的字符需求
      let canComplete = true;
      for (let char in charCount) {
        if ((cardCharCount[char] || 0) < charCount[char]) {
          canComplete = false;
          break;
        }
      }
      
      if (canComplete) {
        return true;
      }
    }
    
    return false;
  }
  
  // 显示游戏失败弹窗
  showGameFailure() {
    this.game.showModalDialog(
      '游戏失败',
      '卡槽已满且没有可消除的成语！',
      [
        {
          text: '再试一次',
          callback: () => {
            if (this.game && typeof this.game.initLevel1 === 'function') {
              this.game.initLevel1();
              this.game.gameState = this.game.GameState.LEVEL1;
            } else {
              this.resetLevel();
            }
          }
        },
        {
          text: '返回主页',
          callback: () => {
            // 返回主页逻辑
            if (this.game.showMainMenu) {
              this.game.showMainMenu();
            } else {
              console.log('返回主页');
              // 可以在这里添加返回主页的具体逻辑
            }
          }
        }
      ]
    );
  }

  checkGameEnd() {
    // 检查是否还有可点击的块
    let hasClickableBlocks = false;
    for (let row = 0; row < this.chessBoard.length; row++) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        const blocks = this.chessBoard[row][col].blocks;
        for (let block of blocks) {
          if (block.status === 0 && this.isBlockClickable(block)) {
            hasClickableBlocks = true;
            break;
          }
        }
        if (hasClickableBlocks) break;
      }
      if (hasClickableBlocks) break;
    }
    
    // 如果没有可点击的块，检查卡槽中的卡片是否能完成剩余成语
    if (!hasClickableBlocks && this.cardSlot.cards.length > 0) {
      // 最后一次检查成语完成情况
      this.checkIdiomCompletion();
      
      // 如果还有未完成的成语，说明游戏失败
      if (this.selectedIdioms.length > 0) {
        // TODO: 后续补全没有更多可点击块时的处理逻辑
        // console.log('没有更多可点击的块，但还有未完成的成语');
      }
    }
  }
  
  checkIdiomCompletion() {
    const collectedChars = this.cardSlot.cards.map(card => card.characterType);
    
    // 检查是否完成了任意一个成语
    for (let idiom of this.selectedIdioms) {
       // 检查是否包含成语的所有字符（不考虑顺序和数量限制）
      const idiomChars = idiom.idiom.split('');
      const usedCardIndices = []; // 记录用于组成成语的卡片索引
      let isMatch = true;
      
      // 统计成语中每个字符的需要数量
      const charCount = {};
      for (let char of idiomChars) {
        charCount[char] = (charCount[char] || 0) + 1;
      }
      
       // 统计卡槽中每个字符的可用数量
      const availableCount = {};
      for (let char of collectedChars) {
        availableCount[char] = (availableCount[char] || 0) + 1;
      }
      
       // 检查是否有足够的字符
      for (let char in charCount) {
        if (!availableCount[char] || availableCount[char] < charCount[char]) {
            isMatch = false;
            break;
          }
      }
      
       // 如果字符数量匹配，找到具体的卡片索引
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
         // 移除已完成的成语
      this.selectedIdioms = this.selectedIdioms.filter(item => item !== idiom);
      
         // 只移除用于组成成语的卡片
         usedCardIndices.sort((a, b) => b - a); // 从后往前删除，避免索引变化
        for (let index of usedCardIndices) {
          this.cardSlot.cards.splice(index, 1);
        }
        
        if (this.selectedIdioms.length === 0) {
           // 检查是否真正通关：所有成语完成 + 九宫格无剩余卡片 + 卡槽为空
          this.checkLevelComplete();
        }
        return;
      }
    }
  }
  
  update() {
    // 更新卡片移动动画
    if (this.movingCard) {
      const elapsed = Date.now() - this.movingCard.startTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // 计算当前位置
      this.movingCard.currentX = this.movingCard.startX + (this.movingCard.targetX - this.movingCard.startX) * easeProgress;
      this.movingCard.currentY = this.movingCard.startY + (this.movingCard.targetY - this.movingCard.startY) * easeProgress;
      
      // 动画完成
      if (progress >= 1) {
        this.movingCard = null;
      }
    }
  }
  
  render(ctx) {
    // 使用传入的ctx或者默认的this.ctx
    const context = ctx || this.ctx;
    
    // 绘制背景图片
    if (this.bgImageLoaded && this.bgImage) {
      const imageAspect = this.bgImage.width / this.bgImage.height;
      const canvasAspect = this.width / this.height;
      let drawWidth, drawHeight, drawX, drawY;
      if (imageAspect > canvasAspect) {
        drawHeight = this.height ;
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
    // 背景白色蒙版已移除

    // 绘制标题
    context.fillStyle = '#333333';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText('拼来凑去', this.width / 2, 55);
    
    // 绘制关卡（替代原日期位置）
    context.fillStyle = '#666666';
    context.font = '16px Arial';
    context.fillText('第2关', this.width / 2, 85);
    
    // 绘制剩余卡片数量（在关卡下方）
    const remainingBlocks = this.allBlocks.filter(block => block.status === 0).length;
    context.fillStyle = '#4caf50';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText(`剩余卡片: ${remainingBlocks}`, this.width / 2, 105);
    
    // 绘制网格（改进的渲染逻辑）
    this.renderBlocks();
    
    // 绘制7×9矩阵半透明覆盖层（仅调试）
    if (this.showMatrixOverlay) {
      this.renderMatrixOverlay();
    }
    
    // 调试覆盖层已关闭（不再绘制命中框）
    
    // 绘制底部功能按钮
    this.renderButtons();
    
    // 绘制卡槽和移动中的卡片
    this.renderCardSlot();
    this.renderRemovedCards();
    if (this.movingCard) {
      this.renderMovingCard();
    }
  }
  
  // 改进的块渲染逻辑（参考yulegeyu-master）
  renderBlocks() {
    // 按层级排序所有可见块
    const visibleBlocks = this.allBlocks.filter(block => block.status === 0);
    visibleBlocks.sort((a, b) => a.level - b.level);
    
    // 渲染每个块
    visibleBlocks.forEach(block => {
      this.renderSingleBlock(block);
    });
  }
  
  // 调试可视化：7×9矩阵覆盖层
  renderMatrixOverlay() {
    // 需要 calculateGrid 先计算以下参数
    const stepX = this.stepX || (this.cellSize + this.gridSpacing);
    const stepY = this.stepY || (this.cellSize + this.gridSpacing);
    const minGX = (this.minGridX != null) ? this.minGridX : 0;
    const minGY = (this.minGridY != null) ? this.minGridY : 0;
    const cols = this.matrixCols || ((this.maxGridX != null && this.minGridX != null) ? (this.maxGridX - this.minGridX + 1) : 9);
    const rows = this.matrixRows || ((this.maxGridY != null && this.minGridY != null) ? (this.maxGridY - this.minGridY + 1) : 7);
    if (this.gridStartX == null || this.gridStartY == null) return;
    
    this.ctx.save();
    this.ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = this.gridStartX + c * stepX;
        const y = this.gridStartY + r * stepY;
        const w = this.cellSize;
        const h = this.cellSize;
        const gridX = minGX + c;
        const gridY = minGY + r;
        
        // 判断该格子是否有可见卡片
        const hasVisibleBlock = this.allBlocks.some(b => b.status === 0 && b.x === gridX && b.y === gridY);
        
        if (hasVisibleBlock) {
          this.ctx.fillStyle = 'rgba(50, 205, 50, 0.22)'; // 绿色半透明（有卡片）
        } else {
          this.ctx.fillStyle = 'rgba(70, 130, 180, 0.10)'; // 浅蓝半透明（无卡片）
        }
        this.ctx.fillRect(x, y, w, h);
        
        // 描边网格
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.strokeRect(x, y, w, h);
        
        // 在左上角标注(c,r)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`${c},${r}`, x + 2, y + 2);
      }
    }
    this.ctx.restore();
  }
  
  renderSingleBlock(block) {
    if (!this.gridCells[block.x] || !this.gridCells[block.x][block.y]) return;
    
    const cell = this.gridCells[block.x][block.y];
    const character = this.characterTypes[block.type];
    
    if (!character) return;
    
    // 不使用层级偏移，所有卡片在同一位置
    const layerX = cell.x;
    const layerY = cell.y;
    
    // 判断是否可点击
    const isClickable = this.isBlockClickable(block);
    
    // 判断是否是该位置中最顶层的可见卡片
    const blocksAtPosition = this.allBlocks.filter(b => 
      b.x === block.x && b.y === block.y && b.status === 0
    );
    const isTopMostVisible = blocksAtPosition.length > 0 && 
      block.level === Math.max(...blocksAtPosition.map(b => b.level));
    
    // 保存当前绘图状态（为最顶层卡片设置透明度以便看到下一张）
    this.ctx.save();
    this.ctx.globalAlpha = isTopMostVisible ? 0.5 : 1.0;
    
    // 绘制块背景（不旋转）
    this.ctx.fillStyle = isClickable ? '#f5f5dc' : '#d3d3d3';
    this.ctx.fillRect(layerX, layerY, cell.width, cell.height);
    
    // 绘制块边框
    this.ctx.strokeStyle = isClickable ? '#8b4513' : '#999999';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(layerX, layerY, cell.width, cell.height);
    
    // 绘制字符背景色
    this.ctx.fillStyle = isClickable ? character.color : '#cccccc';
    this.ctx.fillRect(layerX + 3, layerY + 3, cell.width - 6, cell.height - 6);
    
    // 绘制字符图标（正着显示）
    this.ctx.fillStyle = isClickable ? '#000000' : '#666666';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      character.icon,
      layerX + cell.width / 2,
      layerY + cell.height / 2 + 7
    );
    
    // 恢复绘图状态
    this.ctx.restore();

    // 顶层卡片右上角显示下一张文字（半透明白，10px）
    if (isTopMostVisible) {
      const nextBlocks = blocksAtPosition.filter(b => b.level < block.level);
      if (nextBlocks.length > 0) {
        const nextLevel = Math.max(...nextBlocks.map(b => b.level));
        const nextBlock = nextBlocks.find(b => b.level === nextLevel);
        const nextChar = this.characterTypes[nextBlock.type];
        if (nextChar && nextChar.icon) {
          const pad = 4;
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          this.ctx.font = 'bold 10px Arial';
          this.ctx.textAlign = 'right';
          this.ctx.textBaseline = 'top';
          this.ctx.fillText(nextChar.icon, layerX + cell.width - pad, layerY + pad);
          this.ctx.restore();
        }
      }
    }
    
    // 高亮选中的字符类型（不受透明度影响）
    if (isClickable && block.type === this.selectedCharacterType) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(layerX - 2, layerY - 2, cell.width + 4, cell.height + 4);
    }
    
    // 为不可点击的块添加遮罩效果（不受透明度影响）
    if (!isClickable) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(layerX, layerY, cell.width, cell.height);
    }
  }
  
  // 渲染按钮
  renderButtons() {
    for (let button of this.buttons) {
      const isDisabled = !!button.disabled;
      // 绘制按钮阴影
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.fillRect(button.x + 3, button.y + 3, button.width, button.height);
      
      // 绘制按钮背景（渐变效果）
      const baseColor = isDisabled ? '#9e9e9e' : button.color;
      const gradient = this.ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, this.darkenColor(baseColor, 0.2));
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // 绘制按钮边框
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(button.x, button.y, button.width, button.height);
      
      // 绘制按钮文字
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2 + 5
      );

      // 绘制右上角可点击次数 (剩余/总数)
      const lim = this.buttonUsageLimits && this.buttonUsageLimits[button.id];
      if (lim != null) {
        const rem = (this.buttonUsageRemaining && this.buttonUsageRemaining[button.id] != null)
          ? this.buttonUsageRemaining[button.id]
          : lim;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#ffffff';
        const tx = button.x + button.width - 6;
        const ty = button.y + 14;
        this.ctx.fillText(`(${rem}/${lim})`, tx, ty);
      }
    }
  }
  
  // 辅助方法：使颜色变暗
  darkenColor(color, factor) {
    // 简单的颜色变暗方法
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      const newR = Math.floor(r * (1 - factor));
      const newG = Math.floor(g * (1 - factor));
      const newB = Math.floor(b * (1 - factor));
      
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    return color;
  }
  
  renderCardSlot() {
    // 绘制卡槽背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(this.cardSlot.x, this.cardSlot.y, this.cardSlot.width, this.cardSlot.height);
    
    // 绘制卡槽边框
    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.cardSlot.x, this.cardSlot.y, this.cardSlot.width, this.cardSlot.height);
    
    // 计算可用宽度和每个卡片位置的实际宽度
    const availableWidth = this.cardSlot.width - 20; // 左右各留10px边距
    const totalCardWidth = this.cardSlot.maxCards * this.cardSlot.cardWidth + (this.cardSlot.maxCards - 1) * this.cardSlot.cardSpacing;
    
    // 如果总宽度超出可用宽度，调整卡片间距
    let actualCardSpacing = this.cardSlot.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.cardSlot.maxCards * this.cardSlot.cardWidth) / (this.cardSlot.maxCards - 1));
    }
    
    // 绘制卡槽位置指示
    for (let i = 0; i < this.cardSlot.maxCards; i++) {
      const x = this.cardSlot.x + 10 + i * (this.cardSlot.cardWidth + actualCardSpacing);
      const y = this.cardSlot.y + 5;
      
      // 确保不超出卡槽边界
      if (x + this.cardSlot.cardWidth <= this.cardSlot.x + this.cardSlot.width - 10) {
        // 绘制卡槽位置背景
        this.ctx.fillStyle = i < this.cardSlot.cards.length ? '#e8f5e8' : '#f0f0f0';
        this.ctx.fillRect(x, y, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
        
        // 绘制卡槽位置边框
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
      }
    }
    
    // 绘制卡槽中的卡片
    for (let i = 0; i < this.cardSlot.cards.length; i++) {
      const card = this.cardSlot.cards[i];
      const character = this.characterTypes[card.characterType];
      
      if (character) {
        const x = this.cardSlot.x + 10 + i * (this.cardSlot.cardWidth + actualCardSpacing);
        const y = this.cardSlot.y + 5;
        
        // 确保卡片不超出卡槽边界
        if (x + this.cardSlot.cardWidth <= this.cardSlot.x + this.cardSlot.width - 10) {
          // 绘制卡片背景
          this.ctx.fillStyle = character.color;
          this.ctx.fillRect(x + 1, y + 1, this.cardSlot.cardWidth - 2, this.cardSlot.cardHeight - 2);
          
          // 绘制卡片图标
          this.ctx.fillStyle = '#000000';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            character.icon,
            x + this.cardSlot.cardWidth / 2,
            y + this.cardSlot.cardHeight / 2 + 5
          );
          // （已移除）卡槽中的右上角下一张提示，不再显示，以免移动后仍显示
        }
      }
    }
    
    // 绘制卡槽标题
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      `卡槽 (${this.cardSlot.cards.length}/${this.cardSlot.maxCards})`,
      this.cardSlot.x + 5,
      this.cardSlot.y - 5
    );
  }
  
  renderRemovedCards() {
    // 绘制移出卡片区域
    if (this.removedCards.cards.length === 0) {
      return;
    }
    
    // 绘制移出卡片区域背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    // 绘制移出卡片区域边框
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.removedCards.x, this.removedCards.y, this.removedCards.width, this.removedCards.height);
    
    // 计算卡片布局
    const availableWidth = this.removedCards.width - 20; // 左右各留10px边距
    const totalCardWidth = this.removedCards.cards.length * this.removedCards.cardWidth + 
                          (this.removedCards.cards.length - 1) * this.removedCards.cardSpacing;
    
    // 如果总宽度超出可用宽度，调整卡片间距
    let actualCardSpacing = this.removedCards.cardSpacing;
    if (totalCardWidth > availableWidth) {
      actualCardSpacing = Math.max(1, (availableWidth - this.removedCards.cards.length * this.removedCards.cardWidth) / 
                                     (this.removedCards.cards.length - 1));
    }
    
    // 进一步微调：高度与渲染一致，则继续向下校正 1/3 × 卡片高度
    // 最终总校正量 = 8/3 × 卡片高度
    const clickYOffset = (8 * this.removedCards.cardHeight) / 3;
    
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      const card = this.removedCards.cards[i];
      const character = this.characterTypes[card.characterType];
      
      if (character) {
        const x = this.removedCards.x + 10 + i * (this.removedCards.cardWidth + actualCardSpacing);
        const y = this.removedCards.y;
        
        // 绘制卡片背景
        this.ctx.fillStyle = character.color;
        this.ctx.fillRect(x + 1, y + 1, this.removedCards.cardWidth - 2, this.removedCards.cardHeight - 2);
        
        // 绘制卡片边框（高亮显示可点击）
        this.ctx.strokeStyle = '#4caf50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.removedCards.cardWidth, this.removedCards.cardHeight);
        
        // 绘制卡片图标
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          character.icon,
          x + this.removedCards.cardWidth / 2,
          y + this.removedCards.cardHeight / 2 + 5
        );
        // （已移除）移出区右上角下一张提示，不再显示，以免移动后仍显示
      }
    }
    
    // 绘制移出卡片区域标题
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      "",
      this.removedCards.x + 5,
      this.removedCards.y - 5
    );
  }
  
  renderMovingCard() {
    if (!this.movingCard || !this.movingCard.card) return;
    
    const character = this.characterTypes[this.movingCard.card.characterType];
    if (!character) return;
    
    const x = this.movingCard.currentX - this.cardSlot.cardWidth / 2;
    const y = this.movingCard.currentY - this.cardSlot.cardHeight / 2;
    
    // 绘制移动中卡片的阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(x + 2, y + 2, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
    
    // 绘制移动中卡片背景
    this.ctx.fillStyle = character.color;
    this.ctx.fillRect(x, y, this.cardSlot.cardWidth, this.cardSlot.cardHeight);
    
    // 绘制移动中卡片边框
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, this.cardSlot.cardWidth, this.cardSlot.cardHeight);

    // 绘制移动中卡片图标
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      character.icon,
      x + this.cardSlot.cardWidth / 2,
      y + (this.cardSlot.cardHeight / 2) + 5
    );
  }
}

module.exports = Level2;