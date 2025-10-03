// 引入Level1/Level2类
const Level1 = require('./level1.js');
const Level2 = require('./level2.js');
const Level3 = require('./level3.js');
const Menu = require('./menu.js');

// 游戏状态枚举
const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  LEVEL1: 'level1',
  LEVEL2: 'level2',
  LEVEL3: 'level3',
  SUCCESS: 'success'
};

// 主游戏类
class GuessIdiomGame {
  constructor() {
    // 检查是否在微信环境
    if (typeof wx !== 'undefined' && wx.createCanvas) {
        this.canvas = wx.createCanvas();
        // 微信小程序使用系统信息获取屏幕尺寸
        const systemInfo = wx.getSystemInfoSync();
        this.canvas.width = systemInfo.windowWidth;
        this.canvas.height = systemInfo.windowHeight;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
      } else {
      // 浏览器环境
      this.canvas = document.getElementById('gameCanvas') || document.createElement('canvas');
      if (!document.getElementById('gameCanvas')) {
        this.canvas.id = 'gameCanvas';
        document.body.appendChild(this.canvas);
      }
      
      // 设置画布样式，让它填满屏幕
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.display = 'block';
      
      // 获取设备像素比
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // 获取屏幕尺寸
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 设置画布的实际尺寸（考虑像素比）
      this.canvas.width = screenWidth * devicePixelRatio;
      this.canvas.height = screenHeight * devicePixelRatio;
      
      // 缩放画布以匹配CSS尺寸
      this.canvas.style.width = screenWidth + 'px';
      this.canvas.style.height = screenHeight + 'px';
      
      // 缩放绘图上下文以匹配设备像素比
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // 设置逻辑尺寸（用于游戏逻辑计算）
      this.width = screenWidth;
      this.height = screenHeight;
    }
    
    this.gameState = GameState.LOADING;
    this.showModal = false;
    this.modalMessage = '';
    
    // 通用弹窗配置
    this.modalConfig = {
      show: false,
      title: '',
      message: '',
      buttons: []
    };
    
    // 当前关卡实例
    this.currentLevel = null;
    
    // 菜单实例
    this.menu = null;
    
    // 暴露枚举到实例，给各关使用（只读约定）
    this.GameState = GameState;
    this.init();
  }
  
  async init() {
    // 设置触摸事件
    this.setupTouchEvents();
    
    // 初始化菜单
    await this.initMenu();
    
    // 开始游戏循环
    this.startGameLoop();
  }
  
  async initMenu() {
    // 创建菜单实例
    this.menu = new Menu(this);
    await this.menu.init();
    this.gameState = GameState.MENU;
  }
  
  // 新增：返回主页（菜单）方法，供各关的弹窗按钮调用
  async showMainMenu() {
    // 隐藏弹窗
    this.hideModalDialog();
    // 清空当前关卡实例（避免继续渲染关卡）
    this.currentLevel = null;
    // 重新初始化菜单并切换到菜单状态
    await this.initMenu();
  }
  
  async initLevel1() {
    // 创建第一关实例
    this.currentLevel = new Level1(this);
    await this.currentLevel.init();
    
    // 确保第一关使用当前的画布尺寸
    this.currentLevel.width = this.width;
    this.currentLevel.height = this.height;
    
    // 重新计算第一关的所有位置
    if (this.currentLevel.calculateGrid) {
      this.currentLevel.calculateGrid();
    }
    if (this.currentLevel.initButtons) {
      this.currentLevel.initButtons();
    }
  }
  
  async initLevel2() {
    // 创建第二关实例（先初始化完成后再赋值给 currentLevel，避免渲染时访问未初始化的数据结构）
    const level = new Level2(this);
    await level.init();
    this.currentLevel = level;
    this.gameState = GameState.LEVEL2;
  }
  
  async initLevel3() {
    // 创建第三关实例（与第二关相同的安全赋值顺序）
    const level = new Level3(this);
    await level.init();
    this.currentLevel = level;
    this.gameState = GameState.LEVEL3;
  }
  
  async switchToLevel2() {
    // 切换到第二关
    await this.initLevel2();
  }
  
  startGameLoop() {
    this.gameLoop();
  }
  
