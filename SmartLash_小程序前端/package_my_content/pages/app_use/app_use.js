// package_my_content/pages/app_use/app_use.js
Page({
  data: {
    layout_height : 0,
    isDialogVisible : false,   // 控制弹窗的显示与隐藏 
    dialog_title : "",
    dialog_image : "",

    use_item : [
      {id : 0, title : "采集操作流程", step_item : [
      {number : 1, content : "点击开始采集按钮", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_1.png"},
       {number : 2, content : "观看示例", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_2.png"},
      {number : 3, content : "按照提示，点击主视图", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_3.png"},
      {number : 4, content : "按照提示，点击右视图", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_4.png"},
      {number : 5, content : "按照提示，点击左视图", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_5.png"},
      {number : 6, content : "点击提交按钮并等待", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_6.png"},
      {number : 7, content : "获得检测报表", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/analysis_step_7.png"}],
      end : "恭喜您完成采集！",
      dialog_title : "采集操作示例"},
      {id : 1, title : "登录操作流程", step_item : [
      {number : 1, content : "点击我的导航", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step1.jpg"},
      {number : 2, content : "点击灰色头像", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step2.jpg"},
      {number : 3, content : "勾选隐私协议", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step3.jpg"},
      {number : 4, content : "点击微信登录按钮", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step4.jpg"},
      {number : 5, content : "点击权限允许按钮", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step5.jpg"},
      {number : 6, content : "登录成功", image : "cloud://intelligence-eyelas-5cp2d403d836.696e-intelligence-eyelas-5cp2d403d836-1323971123/images/my_swiper/app_use/login_step6.jpg"}],
      end : "恭喜您登录成功！",
      dialog_title : "登录操作示例"}
    ],

  },

  image_show(e){
    let that = this
    that.setData({dialog_title : that.data.use_item[e.currentTarget.dataset.use].dialog_title,
                  dialog_image : that.data.use_item[e.currentTarget.dataset.use].step_item[e.currentTarget.dataset.step - 1].image })
    that.setData({isDialogVisible : true})
  },
  dialog_control(){
    let that = this
    that.setData({isDialogVisible : false})
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this
    const sysinfo = wx.getSystemSetting()
    that.setData({
      layout_height: sysinfo.screenHeight,
    })
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