// package_my_content/pages/app_concerning/app_concerning.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    firm_content : [
      {title:"团队简介", image : "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/enter_icon.png", content : "美在眉睫团队是一群专注于利用计算机视觉技术的创新者，他们通过微信小程序为用户提供智能化的眼球、睫毛和睫毛夹精准匹配服务，简化了在线挑选睫毛夹的流程，让每位用户都能轻松找到最适合自己的产品。", flag : false},
      {title:"小程序简介", image : "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/enter_icon.png", content : "本微信⼩程序，采⽤计算机视觉测量技术，智能化对眼球、睫⽑和睫⽑夹进⾏精准匹配服务，降低了⽤户在线挑选适合的睫⽑夹的难度，提供相应的服务。 ", flag : false},
      {title:"版本特性", image : "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/enter_icon.png", content : "为用户提供睫毛和睫毛夹匹配服务和数据存储服务等。", flag : false},
      {title:"版本信息", image : "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/enter_icon.png", content : "版本号：1.0.0", flag : false}
    ],
  },

  firm_control(e){
    let that = this
    var firmContent = that.data.firm_content
    firmContent[e.currentTarget.dataset.index].image = firmContent[e.currentTarget.dataset.index].flag == false ? "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/down.png" : "cloud://cloud1-9geq9yr408a211a1.636c-cloud1-9geq9yr408a211a1-1349710534/images/my_swiper/enter_icon.png"
    firmContent[e.currentTarget.dataset.index].flag = firmContent[e.currentTarget.dataset.index].flag == false ? true : false
    that.setData({ firm_content : firmContent })
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