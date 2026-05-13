const app = getApp();
const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const LOCAL_IMAGES = {
  headerBg: '/images/large_model/header-bg.png',
  aiIcon: '/images/large_model/ai_icon.png',
  user: '/images/my/user.png',
  assistant: '/images/large_model/AI助手.png',
  avatar: '/images/large_model/ai-avatar.png',
  send: '/images/large_model/send-icon.png'
};

Page({
  data: {
    messages: [],
    inputValue: '',
    isLoading: false,
    scrollTop: 0,
    showPrompts: true,
    prompts: [
      { text: '什么是圆眼长睫？' },
      { text: '推荐几个大众的睫毛夹' },
      { text: '睫毛如何保养得更好？' },
      { text: '如何保持健康的护肤？' }
    ],
    typingTimer: null,
    currentTypingMessage: null,
    images: LOCAL_IMAGES
  },

  onLoad() {
    app.resolveCloudFiles({
      headerBg: `${CLOUD_PREFIX}/large_model/header-bg.png`,
      aiIcon: `${CLOUD_PREFIX}/large_model/ai_icon.png`,
      user: `${CLOUD_PREFIX}/my/user.png`,
      assistant: `${CLOUD_PREFIX}/large_model/AI助手.png`,
      avatar: `${CLOUD_PREFIX}/large_model/ai-avatar.png`,
      send: `${CLOUD_PREFIX}/large_model/send-icon.png`
    }).then((images) => {
      this.setData({
        images: {
          headerBg: images.headerBg || LOCAL_IMAGES.headerBg,
          aiIcon: images.aiIcon || LOCAL_IMAGES.aiIcon,
          user: images.user || LOCAL_IMAGES.user,
          assistant: images.assistant || LOCAL_IMAGES.assistant,
          avatar: images.avatar || LOCAL_IMAGES.avatar,
          send: images.send || LOCAL_IMAGES.send
        }
      });
    }).catch((error) => {
      console.error('load large_model images failed', error);
    });

    this.addMessage('assistant', '你好！我是 AI 助手，有什么可以帮助您的吗？');
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer);
    }
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  usePrompt(e) {
    const promptText = e.currentTarget.dataset.prompt;
    this.setData({
      inputValue: promptText,
      showPrompts: false
    });
  },

  clearChat() {
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer);
    }

    this.setData({
      messages: [],
      inputValue: '',
      isLoading: false,
      showPrompts: true,
      typingTimer: null,
      currentTypingMessage: null,
      scrollTop: 0
    });

    this.addMessage('assistant', '你好！我是 AI 助手，有什么可以帮助您的吗？');
  },

  sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.isLoading) {
      return;
    }

    this.addMessage('user', content);
    this.setData({
      inputValue: '',
      showPrompts: false,
      isLoading: true
    });
    this.callAIModel(content);
  },

  callAIModel(prompt) {
    const baseUrl = (app.globalData && app.globalData.backendBaseUrl) || 'http://127.0.0.1:8002';
    const payload = {
      question: prompt,
      history: this.buildHistoryForApi(),
      analysis: this.buildAnalysisContext()
    };

    wx.showLoading({
      title: '思考中...'
    });

    wx.request({
      url: `${baseUrl}/img/chat/`,
      method: 'POST',
      timeout: 30000,
      header: {
        'content-type': 'application/json'
      },
      data: payload,
      success: (res) => {
        wx.hideLoading();
        this.setData({ isLoading: false });

        const result = res.data || {};
        if (result.status === 200 && result.data && result.data.reply) {
          this.typeMessage('assistant', result.data.reply);
          return;
        }

        this.typeMessage('assistant', result.message || 'AI 服务暂时不可用，请稍后再试。');
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        this.typeMessage('assistant', 'AI 服务连接失败，请确认本地后端已经启动。');
      }
    });
  },

  buildHistoryForApi() {
    return this.data.messages.map((item) => ({
      role: item.role,
      content: item.content
    }));
  },

  buildAnalysisContext() {
    try {
      const lastAnalysis = wx.getStorageSync('last_analysis') || {};
      return {
        profile: {
          label: lastAnalysis.shape || lastAnalysis.eye_shape || '',
          description: lastAnalysis.shape || lastAnalysis.eye_shape || '',
          tone: '',
          aiAdvice: '',
          careTips: []
        },
        backend: {
          className: lastAnalysis.shape || lastAnalysis.eye_shape || ''
        },
        products: []
      };
    } catch (error) {
      return {};
    }
  },

  typeMessage(role, content) {
    const newMessage = {
      id: Date.now(),
      role,
      content: '',
      time: formatTime(),
      isTyping: true
    };

    this.setData({
      messages: [...this.data.messages, newMessage],
      currentTypingMessage: newMessage.id
    });

    let i = 0;
    const speed = 30;

    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer);
    }

    const timer = setInterval(() => {
      if (i < content.length) {
        const updatedMessages = this.data.messages.map((msg) => {
          if (msg.id === newMessage.id) {
            return {
              ...msg,
              content: content.substring(0, i + 1)
            };
          }
          return msg;
        });

        this.setData({
          messages: updatedMessages,
          scrollTop: this.data.scrollTop + 1000
        });

        i++;
      } else {
        clearInterval(timer);
        this.setData({
          typingTimer: null,
          currentTypingMessage: null
        });

        const completedMessages = this.data.messages.map((msg) => {
          if (msg.id === newMessage.id) {
            return {
              ...msg,
              isTyping: false
            };
          }
          return msg;
        });

        this.setData({ messages: completedMessages });
      }
    }, speed);

    this.setData({ typingTimer: timer });
  },

  addMessage(role, content) {
    const newMessage = {
      id: Date.now(),
      role,
      content,
      time: formatTime()
    };

    this.setData(
      {
        messages: [...this.data.messages, newMessage]
      },
      () => {
        this.setData({
          scrollTop: this.data.scrollTop + 1000
        });
      }
    );
  }
});
