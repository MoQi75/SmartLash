// pages/my_content/test_record/test_record.js
Page({
  data: {
    filters: ['全部', '最近7天', '最近30天'],
    activeFilter: 0,
    stats: {
      total: 0,
      avgGrowth: '0.0mm',
      currentLevel: 'A'
    },
    isLoading: false
  },

  onLoad() {
    this.loadData();
  },

  navigateToDetail: function() {
    wx.navigateTo({
      url: '/pages/nav_subpage/statement/statement'
    });
  },
  loadData() {
    this.setData({ isLoading: true });
    setTimeout(() => {
      this.calculateStats();
      this.setData({ isLoading: false });
    }, 800);
  },

  calculateStats() {
    const { records } = this.data;
    const stats = {
      total: records.length,
      avgGrowth: this.calculateAvgGrowth(),
      currentLevel: this.getCurrentLevel()
    };
    this.setData({ stats });
  },

  calculateAvgGrowth() {
    const trends = this.data.records
      .map(r => r.indicators.length.trend)
      .filter(t => t > 0);
      
    const avg = trends.length > 0 
      ? (trends.reduce((a, b) => a + b, 0) / trends.length).toFixed(1)
      : 0;
      
    return `${avg}mm`;
  },

  getCurrentLevel() {
    const lastRecord = this.data.records[0];
    return lastRecord ? lastRecord.indicators.strength.value : 'A';
  },

  switchFilter(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== this.data.activeFilter) {
      this.setData({ activeFilter: index });
      this.filterRecords(index);
    }
  },

  filterRecords(type) {
    console.log('筛选类型:', type);
    this.loadData();
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recordDetail/recordDetail?id=${id}`
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
})