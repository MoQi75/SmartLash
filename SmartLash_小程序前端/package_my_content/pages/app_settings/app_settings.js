// pages/my_content/app_settings/app_settings.js
const app = getApp(); 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_night : false,
    isVirsDialogVisible : false,
  },

  exit(){
    wx.clearStorage()
    wx.navigateBack()
  },
  night_switch: function(e){
    let that = this
    that.setData({   is_night: e.detail.value   });  
  },
  storage_open(){
    let that = this
    that.setData({   isVirsDialogVisible : true });  
  },
  clear_storage(){
    let that = this
    wx.clearStorage()
    that.setData({   isVirsDialogVisible : false })
  },
  dialog_cancel(){
    let that = this
    that.setData({   isVirsDialogVisible : false })
  },
  virs_charge(){
    wx.openSetting()
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})