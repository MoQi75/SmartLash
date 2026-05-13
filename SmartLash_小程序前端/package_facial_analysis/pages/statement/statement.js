const app = getApp();
const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

const PRODUCT_LIST = [
  { id: 1, name: 'XIXI睫毛夹', imageKey: 'eyelash_01', price: '6.9', matchRate: '98' },
  { id: 2, name: '便携卷翘睫毛夹', imageKey: 'eyelash_02', price: '5.9', matchRate: '96' },
  { id: 3, name: '升级款卷翘睫毛夹', imageKey: 'eyelash_03', price: '7.8', matchRate: '95' },
  { id: 4, name: '广角无边框睫毛夹', imageKey: 'eyelash_04', price: '7.9', matchRate: '95' },
  { id: 5, name: '轻盈甜心睫毛夹', imageKey: 'eyelash_05', price: '9.2', matchRate: '93' },
  { id: 6, name: '小巧广角睫毛夹', imageKey: 'eyelash_06', price: '9.9', matchRate: '92' }
];

Page({
  data: {
    layout_height: 0,
    eyeShape: '圆眼长睫',
    eyeClass: 'flat-long',
    eyeDescription: '您的眼部特征偏自然流畅，适合选择卷翘稳定、存在感适中的睫毛夹款式。',
    resultImage: '',
    products: PRODUCT_LIST
  },

  onLoad(options) {
    const sysinfo = wx.getWindowInfo();
    this.setData({ layout_height: sysinfo.windowHeight });
    this.setEyeType(options && options.id);
    this.loadImages();
    this.loadLastAnalysis(options && options.analysisId);
  },

  loadImages() {
    const fileMap = {
      resultFallback: `${CLOUD_PREFIX}/analysis/advertisement.png`
    };
    PRODUCT_LIST.forEach((item) => {
      fileMap[item.imageKey] = `${CLOUD_PREFIX}/goods/${item.imageKey}.jpg`;
    });

    app.resolveCloudFiles(fileMap)
      .then((urls) => {
        this.setData({
          resultImage: this.data.resultImage || urls.resultFallback,
          products: PRODUCT_LIST.map((item) => ({
            ...item,
            image: urls[item.imageKey]
          }))
        });
      })
      .catch((error) => {
        console.error('load packaged statement images failed', error);
      });
  },

  loadLastAnalysis(analysisId) {
    wx.getStorage({
      key: 'last_analysis',
      success: (res) => {
        const data = res.data || {};
        if (analysisId && String(data.id_test) !== String(analysisId)) {
          return;
        }
        this.setEyeType(data.categoryId || data.id);
        if (data.image_main) {
          this.setData({ resultImage: data.image_main });
        }
      }
    });
  },

  setEyeType(id) {
    const eyeTypes = {
      '66169db721821b6d2b54cb77': { shape: '圆眼长睫', class: 'round-long', desc: '您的眼型偏圆、睫毛偏长，适合自然卷翘和眼尾拉长款式，能够增强灵动感。' },
      '66169dc4a7c432936b5826aa': { shape: '圆眼短睫', class: 'round-short', desc: '您的眼型偏圆、睫毛偏短，建议选择纤长提拉型产品，提升眼型延展感。' },
      '66169dcf6e5d2ddb510f806e': { shape: '平眼长睫', class: 'flat-long', desc: '您的眼型偏平、睫毛偏长，适合卷翘支撑更稳的款式，让眼部更立体。' },
      '66169dd9f08210b07d497a50': { shape: '平眼短睫', class: 'flat-short', desc: '您的眼型偏平、睫毛偏短，建议优先选择纤长卷翘组合，帮助提升存在感。' }
    };
    const type = eyeTypes[id] || eyeTypes['66169dcf6e5d2ddb510f806e'];
    this.setData({
      eyeShape: type.shape,
      eyeClass: type.class,
      eyeDescription: type.desc
    });
  },

  saveResult() {
    wx.showToast({ title: '结果已保存', icon: 'success' });
  },

  backToHome() {
    wx.switchTab({ url: '/pages/nav_subpage/index/index' });
  }
});
