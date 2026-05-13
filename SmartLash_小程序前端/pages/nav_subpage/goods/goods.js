const app = getApp();
const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

const PRODUCT_GROUPS = {
  0: [
    { id: 1, name: 'XIXI睫毛夹广角梳齿款', price: 6.9, originalPrice: 11.9, imageKey: 'eyelash_01', tag: '热销', sales: 128 },
    { id: 2, name: '儒琳诗一夹卷翘睫毛夹', price: 5.9, imageKey: 'eyelash_02', tag: '限量', sales: 89 },
    { id: 3, name: 'XIXI升级款卷翘睫毛夹', price: 7.8, originalPrice: 16.88, imageKey: 'eyelash_03', sales: 89 },
    { id: 4, name: '欧凯曼广角无边框睫毛夹', price: 7.9, imageKey: 'eyelash_04', sales: 89 },
    { id: 5, name: 'ROCKSWEET摇滚甜心睫毛夹', price: 9.2, imageKey: 'eyelash_05', sales: 89 },
    { id: 6, name: '郭小妞翘睫广角睫毛夹', price: 9.9, imageKey: 'eyelash_06', sales: 89 }
  ],
  1: [
    { id: 7, name: '摇滚甜心自然飞翘睫毛夹', price: 9.6, originalPrice: 15.9, imageKey: 'eyelash_07', tag: '新品', sales: 56 },
    { id: 8, name: '古迪双头睫毛夹', price: 9.8, originalPrice: 12.8, imageKey: 'eyelash_08', tag: '新品', sales: 42 },
    { id: 9, name: '妆丽雅广角睫毛夹', price: 11.8, originalPrice: 19.9, imageKey: 'eyelash_09', tag: '新品', sales: 56 },
    { id: 10, name: '欧亿姿自然卷翘睫毛夹', price: 8.45, imageKey: 'eyelash_10', sales: 42 },
    { id: 11, name: '蒙丽丝初学者定型睫毛夹', price: 8.8, imageKey: 'eyelash_11', sales: 56 },
    { id: 12, name: '星兮广角睫毛夹', price: 10.01, imageKey: 'eyelash_12', sales: 42 }
  ],
  2: [
    { id: 13, name: '儒琳诗持久定型睫毛夹', price: 9.9, originalPrice: 15.9, imageKey: 'eyelash_13', tag: '限量', sales: 76 },
    { id: 14, name: 'Jill leen睫毛卷翘器', price: 7.48, originalPrice: 11.9, imageKey: 'eyelash_14', tag: '新品', sales: 63 },
    { id: 15, name: '三资堂睫毛夹自然持久定型', price: 8.9, originalPrice: 12.9, imageKey: 'eyelash_15', tag: '新品', sales: 56 },
    { id: 16, name: 'AKF广角太阳花定型款', price: 19.9, imageKey: 'eyelash_16', sales: 42 },
    { id: 17, name: '欧亿姿一夹即翘', price: 7.9, imageKey: 'eyelash_17', sales: 56 },
    { id: 18, name: '贝印迷你睫毛夹', price: 16.8, imageKey: 'eyelash_18', sales: 42 }
  ],
  3: [
    { id: 19, name: 'XIXI睫毛夹太阳花卷翘款', price: 7.82, originalPrice: 13.85, imageKey: 'eyelash_19', tag: '套装', sales: 34 },
    { id: 20, name: '古迪局部睫毛夹', price: 8.9, originalPrice: 12.8, imageKey: 'eyelash_20', tag: '新品', sales: 28 },
    { id: 21, name: 'ZEESEA滋色飞翘睫毛夹', price: 19.9, originalPrice: 26.58, imageKey: 'eyelash_21', tag: '新品', sales: 56 },
    { id: 22, name: 'PIAC卷翘睫毛夹', price: 8.91, imageKey: 'eyelash_22', sales: 42 },
    { id: 23, name: '郭小妞按压式局部睫毛夹', price: 7.9, imageKey: 'eyelash_23', sales: 56 },
    { id: 24, name: 'Skinstar便携式睫毛夹组合', price: 12.6, imageKey: 'eyelash_24', sales: 42 }
  ]
};

function buildLocalProducts() {
  const products = {};
  Object.keys(PRODUCT_GROUPS).forEach((key) => {
    products[key] = PRODUCT_GROUPS[key].map((item) => ({
      ...item,
      image: ''
    }));
  });
  return products;
}

Page({
  data: {
    bannerImage: '',
    categories: ['圆眼长睫', '圆眼短睫', '平眼长睫', '平眼短睫'],
    products: buildLocalProducts(),
    currentCategory: 0,
    scrollLeft: 0
  },

  onLoad() {
    const fileMap = {
      banner: `${CLOUD_PREFIX}/index/banner.png`
    };

    Object.values(PRODUCT_GROUPS).flat().forEach((item) => {
      fileMap[item.imageKey] = `${CLOUD_PREFIX}/goods/${item.imageKey}.jpg`;
    });

    app.resolveCloudFiles(fileMap)
      .then((urls) => {
        const products = {};
        Object.keys(PRODUCT_GROUPS).forEach((key) => {
          products[key] = PRODUCT_GROUPS[key].map((item) => ({
            ...item,
            image: urls[item.imageKey] || ''
          }));
        });

        this.setData({
          bannerImage: urls.banner || this.data.bannerImage,
          products
        });
      })
      .catch((error) => {
        console.error('load goods images failed', error);
      });
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    const scrollLeft = (index - 1) * 100;
    this.setData({
      currentCategory: index,
      scrollLeft
    });
  },

  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/detail?id=${productId}`
    });
  },

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '发现优质美睫产品',
      path: '/pages/nav_subpage/goods/goods'
    };
  }
});
