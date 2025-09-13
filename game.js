// 引入Level1类
const Level1 = require('./level1.js');

// 游戏状态枚举
const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  LEVEL1: 'level1',
  LEVEL2: 'level2',
  SUCCESS: 'success'
};

// 主游戏类
class GuessIdiomGame {
  constructor() {
    // 检查是否在微信环境
    if (typeof wx !== 'undefined' && wx.createCanvas) {
        this.canvas = wx.createCanvas();
        this.canvas.width = 375;
        this.canvas.height = 667;
      } else {
      // 浏览器环境
      this.canvas = document.getElementById('gameCanvas') || document.createElement('canvas');
      if (!document.getElementById('gameCanvas')) {
        this.canvas.id = 'gameCanvas';
        this.canvas.width = 375;
        this.canvas.height = 667;
        document.body.appendChild(this.canvas);
      }
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
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
    
    this.init();
  }
  
  async init() {
    // 设置触摸事件
    this.setupTouchEvents();
    
    // 初始化第一关
    await this.initLevel1();
    
    // 开始游戏循环
    this.startGameLoop();
  }
  
  async initLevel1() {
    // 创建第一关实例
    this.currentLevel = new Level1(this);
    await this.currentLevel.init();
  }
  
  startGameLoop() {
    this.gameState = GameState.LEVEL1;
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
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this.handleTouch(x, y);
      });
      
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        this.handleTouch(x, y);
      });
    }
  }
  
  handleTouch(x, y) {
    // 如果显示通用弹窗，处理按钮点击
    if (this.modalConfig && this.modalConfig.show) {
      this.handleModalClick(x, y);
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
  
  // 处理弹窗按钮点击
  handleModalClick(x, y) {
    if (!this.modalConfig.show) return;
    
    const layout = this.getModalLayout();
    
    for (let i = 0; i < this.modalConfig.buttons.length; i++) {
      const buttonX = layout.startX + i * (layout.buttonWidth + layout.buttonSpacing);
      
      // if (x >= buttonX && x <= buttonX + layout.buttonWidth && 
      //     y >= layout.buttonY && y <= layout.buttonY + layout.buttonHeight) {
        // 点击了按钮
        this.modalConfig.show = false;
        if (this.modalConfig.buttons[i].callback) {
          this.modalConfig.buttons[i].callback();
        }
        break;
      // }
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
    // 委托给当前关卡更新
    if (this.currentLevel && this.currentLevel.update) {
      this.currentLevel.update();
    }
  }
  
  render() {
    // 清空画布
    this.ctx.fillStyle = '#87ceeb';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 委托给当前关卡渲染
    if (this.currentLevel && this.currentLevel.render) {
      this.currentLevel.render(this.ctx);
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