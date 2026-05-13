const app = getApp();

const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

const LOCAL_ICONS = {
  search: '/images/index/search.png',
  lash: '/images/index/lash.png',
  report: '/images/index/report.png',
  test: '/images/index/test.png',
  history: '/images/index/history.png',
  goods: '/images/index/goods.png',
  shopping: '/images/index/shopping.png',
  wish: '/images/index/wish.png',
  all: '/images/index/all.png'
};

const LOCAL_NEWS = {
  news01: '',
  news02: '',
  news03: '',
  news04: '',
  news05: '',
  news06: '',
  news07: '',
  news08: '',
  news09: '',
  news10: ''
};

Page({
  data: {
    icons: LOCAL_ICONS,
    newsImages: LOCAL_NEWS
  },

  onLoad() {
    const fileMap = {
      search: `${CLOUD_PREFIX}/index/search.png`,
      lash: `${CLOUD_PREFIX}/index/lash.png`,
      report: `${CLOUD_PREFIX}/index/report.png`,
      test: `${CLOUD_PREFIX}/index/test.png`,
      history: `${CLOUD_PREFIX}/index/history.png`,
      goods: `${CLOUD_PREFIX}/index/goods.png`,
      shopping: `${CLOUD_PREFIX}/index/shopping.png`,
      wish: `${CLOUD_PREFIX}/index/wish.png`,
      all: `${CLOUD_PREFIX}/index/all.png`,
      news01: `${CLOUD_PREFIX}/news/news_01.jpg`,
      news02: `${CLOUD_PREFIX}/news/news_02.jpg`,
      news03: `${CLOUD_PREFIX}/news/news_03.jpg`,
      news04: `${CLOUD_PREFIX}/news/news_04.jpg`,
      news05: `${CLOUD_PREFIX}/news/news_05.jpg`,
      news06: `${CLOUD_PREFIX}/news/news_06.jpg`,
      news07: `${CLOUD_PREFIX}/news/news_07.jpg`,
      news08: `${CLOUD_PREFIX}/news/news_08.jpg`,
      news09: `${CLOUD_PREFIX}/news/news_09.jpg`,
      news10: `${CLOUD_PREFIX}/news/news_10.jpg`
    };

    app.resolveCloudFiles(fileMap)
      .then((urls) => {
        this.setData({
          icons: {
            search: urls.search || LOCAL_ICONS.search,
            lash: urls.lash || LOCAL_ICONS.lash,
            report: urls.report || LOCAL_ICONS.report,
            test: urls.test || LOCAL_ICONS.test,
            history: urls.history || LOCAL_ICONS.history,
            goods: urls.goods || LOCAL_ICONS.goods,
            shopping: urls.shopping || LOCAL_ICONS.shopping,
            wish: urls.wish || LOCAL_ICONS.wish,
            all: urls.all || LOCAL_ICONS.all
          },
          newsImages: {
            news01: urls.news01 || LOCAL_NEWS.news01,
            news02: urls.news02 || LOCAL_NEWS.news02,
            news03: urls.news03 || LOCAL_NEWS.news03,
            news04: urls.news04 || LOCAL_NEWS.news04,
            news05: urls.news05 || LOCAL_NEWS.news05,
            news06: urls.news06 || LOCAL_NEWS.news06,
            news07: urls.news07 || LOCAL_NEWS.news07,
            news08: urls.news08 || LOCAL_NEWS.news08,
            news09: urls.news09 || LOCAL_NEWS.news09,
            news10: urls.news10 || LOCAL_NEWS.news10
          }
        });
      })
      .catch((error) => {
        console.error('load index cloud images failed', error);
      });
  },

  navigateToDetection() {
    wx.switchTab({
      url: '/pages/nav_subpage/facial_analysis/facial_analysis'
    });
  },

  navigateToReport() {
    wx.navigateTo({
      url: '/pages/nav_subpage/statement/statement'
    });
  },

  navigateToRecords() {
    wx.switchTab({
      url: '/pages/nav_subpage/my_content/my_content'
    });
  },

  navigateToHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  navigateToRecommendation() {
    wx.switchTab({
      url: '/pages/nav_subpage/goods/goods'
    });
  },

  navigateToShopping() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  navigateToWishlist() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  navigateToFunctions() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});
