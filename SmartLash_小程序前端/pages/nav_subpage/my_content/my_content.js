const app = getApp();
const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

Page({
  data: {
    login_status: false,
    image: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    user_image: '',
    user_ID: '智能美睫用户',
    images: {}
  },

  onLoad() {
    app.resolveCloudFiles({
      user: `${CLOUD_PREFIX}/my/user.png`,
      skin: `${CLOUD_PREFIX}/my/skin_icon.png`,
      tutorial: `${CLOUD_PREFIX}/my/tutorial_icon.png`,
      set: `${CLOUD_PREFIX}/my/set_icon.png`,
      about: `${CLOUD_PREFIX}/my/about_icon.png`,
      end: `${CLOUD_PREFIX}/my/end_icon.png`
    }).then((images) => {
      this.setData({
        images,
        user_image: images.user
      });
    }).catch((error) => {
      console.error('load my_content images failed', error);
    });
  },

  app_use() {
    wx.navigateTo({ url: '/package_my_content/pages/app_use/app_use' });
  },

  app_concerning() {
    wx.navigateTo({ url: '/package_my_content/pages/app_concerning/app_concerning' });
  },

  app_settings() {
    wx.navigateTo({ url: '/package_my_content/pages/app_settings/app_settings' });
  },

  user_login() {
    wx.navigateTo({ url: '/package_my_content/pages/user_login/user_login' });
  },

  user_info() {
    wx.navigateTo({ url: '/package_my_content/pages/user_info/user_info' });
  },

  test_record_switch() {
    wx.getStorage({
      key: 'login_info',
      success(res) {
        const db = wx.cloud.database();
        const todo = db.collection('record-test');
        const userID = res.data._id;
        todo.where({ id_user: userID }).count({
          success(countRes) {
            wx.navigateTo({
              url: `/package_my_content/pages/test_record/test_record?userID=${userID}&recordCount=${countRes.total}`
            });
          },
          fail: console.error
        });
      }
    });
  },

  onShow() {
    wx.getStorage({
      key: 'login_status',
      success: (res) => {
        this.setData({ login_status: res.data });
        if (res.data) {
          wx.getStorage({
            key: 'login_info',
            success: (loginRes) => {
              this.setData({ user_ID: loginRes.data.account });
            }
          });
          wx.getStorage({
            key: 'user_info',
            success: (userRes) => {
              this.setData({
                user_image: userRes.data.avatar === '' ? (this.data.images.user || this.data.image) : userRes.data.avatar
              });
            }
          });
        }
      },
      fail: () => {
        this.setData({
          login_status: false,
          user_image: this.data.images.user || this.data.image
        });
      }
    });
  }
});
