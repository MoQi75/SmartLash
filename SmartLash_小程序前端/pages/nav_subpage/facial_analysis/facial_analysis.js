const app = getApp();
const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

const LOCAL_IMAGES = {
  icon: '/images/analysis/icon.png',
  showBack: '/images/analysis/show_back.png',
  camera: '/images/analysis/camera.png',
  ai: '/images/analysis/ai.png',
  reported: '/images/analysis/reported.png',
  advertisement: ''
};

Page({
  data: {
    last_analysis: '暂无数据',
    last_analysis_flag: false,
    images: LOCAL_IMAGES
  },

  onLoad() {
    app.resolveCloudFiles({
      icon: `${CLOUD_PREFIX}/analysis/icon.png`,
      showBack: `${CLOUD_PREFIX}/analysis/show_back.png`,
      camera: `${CLOUD_PREFIX}/analysis/camera.png`,
      ai: `${CLOUD_PREFIX}/analysis/ai.png`,
      reported: `${CLOUD_PREFIX}/analysis/reported.png`,
      advertisement: `${CLOUD_PREFIX}/analysis/advertisement.png`
    }).then((images) => {
      this.setData({
        images: {
          icon: images.icon || LOCAL_IMAGES.icon,
          showBack: images.showBack || LOCAL_IMAGES.showBack,
          camera: images.camera || LOCAL_IMAGES.camera,
          ai: images.ai || LOCAL_IMAGES.ai,
          reported: images.reported || LOCAL_IMAGES.reported,
          advertisement: images.advertisement || LOCAL_IMAGES.advertisement
        }
      });
    }).catch((error) => {
      console.error('load facial_analysis images failed', error);
    });
  },

  analysis_begin() {
    wx.getStorage({
      key: 'login_status',
      success(res) {
        wx.navigateTo({
          url: res.data
            ? '/package_facial_analysis/pages/camera_face/camera_face'
            : '/package_my_content/pages/user_login/user_login'
        });
      },
      fail() {
        wx.navigateTo({
          url: '/package_my_content/pages/user_login/user_login'
        });
      }
    });
  },

  last_analysis() {
    wx.getStorage({
      key: 'last_analysis',
      success(res) {
        const data = res.data || {};
        const categoryId = data.categoryId || data.id || '';
        const analysisId = data.id_test || '';
        wx.navigateTo({
          url: `/package_facial_analysis/pages/statement/statement?id=${categoryId}&analysisId=${analysisId}`
        });
      }
    });
  },

  onShow() {
    wx.getStorage({
      key: 'last_analysis',
      success: () => {
        this.setData({
          last_analysis: '结果查看',
          last_analysis_flag: true
        });
      },
      fail: () => {
        this.setData({
          last_analysis: '暂无数据',
          last_analysis_flag: false
        });
      }
    });
  }
});