  setupTouchEvents() {
    // 设置触摸事件监听
    if (typeof wx !== 'undefined') {
      // 微信小程序环境
      wx.onTouchStart((e) => {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          this.handleTouch(touch.clientX, touch.clientY);
        }
      });
    } else {
      // 浏览器环境
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        // 直接使用逻辑坐标，不需要缩放
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleTouch(x, y);
      });
      
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        // 直接使用逻辑坐标，不需要缩放
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.handleTouch(x, y);
      });
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      });
    }
  }
  
  resizeCanvas() {
    // 只在浏览器环境中处理
    if (typeof wx === 'undefined') {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 重新设置画布尺寸
      this.canvas.width = screenWidth * devicePixelRatio;
      this.canvas.height = screenHeight * devicePixelRatio;
      
      // 重新设置CSS尺寸
      this.canvas.style.width = screenWidth + 'px';
      this.canvas.style.height = screenHeight + 'px';
      
      // 重新缩放绘图上下文
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // 更新逻辑尺寸
      this.width = screenWidth;
      this.height = screenHeight;
      
      // 如果菜单存在，重新计算按钮位置
      if (this.menu) {
        this.menu.width = this.width;
        this.menu.height = this.height;
        this.menu.startButton.x = (this.width - this.menu.startButton.width) / 2;
        this.menu.startButton.y = this.height * (3 / 4) - this.menu.startButton.height / 2;
        // 根据比例重新定位关卡入口按钮
        if (typeof this.menu.recomputeLevelButtonsOnResize === 'function') {
          this.menu.recomputeLevelButtonsOnResize(this.width, this.height);
        }
      }
      
      // 如果当前是第一关，重新计算位置
      if (this.currentLevel && this.currentLevel.calculateGrid) {
        this.currentLevel.width = this.width;
        this.currentLevel.height = this.height;
        this.currentLevel.calculateGrid();
        if (this.currentLevel.initButtons) {
          this.currentLevel.initButtons();
        }
      }
    }
  }
  
  handleTouch(x, y) {
    // 如果显示通用弹窗，处理按钮点击
    if (this.modalConfig && this.modalConfig.show) {
      this.handleModalClick(x, y);
      return;
    }
    
    // 如果在菜单状态，处理菜单触摸
    if (this.gameState === GameState.MENU && this.menu) {
      this.menu.handleTouch(x, y);
      return;
    }
    
    // 委托给当前关卡处理触摸
    if (this.currentLevel && this.currentLevel.handleTouch) {
      this.currentLevel.handleTouch(x, y);
    }
  }
  
  // 显示通用弹窗
  showModalDialog(title, message, buttons) {
    this.modalConfig = {
      show: true,
      title: title,
      message: message,
      buttons: buttons
    };
  }
  
  hideModalDialog() {
    this.modalConfig = { show: false };
  }
  
  // 修复：弹窗按钮点击命中检测，只有点击到具体按钮才触发对应回调
  handleModalClick(x, y) {
    if (!this.modalConfig.show) return;
    
    const layout = this.getModalLayout();
    
    for (let i = 0; i < this.modalConfig.buttons.length; i++) {
      const buttonX = layout.startX + i * (layout.buttonWidth + layout.buttonSpacing);
      const withinX = x >= buttonX && x <= buttonX + layout.buttonWidth;
      const withinY = y >= layout.buttonY && y <= layout.buttonY + layout.buttonHeight;
      if (withinX && withinY) {
        // 点击了该按钮
        this.modalConfig.show = false;
        if (this.modalConfig.buttons[i].callback) {
          this.modalConfig.buttons[i].callback();
        }
        break;
      }
    }
  }
  
  getModalLayout() {
    const modalWidth = 280;
    const modalHeight = 200;
    const modalX = (this.width - modalWidth) / 2;
    const modalY = (this.height - modalHeight) / 2;
    
    const buttonWidth = 100;
    const buttonHeight = 40;
    const buttonSpacing = 20;
    const totalButtonsWidth = this.modalConfig.buttons.length * buttonWidth + (this.modalConfig.buttons.length - 1) * buttonSpacing;
    const startX = (this.width - totalButtonsWidth) / 2;
    const buttonY = modalY + modalHeight - 60;
    
    return {
      modalX, modalY, modalWidth, modalHeight,
      buttonWidth, buttonHeight, buttonSpacing,
      startX, buttonY
    };
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update() {
    // 如果在菜单状态，更新菜单
    if (this.gameState === GameState.MENU && this.menu) {
      this.menu.update();
    }
    
    // 委托给当前关卡更新
    if (this.currentLevel && this.currentLevel.update) {
      this.currentLevel.update();
    }
  }
  
  render() {
    // 如果在菜单状态，渲染菜单
    if (this.gameState === GameState.MENU && this.menu) {
      this.menu.render(this.ctx);
    } else {
      // 清空画布
      this.ctx.fillStyle = '#87ceeb';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // 委托给当前关卡渲染
      if (this.currentLevel && this.currentLevel.render) {
        this.currentLevel.render(this.ctx);
      }
    }
    
    // 渲染通用弹窗
    if (this.modalConfig && this.modalConfig.show) {
      this.renderModal();
    }
  }
  
  // 渲染弹窗
  renderModal() {
    // 绘制半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    const layout = this.getModalLayout();
    
    // 绘制弹窗背景
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(layout.modalX, layout.modalY, layout.modalWidth, layout.modalHeight);
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(layout.modalX, layout.modalY, layout.modalWidth, layout.modalHeight);
    
    // 绘制标题
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.modalConfig.title, this.width / 2, layout.modalY + 40);
    
    // 绘制消息
    this.ctx.font = '14px Arial';
    this.ctx.fillText(this.modalConfig.message, this.width / 2, layout.modalY + 80);
    
    // 绘制按钮
    for (let i = 0; i < this.modalConfig.buttons.length; i++) {
      const buttonX = layout.startX + i * (layout.buttonWidth + layout.buttonSpacing);
      
      // 绘制按钮背景
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(buttonX, layout.buttonY, layout.buttonWidth, layout.buttonHeight);
      
      // 绘制按钮文字
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.modalConfig.buttons[i].text, buttonX + layout.buttonWidth / 2, layout.buttonY + layout.buttonHeight / 2 + 5);
    }
  }
  

}

// 创建游戏实例并启动
const game = new GuessIdiomGame();