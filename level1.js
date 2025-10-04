// 第一关：猜成语游戏逻辑
const idioms = require('./data.js');

class Level1 {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.width = game.width;
    this.height = game.height;
    
    // 猜成语游戏相关变量
    this.gameDate = '';
    this.gridSize = 3;
    this.grid = [];
    this.gridCells = [];
    this.characterTypes = {};
    this.selectedCharacterType = null;
    this.buttons = [];
    
    // 成语数据
    this.idiomsData = [];
    this.selectedIdioms = [];
    this.idiomCharacters = [];
    
    // 块相关
    this.allBlocks = [];
    this.blockData = {};
    this.chessBoard = [];
    this.stackHeight = 4;
    this.layerOffset = 8;
    
    // 卡槽
    this.cardSlot = null;
    this.movingCard = null;
    this.animationDuration = 500;
    
    // 网格配置
    this.cellSize = 60;
    this.gridSpacing = 10;
    
    // 难度系数配置 (1-10，1最简单，10最难)
    this.difficultyLevel = 1;
    
    // 按钮使用次数限制（第一关每个按钮各1次）
    this.buttonUsageLimits = { remove: 1, undo: 1, shuffle: 1 };
    this.buttonUsageRemaining = { remove: 1, undo: 1, shuffle: 1 };

