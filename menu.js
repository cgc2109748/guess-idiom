// 首页菜单类
class Menu {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.width = game.width;
    this.height = game.height;
    
    // 背景图片
    this.bgImage = null;
    this.bgImageLoaded = false;
    
    // 开始游戏按钮
    this.startButton = {
      x: (this.width - 200) / 2,
      y: this.height * 0.8,
      width: 200,
      height: 60,
      text: '开始游戏',
      hover: false
    };
    
    // 游戏标题
    this.title = {
      text: '猜成语',
      x: this.width / 2,
      y: this.height / 2 - 80,
      fontSize: 48,
      color: '#8B4513'
    };
    
    // 副标题
    this.subtitle = {
      text: '挑战你的成语知识',
      x: this.width / 2,
      y: this.height / 2 - 30,
      fontSize: 18,
      color: '#654321'
    };
  }
  
  async init() {
    // 加载背景图片
    await this.loadBackgroundImage();
  }
  
  async loadBackgroundImage() {
    return new Promise((resolve, reject) => {
      if (typeof wx !== 'undefined') {
        // 微信小程序环境
        this.bgImage = wx.createImage();
        this.bgImage.onload = () => {
          this.bgImageLoaded = true;
          resolve();
        };
        this.bgImage.onerror = () => {
          console.warn('背景图片加载失败，使用默认背景');
          this.bgImageLoaded = false;
          resolve();
        };
        this.bgImage.src = 'bg.png';
      } else {
        // 浏览器环境
        this.bgImage = new Image();
        this.bgImage.onload = () => {
          this.bgImageLoaded = true;
          resolve();
        };
        this.bgImage.onerror = () => {
          console.warn('背景图片加载失败，使用默认背景');
          this.bgImageLoaded = false;
          resolve();
        };
        this.bgImage.src = './bg.png';
      }
    });
  }
  
  handleTouch(x, y) {
    // 调试信息：输出画布尺寸、点击位置和按钮位置
    console.log('画布尺寸:', this.width, 'x', this.height);
    console.log('点击位置:', x, y);
    console.log('按钮位置:', this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
    console.log('按钮范围:', this.startButton.x, '~', this.startButton.x + this.startButton.width, 
                this.startButton.y, '~', this.startButton.y + this.startButton.height);
    
    // 检查是否点击了开始游戏按钮
    if (x >= this.startButton.x && x <= this.startButton.x + this.startButton.width &&
        y >= this.startButton.y && y <= this.startButton.y + this.startButton.height) {
      console.log('点击了开始游戏按钮');
      this.startGame();
    } else {
      console.log('未点击到按钮');
      console.log('X范围检查:', x >= this.startButton.x, x <= this.startButton.x + this.startButton.width);
      console.log('Y范围检查:', y >= this.startButton.y, y <= this.startButton.y + this.startButton.height);
    }
  }
  
  async startGame() {
    console.log('开始游戏方法被调用');
    try {
      // 初始化第一关
      await this.game.initLevel1();
      console.log('第一关初始化完成');
      // 切换到第一关
      this.game.gameState = this.game.GameState.LEVEL1;
      console.log('游戏状态切换到:', this.game.gameState);
    } catch (error) {
      console.error('初始化第一关失败:', error);
    }
  }
  
  update() {
    // 菜单界面不需要更新逻辑
  }
  
  render(ctx) {
    // 绘制背景
    if (this.bgImageLoaded && this.bgImage) {
      // 绘制背景图片，保持宽高比并居中
      const imageAspect = this.bgImage.width / this.bgImage.height;
      const canvasAspect = this.width / this.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
       if (imageAspect > canvasAspect) {
         // 图片更宽，以高度为准
         drawHeight = this.height * 1;
         drawWidth = drawHeight * 0.5;
         drawX = (this.width - drawWidth) / 2;
         drawY = (this.height - drawHeight) / 2;
       } else {
         // 图片更高，以宽度为准
         drawWidth = this.width * 1.05;
         drawHeight = drawWidth / imageAspect;
         drawX = (this.width - drawWidth) / 2;
         drawY = (this.height - drawHeight) / 2;
       }
      
      ctx.drawImage(this.bgImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // 使用默认背景
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 背景白色蒙版已移除

    // 绘制游戏标题
    // ctx.fillStyle = this.title.color;
    // ctx.font = `bold ${this.title.fontSize}px Arial, "Microsoft YaHei", sans-serif`;
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';
    // ctx.fillText(this.title.text, this.title.x, this.title.y);
    
    // 绘制副标题
    // ctx.fillStyle = this.subtitle.color;
    // ctx.font = `${this.subtitle.fontSize}px Arial, "Microsoft YaHei", sans-serif`;
    // ctx.fillText(this.subtitle.text, this.subtitle.x, this.subtitle.y);
    
    // 绘制开始游戏按钮
    this.renderStartButton(ctx);
  }
  
  renderStartButton(ctx) {
    const button = this.startButton;
    
    // 绘制按钮阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(button.x + 3, button.y + 3, button.width, button.height);
    
    // 绘制按钮背景
    const gradient = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    ctx.fillRect(button.x, button.y, button.width, button.height);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    // 绘制按钮文字
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 24px Arial, "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
    
    // 绘制按钮高光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(button.x, button.y, button.width, button.height / 2);
    
    // 调试：绘制点击区域边框（红色）
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
  }
}

module.exports = Menu;
