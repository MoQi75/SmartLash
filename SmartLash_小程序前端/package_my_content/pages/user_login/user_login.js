const app = getApp();

Page({
  data: {
    login_create_status: false,
    show_back: false,
    show: false,
    buttons: [
      { type: 'default', text: '拒绝', value: 0 },
      { type: 'primary', text: '允许', value: 1 }
    ]
  },

  vires_control() {
    this.setData({ show: true });
  },

  buttontap(e) {
    if (e.detail.item.type === 'default') {
      this.setData({ show: false });
      return;
    }

    this.setData({ show: false });
    this.login_wechat();
  },

  async ensureOpenId() {
    if (app.globalData.user_openID) {
      return app.globalData.user_openID;
    }

    const res = await wx.cloud.callFunction({
      name: 'get_openID'
    });

    const openId = res && res.result && res.result.userInfo && res.result.userInfo.openId;
    if (!openId) {
      throw new Error('openid_not_found');
    }

    app.globalData.user_openID = openId;
    return openId;
  },

  async login_wechat() {
    const db = wx.cloud.database();
    const loginCollection = db.collection('log-in');

    try {
      wx.showLoading({ title: '登录中...' });

      const openId = await this.ensureOpenId();
      const queryRes = await loginCollection.where({ wechat: openId }).get();

      if (queryRes.data.length >= 1) {
        this.login_info = queryRes.data[0];
      } else {
        const addRes = await loginCollection.add({
          data: {
            wechat: openId,
            account: 'WeChat',
            password: '',
            mode: true
          }
        });

        this.login_info = {
          _id: addRes._id,
          wechat: openId,
          account: 'WeChat',
          password: '',
          mode: true
        };
      }

      this.login_status = true;
      await this.create_user_info();
      this.cacheLoginState();
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      wx.navigateBack();
    } catch (error) {
      wx.hideLoading();
      console.error('login_wechat failed', error);
      const message =
        (error && error.errMsg) ||
        (error && error.message) ||
        '微信登录失败';
      wx.showToast({
        title: message.length > 7 ? '登录失败，请看控制台' : message,
        icon: 'none'
      });
    }
  },

  async create_user_info() {
    const db = wx.cloud.database();
    const userCollection = db.collection('user');
    const userRes = await userCollection.where({ _id: this.login_info._id }).get();

    if (userRes.data.length >= 1) {
      this.user_info = userRes.data[0];
      return;
    }

    await userCollection.add({
      data: {
        _id: this.login_info._id,
        avatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        nickname: '',
        gender: '',
        age: 0,
        district: { city: '', province: '', region: '' }
      }
    });

    const createdRes = await userCollection.where({ _id: this.login_info._id }).get();
    this.user_info = createdRes.data[0] || {};
  },

  checkboxChange(e) {
    const checked = e.detail.value.length === 1 && e.detail.value[0] === 'agree';
    this.setData({ login_create_status: checked });
  },

  cacheLoginState() {
    wx.setStorageSync('login_info', this.login_info || {});
    wx.setStorageSync('login_status', !!this.login_status);
    wx.setStorageSync('user_info', this.user_info || {});
  },

  onLoad() {
    this.login_info = {};
    this.login_status = false;
    this.user_info = {};
  },

  onUnload() {
    this.cacheLoginState();
  }
});