    // 背景图
    this.bgImage = null;
    this.bgImageLoaded = false;
  }
  
  async init() {
    // 加载背景图片
    await this.loadBackgroundImage();

    // 加载成语数据
    await this.loadIdiomData();
    
    // 初始化第一关
    this.initLevel();
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
          console.log('微信小程序环境');
          wx.request({
            url: './data.json',
            success: (res) => {
              console.log('请求成功:', res.data);
              resolve(res.data);
            },
            fail: (res) => {
              console.log('request fail', res);
              reject(res);
            }
          });
        });
      } else {
        // 浏览器环境
        const response = await fetch('./data.json');
        data = await response.json();
      }
      this.idiomsData = data.idioms;
      console.log(this.idiomsData)
      
      // 随机选择10个成语
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(this.idiomsData.length, 9);
      
      for (const index of randomIndices) {
        this.selectedIdioms.push(this.idiomsData[index]);
      }
      
      // console.log('正常加载 - 选择的成语数量:', this.selectedIdioms.length);
      // console.log('正常加载 - 选择的成语:', this.selectedIdioms.map(item => item.idiom));
      

      
      // 将所有选中成语的字符收集并打乱
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        this.idiomCharacters.push(...idiom.idiom.split(''));
      });
      this.shuffleArray(this.idiomCharacters);
      
    } catch (error) {
      console.error('加载成语数据失败:', error);
      // 使用默认数据：从 data.js 中随机选择10个成语
      this.selectedIdioms = [];
      const randomIndices = this.generateRandomIndices(idioms.length, 9);
      
      for (const index of randomIndices) {
        this.selectedIdioms.push(idioms[index]);
      }
      
      // console.log('默认数据 - 选择的成语数量:', this.selectedIdioms.length);
      // console.log('默认数据 - 选择的成语:', this.selectedIdioms.map(item => item.idiom));
      
      // console.log('this.selectedIdioms:', this.selectedIdioms)

      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        this.idiomCharacters.push(...idiom.idiom.split(''));
      });
      this.shuffleArray(this.idiomCharacters);
    }
  }
  
  // 生成指定数量的不重复随机索引
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
  
  // 渐进式打乱方法
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
  
  // 分组打乱方法（难度10专用）
  shuffleWithGrouping(array) {
    // 将数组分成成语组
    const idiomGroups = [];
    const groupSize = 4; // 每个成语4个字
    
    for (let i = 0; i < array.length; i += groupSize) {
      idiomGroups.push(array.slice(i, i + groupSize));
    }
    
    // 保持一半的成语组相对完整
    const keepIntactCount = Math.floor(idiomGroups.length / 2);
    const intactGroups = idiomGroups.slice(0, keepIntactCount);
    const shuffleGroups = idiomGroups.slice(keepIntactCount);
    
    // 打乱需要打乱的组
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
    
    // 对整体进行轻微打乱
    for (let i = 0; i < 3; i++) {
      const pos1 = Math.floor(Math.random() * array.length);
      const pos2 = Math.floor(Math.random() * array.length);
      [array[pos1], array[pos2]] = [array[pos2], array[pos1]];
    }
  }
  
  // 设置难度等级
  setDifficultyLevel(level) {
    this.difficultyLevel = Math.max(1, Math.min(10, level));
  }
  
  // 获取当前难度等级
  getDifficultyLevel() {
    return this.difficultyLevel;
  }

  
  initLevel() {
    // 初始化猜成语游戏
    this.gameDate = '9月9日';
    this.gridSize = 3;
    this.cellSize = 60;
    this.gridSpacing = 10;
    this.stackHeight = 4; // 每个位置堆叠4个格子
    this.layerOffset = 8; // 每层的偏移量，创造立体效果

    // 仅用于"九宫格"的点击校准偏移（不影响按钮与移出卡槽）
    // 正值表示：命中检测使用 y' = y + gridHitOffsetY
    // 全局默认不偏移（保持按钮与移出卡槽完全不变）
    this.gridHitOffsetX = 0;
    // 减少偏移量，矫正点击位置判断偏上的问题
    this.gridHitOffsetY = 0; // 先尝试完全移除偏移
    // 间隙不可点击：不再拉长点击区域高度
    this.extraHitHeightY = 0;
    
    // 字符类型（基于成语字符）
    this.characterTypes = {};
    const unifiedColor = '#4caf50';
    
    // 为每个成语字符创建统一颜色的类型
    this.idiomCharacters.forEach((char) => {
      this.characterTypes[char] = {
        name: char,
        color: unifiedColor,
        icon: char
      };
    });
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
    
    // 初始化按钮
    this.initButtons();
  }
  
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
      maxCards: 10,
      cards: [],
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
  
  // 初始化块数据结构（参考yulegeyu-master的设计）
  initBlocks() {
    this.allBlocks = [];
    this.blockData = {};
    this.chessBoard = [];
    
    // 初始化棋盘
    for (let i = 0; i < this.gridSize; i++) {
      this.chessBoard[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        this.chessBoard[i][j] = {
          blocks: []
        };
      }
    }
    
    // 创建块对象
    let blockId = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        for (let layer = 0; layer < this.stackHeight; layer++) {
          const charType = this.idiomCharacters[blockId % this.idiomCharacters.length];
          const block = {
            id: blockId,
            x: row,
            y: col,
            level: layer + 1,
            type: charType,
            status: 0, // 0-正常, 1-已点击, 2-已消除
            higherThanBlocks: [],
            lowerThanBlocks: []
          };
          
          this.allBlocks.push(block);
          this.blockData[blockId] = block;
          this.chessBoard[row][col].blocks.push(block);
          blockId++;
        }
      }
    }
    
    // 建立层级关系
    this.allBlocks.forEach(block => {
      this.genLevelRelation(block);
    });
  }
  
  // 生成块的层级关系（参考yulegeyu-master）
  genLevelRelation(block) {
    const { x, y, level } = block;
    
    // 清空之前的关系
    block.higherThanBlocks = [];
    block.lowerThanBlocks = [];
    
    // 在同一位置的其他块建立层级关系
    const blocksInSameCell = this.chessBoard[x][y].blocks;
    blocksInSameCell.forEach(otherBlock => {
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
    // 计算网格的总尺寸
    const totalGridWidth = this.gridSize * this.cellSize + (this.gridSize - 1) * this.gridSpacing;
    const totalGridHeight = this.gridSize * this.cellSize + (this.gridSize - 1) * this.gridSpacing;
    
    // 计算网格的起始位置（居中）
    const startX = (this.width - totalGridWidth) / 2;
    // 根据屏幕高度动态调整网格位置，确保在不同屏幕尺寸下都能正常显示
    const startY = Math.max(120, this.height * 0.15); // 至少120px，或屏幕高度的15%
    
    // 初始化网格单元格位置
    this.gridCells = [];
    for (let row = 0; row < this.gridSize; row++) {
      this.gridCells[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        this.gridCells[row][col] = {
          x: startX + col * (this.cellSize + this.gridSpacing),
          y: startY + row * (this.cellSize + this.gridSpacing),
          width: this.cellSize,
          height: this.cellSize
        };
      }
    }
    
    // 计算卡槽位置（在网格下方）
    this.cardSlot.x = 20;
    this.cardSlot.y = startY + totalGridHeight + 40;
    this.cardSlot.width = this.width - 40;
  }
  
  initButtons() {
    // 计算按钮布局 - 三个按钮居中排列
    const buttonWidth = 110;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const totalWidth = 3 * buttonWidth + 2 * buttonSpacing;
    const startX = (this.width - totalWidth) / 2;
    // 根据屏幕高度动态调整按钮位置，确保在不同屏幕尺寸下都能正常显示
    const buttonY = this.height - Math.max(120, this.height * 0.15); // 距离底部至少120px，或屏幕高度的15%
    
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
        disabled: false,
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
        disabled: false,
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
        disabled: false,
        action: () => this.shuffleBlocks()
      }
    ];
  }
  
  handleTouch(x, y) {
    // 检查是否点击了模态框关闭按钮
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
      // 移除按钮点击偏移，直接使用按钮的实际位置
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
    
    // 检查卡槽中卡片点击（禁用：不再通过点击将卡片移出卡槽）
    /*
    const clickedSlotCard = this.getClickedSlotCard(x, y);
    if (clickedSlotCard !== -1) {
      // 禁止通过点击将卡槽中的卡片移出
      return;
    }
    */
    
    // 检查网格点击（按钮与移出卡槽不受影响）
    // 命中检测偏移在 getClickedBlock 内部施加到九宫格的矩形上
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

    // 点击命中区域与渲染完全一致：与绘制时的 +5 对齐
    const clickYOffset = 5;
    
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
      const cardY = this.cardSlot.y + clickYOffset; // 与渲染一致，不再重复 +5
      
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
  
  moveSlotCardToRemoved(cardIndex) {
    // 将卡槽中的卡片移动到移出区域
    if (cardIndex >= 0 && cardIndex < this.cardSlot.cards.length) {
      const card = this.cardSlot.cards.splice(cardIndex, 1)[0];
      this.removedCards.cards.push(card);
      
      // 更新移出卡片区域的位置和大小
      this.updateRemovedCardsLayout();

      // 限制：移出区最多10张，超过立即判定失败
      if (this.removedCards.maxCards != null && this.removedCards.cards.length > this.removedCards.maxCards) {
        this.showGameFailure();
      }
    }
  }
  
  getClickedBlock(x, y) {
    let clickedBlock = null;
    let highestLevel = -1;
    
    // 遍历所有网格位置
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.gridCells[row][col];
        const blocksInCell = this.chessBoard[row][col].blocks;
        
        // 从最高层开始检查
        for (let i = blocksInCell.length - 1; i >= 0; i--) {
          const block = blocksInCell[i];
          if (block.status !== 0) continue; // 跳过已移除的块
          
          // 与渲染一致的层级错位与尺寸收缩
          const offset = this.layerOffset || 6;
          const isEvenLayer = (block.level % 2 === 0);
          const dx = isEvenLayer ? Math.floor(offset / 2) : 0;
          const dy = isEvenLayer ? Math.floor(offset / 2) : 0;
          const layerX = cell.x + dx + (this.gridHitOffsetX || 0);
          const layerY = cell.y + dy + (this.gridHitOffsetY || 0);
          const layerW = cell.width - dx;
          const layerH = cell.height - dy + (this.extraHitHeightY || 0);
          
          // 点击是否在该层块的可见区域内
          if (x >= layerX && x <= layerX + layerW &&
              y >= layerY && y <= layerY + layerH) {
            if (block.level > highestLevel && this.isBlockClickable(block)) {
              clickedBlock = block;
              highestLevel = block.level;
              // 命中最高层后可直接跳出当前格（继续检查更高格不必要）
              break;
            }
          }
        }
      }
    }
    
    return clickedBlock;
  }
  
  handleGridClick(row, col) {
    const topBlock = this.getTopClickableBlock(row, col);
    if (topBlock) {
      this.doClickBlock(topBlock);
    }
  }
  
  getTopClickableBlock(row, col) {
    const blocks = this.chessBoard[row][col].blocks;
    
    // 找到最高层的可点击块
    let topBlock = null;
    let maxLevel = 0;
    
    for (let block of blocks) {
      if (block.status === 0 && this.isBlockClickable(block) && block.level > maxLevel) {
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
    let actualCardSpacing = this.cardSlot.cardSpacing;
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

    // 使用次数限制判定（第一关每个按钮1次）
    const limit = this.buttonUsageLimits[buttonId];
    if (limit != null) {
      const remaining = this.buttonUsageRemaining[buttonId] ?? limit;
      if (remaining <= 0) {
        // 已用尽，提示
        if (this.game && typeof this.game.showModalDialog === 'function') {
          this.game.showModalDialog('提示', '使用机会已经没有了', [
            { text: '知道了' }
          ]);
        }
        return;
      }
      // 消耗一次机会
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
    console.log("外面"+`Removing ${cardsToRemove} cards`);
    if (cardsToRemove > 0) {
      // 将前四个卡片移到移出区域
      console.log("里面"+`Removing ${cardsToRemove} cards`);
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
    this.removedCards.y = this.cardSlot.y + this.cardSlot.height + 40; // 向下留出40像素间距
    this.removedCards.width = this.cardSlot.width;
    // 区域高度需要完整包裹卡片高度（上下各留 5px 内边距）
    this.removedCards.height = this.removedCards.cardHeight + 10;
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
  
  goToNextLevel() {
    // 跳转到第二关
    this.game.switchToLevel2();
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
    
    // console.log('检查通关条件:');
    // console.log('- 剩余成语数量:', this.selectedIdioms.length);
    // console.log('- 九宫格剩余卡片:', hasRemainingBlocks);
    // console.log('- 卡槽剩余卡片:', this.cardSlot.cards.length);
    
    // 通关条件：所有成语完成 + 九宫格无剩余卡片 + 卡槽为空
    if (this.selectedIdioms.length === 0 && !hasRemainingBlocks && this.cardSlot.cards.length === 0) {
      // console.log('通关条件满足，显示通关弹窗');
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
        console.log('没有更多可点击的块，但还有未完成的成语');
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
         // 改为触发完成动画：高亮白边并轻微放大，动画结束后再移除
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
    // 成语完成动画进度更新
    if (this.cardCompletionAnimation) {
      const elapsed = Date.now() - this.cardCompletionAnimation.startTime;
      const progress = Math.min(elapsed / this.cardCompletionAnimation.duration, 1);
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.cardCompletionAnimation.progress = easeProgress;
      if (progress >= 1) {
        // 动画结束：移除用于组成成语的卡片，并从待完成成语列表移除该成语
        const used = this.cardCompletionAnimation.indices.slice().sort((a, b) => b - a);
        for (let index of used) {
          this.cardSlot.cards.splice(index, 1);
        }
        this.selectedIdioms = this.selectedIdioms.filter(item => item !== this.cardCompletionAnimation.idiom);
        this.cardCompletionAnimation = null;
        if (this.selectedIdioms.length === 0) {
          this.checkLevelComplete();
        }
      }
    }

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
    context.fillText('第1关', this.width / 2, 85);
    
    // 绘制剩余卡片数量（在关卡下方）
    const remainingBlocks = this.allBlocks.filter(block => block.status === 0).length;
    context.fillStyle = '#4caf50';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText(`剩余卡片: ${remainingBlocks}`, this.width / 2, 105);
    
    // 绘制网格（改进的渲染逻辑）
    this.renderBlocks();
    
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
  
  // 调试可视化：渲染九宫格点击命中区域覆盖层
  renderGridHitboxes() {
    this.ctx.save();
    this.ctx.lineWidth = 2;
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.gridCells[row][col];
        const visibleBlocksInCell = this.chessBoard[row][col].blocks.filter(b => b.status === 0);
        if (visibleBlocksInCell.length === 0) {
          // 该格子没有可见卡片，则没有实际点击目标，不绘制
          continue;
        }
        
        // 若该格子有可点击的顶层卡片，则标绿；否则标红
        const topClickable = this.getTopClickableBlock(row, col);
        if (topClickable) {
          this.ctx.fillStyle = 'rgba(50, 205, 50, 0.25)';      // 绿色半透明
          this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.9)';     // 绿色描边
        } else {
          this.ctx.fillStyle = 'rgba(220, 20, 60, 0.22)';      // 红色半透明
          this.ctx.strokeStyle = 'rgba(220, 20, 60, 0.9)';     // 红色描边
        }
        
        // 覆盖层与卡片渲染位置完全一致，无额外偏移
        const vx = cell.x + (this.gridHitOffsetX || 0);
        const vy = cell.y + (this.gridHitOffsetY || 0);
        // 覆盖层与卡片渲染位置完全一致（不使用命中偏移）
        const vxCard = cell.x;
        const vyCard = cell.y;
        const vh = cell.height;
        this.ctx.fillRect(vxCard, vyCard, cell.width, vh);
        this.ctx.strokeRect(vxCard, vyCard, cell.width, vh);
      }
    }
    
    this.ctx.restore();
  }
  
  renderSingleBlock(block) {
    const cell = this.gridCells[block.x][block.y];
    const character = this.characterTypes[block.type];
    
    if (!character) return;
    
    // 层级插空：偶数层错位显示，让下层字符可见，同时收缩尺寸以避免越界
    const offset = this.layerOffset || 6;
    const isEvenLayer = (block.level % 2 === 0);
    const dx = isEvenLayer ? Math.floor(offset / 2) : 0;
    const dy = isEvenLayer ? Math.floor(offset / 2) : 0;
    const layerX = cell.x + dx;
    const layerY = cell.y + dy;
    const layerW = cell.width - dx;
    const layerH = cell.height - dy;
    
    // 判断是否可点击
    const isClickable = this.isBlockClickable(block);
    
    // 判断是否是该格子中最顶层的可见卡片
    const blocksInCell = this.chessBoard[block.x][block.y].blocks;
    const visibleBlocks = blocksInCell.filter(b => b.status === 0);
    const isTopMostVisible = visibleBlocks.length > 0 && block.id === visibleBlocks[visibleBlocks.length - 1].id;
    
    // 保存当前绘图状态（为最顶层卡片设置透明度以便看到下一张）
    this.ctx.save();
    this.ctx.globalAlpha = isTopMostVisible ? 0.5 : 1.0;
    
    // 绘制块背景
    this.ctx.fillStyle = isClickable ? '#f5f5dc' : '#d3d3d3';
    this.ctx.fillRect(layerX, layerY, layerW, layerH);
    
    // 绘制块边框
    this.ctx.strokeStyle = isClickable ? '#8b4513' : '#999999';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(layerX, layerY, layerW, layerH);
    
    // 绘制字符背景色
    this.ctx.fillStyle = isClickable ? character.color : '#cccccc';
    this.ctx.fillRect(layerX + 3, layerY + 3, layerW - 6, layerH - 6);
    
    // 绘制字符图标（固定字号）
    this.ctx.fillStyle = isClickable ? '#000000' : '#666666';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      character.icon,
      layerX + layerW / 2,
      layerY + layerH / 2 + 10
    );
    
    // 恢复绘图状态
    this.ctx.restore();
    
    // 在右上角显示下一张卡片的文字（白色 10px，不与主文字重叠，仅顶层可见卡片显示）
    if (isTopMostVisible) {
      const currentIdx = visibleBlocks.findIndex(b => b.id === block.id);
      const nextIdx = currentIdx - 1;
      if (nextIdx >= 0) {
        const nextBlock = visibleBlocks[nextIdx];
        const nextCharacter = this.characterTypes[nextBlock.type];
        if (nextCharacter) {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.font = 'bold 10px Arial';
          this.ctx.textAlign = 'right';
          this.ctx.textBaseline = 'top';
          const pad = 4;
          this.ctx.fillText(nextCharacter.icon, layerX + layerW - pad, layerY + pad);
          this.ctx.textBaseline = 'alphabetic';
        }
      }
    }
    
    // 高亮选中的字符类型（不受透明度影响）
    if (isClickable && block.type === this.selectedCharacterType) {
      this.ctx.strokeStyle = '#ff6b6b';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(layerX - 2, layerY - 2, layerW + 4, layerH + 4);
    }
    
    // 为不可点击的块添加遮罩效果（不受透明度影响）
    if (!isClickable) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(layerX, layerY, layerW, layerH);
    }
  }
  
  // 渲染按钮
  renderButtons() {
    for (let button of this.buttons) {
      const isDisabled = !!button.disabled;

      // 纯平样式：不绘制阴影、渐变和高光；使用圆角10px
      const baseColor = isDisabled ? '#9e9e9e' : button.color;
      this.ctx.fillStyle = baseColor;

      // 圆角矩形路径
      const r = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(button.x + r, button.y);
      this.ctx.lineTo(button.x + button.width - r, button.y);
      this.ctx.quadraticCurveTo(button.x + button.width, button.y, button.x + button.width, button.y + r);
      this.ctx.lineTo(button.x + button.width, button.y + button.height - r);
      this.ctx.quadraticCurveTo(button.x + button.width, button.y + button.height, button.x + button.width - r, button.y + button.height);
      this.ctx.lineTo(button.x + r, button.y + button.height);
      this.ctx.quadraticCurveTo(button.x, button.y + button.height, button.x, button.y + button.height - r);
      this.ctx.lineTo(button.x, button.y + r);
      this.ctx.quadraticCurveTo(button.x, button.y, button.x + r, button.y);
      this.ctx.closePath();
      this.ctx.fill();

      // 按钮边框
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // 按钮文字
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2 + 5
      );

      // 右上角可点击次数 (剩余/总数)
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
    
    // 计算动态卡片宽度与间距，使10个位置铺满整个卡槽可用宽度
    const innerX = this.cardSlot.x + 10; // 左内边距
    const innerW = this.cardSlot.width - 20; // 去除左右内边距后的可用宽度
    const max = this.cardSlot.maxCards;
    const baseW = this.cardSlot.cardWidth;
    const minSpacing = 3; // 最小间距，避免卡片互相粘连
    let actualW = baseW;
    let actualSpacing = (innerW - max * actualW) / (max - 1);
    if (actualSpacing < minSpacing) {
      actualSpacing = minSpacing;
      actualW = (innerW - (max - 1) * actualSpacing) / max;
    }
    // 统一卡片高度不变
    const actualH = this.cardSlot.cardHeight;
    const slotY = this.cardSlot.y + 5;
    
    // 绘制卡槽位置指示（占位）
    for (let i = 0; i < max; i++) {
      const x = innerX + i * (actualW + actualSpacing);
      const y = slotY;
      // 占位背景：已放置用淡绿，未放置用灰
      this.ctx.fillStyle = i < this.cardSlot.cards.length ? '#e8f5e8' : '#f0f0f0';
      this.ctx.fillRect(x, y, actualW, actualH);
      // 占位边框
      this.ctx.strokeStyle = '#cccccc';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, actualW, actualH);
    }
    
    // 绘制卡槽中的卡片（完成动画：白边高亮 + 轻微放大）
    for (let i = 0; i < this.cardSlot.cards.length; i++) {
      const card = this.cardSlot.cards[i];
      const character = this.characterTypes[card.characterType];
      if (!character) continue;
      
      const x = innerX + i * (actualW + actualSpacing);
      const y = slotY;
      const isAnimating = this.cardCompletionAnimation && this.cardCompletionAnimation.indices && this.cardCompletionAnimation.indices.includes(i);
      const scale = isAnimating ? 1 + 0.20 * (this.cardCompletionAnimation.progress || 0) : 1;
      const scaledW = actualW * scale;
      const scaledH = actualH * scale;
      const sx = x + (actualW - scaledW) / 2;
      const sy = y + (actualH - scaledH) / 2;
      
      // 卡片背景
      this.ctx.fillStyle = character.color;
      this.ctx.fillRect(sx + 1, sy + 1, scaledW - 2, scaledH - 2);
      
      // 高亮白边（在动画中）
      if (isAnimating) {
        this.ctx.strokeStyle = 'rgba(237, 71, 71, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(sx, sy, scaledW, scaledH);
      }
      
      // 卡片图标
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        character.icon,
        sx + scaledW / 2,
        sy + scaledH / 2 + 5
      );
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

    // 实际绘制 Y 与点击命中保持一致：+5
    const drawYOffset = 5;

    // 绘制移出的卡片
    for (let i = 0; i < this.removedCards.cards.length; i++) {
      const card = this.removedCards.cards[i];
      const character = this.characterTypes[card.characterType];
      const x = this.removedCards.x + 10 + i * (this.removedCards.cardWidth + actualCardSpacing);
      const y = this.removedCards.y + drawYOffset;

      // 确保卡片不超出区域边界
      if (x + this.removedCards.cardWidth <= this.removedCards.x + this.removedCards.width - 10) {
        // 卡片背景
        this.ctx.fillStyle = character && character.color ? character.color : '#dddddd';
        this.ctx.fillRect(x + 1, y + 1, this.removedCards.cardWidth - 2, this.removedCards.cardHeight - 2);

        // 卡片边框
        this.ctx.strokeStyle = '#999999';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.removedCards.cardWidth, this.removedCards.cardHeight);

        // 图标/文字
        if (character) {
          this.ctx.fillStyle = '#000000';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            character.icon,
            x + this.removedCards.cardWidth / 2,
            y + this.removedCards.cardHeight / 2 + 5
          );
        
          // 右上角“下一张”提示已移除：移出区域的卡片不显示提示
        }
      }
    }
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

// 导出Level1类供其他模块使用
module.exports = Level1;