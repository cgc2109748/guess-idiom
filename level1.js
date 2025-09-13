// 第一关：猜成语游戏逻辑
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
    this.difficultyLevel = 2;
  }
  
  async init() {
    // 加载成语数据
    await this.loadIdiomData();
    
    // 初始化第一关
    this.initLevel();
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
      
      // 随机选择9个成语
      this.selectedIdioms = [];
      const shuffledIdioms = [...this.idiomsData];
      this.shuffleArray(shuffledIdioms);
      
      for (let i = 0; i < Math.min(9, shuffledIdioms.length); i++) {
        this.selectedIdioms.push(shuffledIdioms[i]);
      }
      

      
      // 将所有选中成语的字符收集并打乱
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        this.idiomCharacters.push(...idiom.idiom.split(''));
      });
      this.shuffleArray(this.idiomCharacters);
      
    } catch (error) {
      console.error('加载成语数据失败:', error);
      // 使用默认数据
      this.selectedIdioms = [
        { idiom: "一心一意", pinyin: "yi xin yi yi" },
        { idiom: "三心二意", pinyin: "san xin er yi" },
        { idiom: "四面八方", pinyin: "si mian ba fang" },
        { idiom: "五光十色", pinyin: "wu guang shi se" },
        { idiom: "六神无主", pinyin: "liu shen wu zhu" },
        { idiom: "七上八下", pinyin: "qi shang ba xia" },
        { idiom: "八仙过海", pinyin: "ba xian guo hai" },
        { idiom: "守株待兔", pinyin: "shou zhu dai tu" },
        { idiom: "愚公移山", pinyin: "yu gong yi shan" }
      ];
      this.idiomCharacters = [];
      this.selectedIdioms.forEach(idiom => {
        this.idiomCharacters.push(...idiom.idiom.split(''));
      });
      this.shuffleArray(this.idiomCharacters);
    }
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
  
  // 增加难度
  increaseDifficulty() {
    if (this.difficultyLevel < 10) {
      this.difficultyLevel++;
      this.resetLevel(); // 重新生成关卡以应用新难度
    }
  }
  
  // 降低难度
  decreaseDifficulty() {
    if (this.difficultyLevel > 1) {
      this.difficultyLevel--;
      this.resetLevel(); // 重新生成关卡以应用新难度
    }
  }
  
  initLevel() {
    // 初始化猜成语游戏
    this.gameDate = '9月9日';
    this.gridSize = 3;
    this.cellSize = 60;
    this.gridSpacing = 10;
    this.stackHeight = 4; // 每个位置堆叠4个格子
    this.layerOffset = 8; // 每层的偏移量，创造立体效果
    
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
    const startY = 120; // 从标题下方开始
    
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
    this.buttons = [
      {
        id: 'undo',
        x: 20,
        y: this.height - 120,
        width: 60,
        height: 40,
        color: '#4caf50',
        icon: '撤销',
        action: () => this.undoLastAction()
      },
      {
        id: 'reset',
        x: 90,
        y: this.height - 120,
        width: 60,
        height: 40,
        color: '#ff6b6b',
        icon: '重置',
        action: () => this.resetLevel()
      },
      {
        id: 'switch',
        x: 160,
        y: this.height - 120,
        width: 60,
        height: 40,
        color: '#45b7d1',
        icon: '切换',
        action: () => this.switchCharacterType()
      },
      {
        id: 'difficulty-down',
        x: 230,
        y: this.height - 120,
        width: 50,
        height: 40,
        color: '#ffd700',
        icon: '难度-',
        action: () => this.decreaseDifficulty()
      },
      {
        id: 'difficulty-up',
        x: 290,
        y: this.height - 120,
        width: 50,
        height: 40,
        color: '#ff8c42',
        icon: '难度+',
        action: () => this.increaseDifficulty()
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
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        this.handleButtonClick(button.id);
        return;
      }
    }
    
    // 检查网格点击
    const clickedBlock = this.getClickedBlock(x, y);
    if (clickedBlock) {
      this.doClickBlock(clickedBlock);
    }
  }
  
  getClickedBlock(x, y) {
    let clickedBlock = null;
    let highestLayer = -1;
    
    // 遍历所有网格位置
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.gridCells[row][col];
        const blocksInCell = this.chessBoard[row][col].blocks;
        
        // 从最高层开始检查
        for (let i = blocksInCell.length - 1; i >= 0; i--) {
          const block = blocksInCell[i];
          if (block.status !== 0) continue; // 跳过已移除的块
          
          // 计算该层块的实际渲染位置
          const layer = block.level - 1;
          const offsetX = layer * this.layerOffset;
          const offsetY = layer * this.layerOffset;
          const blockX = cell.x - offsetX;
          const blockY = cell.y - offsetY;
          
          // 检查点击是否在块范围内
          // 调整Y坐标检测范围，向下偏移三分之二的卡片高度
          const adjustedBlockY = blockY + cell.height * 2 / 3;
          if (x >= blockX && x <= blockX + cell.width &&
              y >= adjustedBlockY && y <= adjustedBlockY + cell.height) {
            // 如果这是目前找到的最高层块，且可点击，则选择它
            if (layer > highestLayer && this.isBlockClickable(block)) {
              clickedBlock = block;
              highestLayer = layer;
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
    if (button && button.action) {
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
  
  async resetLevel() {
    // 重新加载成语数据并重置关卡
    await this.loadIdiomData();
    this.initLevel();
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
            callback: () => {
              // 这里可以添加进入下一关的逻辑
              console.log('进入下一关');
              this.resetLevel();
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
            this.resetLevel();
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
    
    // 绘制标题
    context.fillStyle = '#333333';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText('猜成语游戏', this.width / 2, 40);
    
    // 绘制日期
    context.fillStyle = '#666666';
    context.font = '16px Arial';
    context.fillText(this.gameDate, this.width / 2, 70);
    
    // 绘制难度等级
    context.fillStyle = '#ff8c42';
    context.font = 'bold 14px Arial';
    context.textAlign = 'right';
    context.fillText(`难度: ${this.difficultyLevel}/10`, this.width - 20, 30);
    
    // 绘制网格（改进的渲染逻辑）
    this.renderBlocks();
    
    // 绘制底部功能按钮
    this.renderButtons();
    
    // 绘制卡槽和移动中的卡片
    this.renderCardSlot();
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
  
  // 渲染单个块
  renderSingleBlock(block) {
    const cell = this.gridCells[block.x][block.y];
    const character = this.characterTypes[block.type];
    
    if (!character) return;
    
    // 计算层级偏移
    const layer = block.level - 1;
    const offsetX = layer * this.layerOffset;
    const offsetY = layer * this.layerOffset;
    const layerX = cell.x - offsetX;
    const layerY = cell.y - offsetY;
    
    // 判断是否可点击
    const isClickable = this.isBlockClickable(block);
    
    // 判断是否是该格子中最顶层的可见卡片
    const blocksInCell = this.chessBoard[block.x][block.y].blocks;
    const visibleBlocks = blocksInCell.filter(b => b.status === 0);
    const isTopMostVisible = visibleBlocks.length > 0 && block.id === visibleBlocks[visibleBlocks.length - 1].id;
    
    // 计算透明度：只有最顶层可见卡片增加透明度
    const alpha = isTopMostVisible ? 0.55 : 1.0; // 最顶层卡片85%透明度
    
    // 保存当前绘图状态
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    
    // 绘制阴影（为底层块添加深度感）
    if (layer > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.fillRect(layerX + 3, layerY + 3, cell.width, cell.height);
    }
    
    // 绘制块背景
    this.ctx.fillStyle = isClickable ? '#f5f5dc' : '#d3d3d3';
    this.ctx.fillRect(layerX, layerY, cell.width, cell.height);
    
    // 绘制块边框
    this.ctx.strokeStyle = isClickable ? '#8b4513' : '#999999';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(layerX, layerY, cell.width, cell.height);
    
    // 绘制字符背景色
    this.ctx.fillStyle = isClickable ? character.color : '#cccccc';
    this.ctx.fillRect(layerX + 3, layerY + 3, cell.width - 6, cell.height - 6);
    
    // 绘制字符图标
    this.ctx.fillStyle = isClickable ? '#000000' : '#666666';
    this.ctx.font = `bold ${Math.max(20, 30 - layer * 2)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      character.icon,
      layerX + cell.width / 2,
      layerY + cell.height / 2 + 10
    );
    
    // 恢复绘图状态
    this.ctx.restore();
    
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
      // 绘制按钮阴影
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(button.x + 2, button.y + 2, button.width, button.height);
      
      // 绘制按钮背景
      this.ctx.fillStyle = button.color;
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // 绘制按钮边框
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(button.x, button.y, button.width, button.height);
      
      // 绘制按钮图标
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        button.icon,
        button.x + button.width / 2,
        button.y + button.height / 2 + 7
      );
    }
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
      y + this.cardSlot.cardHeight / 2 + 5
    );
  }
}

// 导出Level1类供其他模块使用
module.exports = Level1;