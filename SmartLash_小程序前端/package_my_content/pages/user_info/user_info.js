// pages/my_content/user_info/user_info.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo : {},  //用户的个人信息  avatar（头像），gender（性别）， age（年龄），district（地区（Object））
    user_account : "",  //用户账户

    array : ['男', '女', '无'],   //用户性别单列选择器属性
    index : 0 ,    //用户性别单列选择器属性的索引

    birth_date : "",   //用户出生年月日

    region: ['', ''],  //用户所属地区

    isDialogVisible : false,   // 控制弹窗的显示与隐藏 
    new_account : "",   //用户输入的新账号
  },


 /**
  function ： 用户选择头像（摄像头和相册）
  bind ： user_info页面的头像view
  */
 chooseAvatar(){
    let that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success(res) {
        wx.cloud.uploadFile({
          cloudPath: "userAvatar/" + that.data.userInfo._id + "/" + Date.now() + ".jpg",
          filePath: res.tempFiles[0].tempFilePath,
          success: (res) => {
            console.log(res.fileID)
            that.setData({'userInfo.avatar' : res.fileID})
            console.log(that.data.userInfo)
            that.update_database_cache()  //更新数据库和缓存
          },
          fail: function (err) { wx.showToast({ title: '上传失败', icon: 'none', duration: 2000 }); }
        })
      }
    })
  },


  /**
  function ： 打开Dialog页面
  bind ： user_info页面账号view
  */   
  showDialog: function() {  
    this.setData({   isDialogVisible: true   });  
  },  
    
  /**
  function ： 关闭Dialog页面并重置新账号属性
  bind ： 修改Dialog的取消按钮
  */
  cancel_hideDialog: function() {  
    this.setData({  
      new_account : "", 
      isDialogVisible: false ,
    });  
  },  

  /**
  function ： 用户修改账号
  bind ： 修改Dialog的确定按钮
  logic ： 检测数据库中是否已有该账号，有则提醒用户重新输入；
                                    无则检查是否是微信用户初次修改， 是则检查数据库中_id再修改；
                                                                  不是则检查数据库中原有账号再修改
          隐藏Dialog，完成账号修改。
  */
  ok_hideDialog: function() {  
    const that = this

    const db = wx.cloud.database()
    const todo = db.collection('log-in')
    todo.where({ account : that.data.new_account }).get({
      success: function (res) {
        if (res.data.length >= 1){
          wx.showToast({ title: '账号已存在，请重新输入账号', })
          that.setData({ new_account: "" })
        }
        else {
          todo.where({  _id : that.data.userInfo._id }).update({  //更新数据库
            data: {
              account : that.data.new_account
            },
          })
          that.setData({ user_account : that.data.new_account })  //更新显示层
          wx.getStorage({ //更新缓存区
            key: 'login_info',
            success (res) {
              var login_info = res.data
              login_info.account = that.data.new_account
              wx.setStorage({ key : "login_info", data : login_info }) //缓存用户登录信息
            }
          })
        }
      },
    })
    this.setData({   isDialogVisible: false , });  
  },  

  /** 
  function ： 获取账号input输入
  bind ： 修改Dialog的input
  */
  get_new_account(e){
    const that = this
    that.setData({ new_account : e.detail.value, })
  },


  /** 
  function ： 获取用户性别
  bind ： user_info页面的性别picker
  */
  bindPickerChange: function(e) {
    let that = this;
    console.log('picker发送选择改变，携带值为', e.detail.value)
    that.setData({ index: e.detail.value, }) //保存性别选择器初始值（选择器需要用）
    that.setData({ 'userInfo.gender' : that.data.array[that.data.index] }) //保存用户性别（响应式数据）
    that.update_database_cache() // 更新用户信息数据库和缓存
  },

   /** 
  function ： 获取用户年龄
  bind ： user_info页面的日期picker
  logic ： 现在日期减去用户出生日期获得用户年龄
  */
  bindDateChange: function(e) {
    let that = this;
    console.log('picker发送选择改变，携带值为', e.detail.value)
    that.setData({  birth_date: e.detail.value }) //保存用户出生年月日
    var time_now = new Date().toJSON().substring(0, 10).split('-').map(Number);
    var time_birth = that.data.birth_date.split('-').map(Number);
    var age = time_now[0] - time_birth[0];
    if((time_now[1] - time_birth[1]) < 0 || (time_now[2] - time_birth[2]) < 0 ){
      age = age - 1;
    }
    that.setData({ 'userInfo.age' : age })  //保存用户年龄（响应式数据）
    that.update_database_cache()
  },


   /**
  function ： 获取用户所属地区
  bind ： user_info页面的地区picker
  */
  bindRegionChange: function (e) {
    let that = this;
    console.log('picker发送选择改变，携带值为', e.detail.value)
    that.setData({ region: e.detail.value }) //保存地区选择器初始值（选择器需要用）
    var district = {province : that.data.region[0], city : that.data.region[1], region : that.data.region[2]}
    that.setData({ 'userInfo.district' : district, }) //保存用户所属地区（响应式数据）

    that.update_database_cache()
  },


  /**
  function ： 更新用户信息数据库和缓存
  */
  update_database_cache(){  
    let that = this
    const db = wx.cloud.database()
    const todo = db.collection('user')
    todo.where({ _id : that.data.userInfo._id }).update({
      data: {
        avatar : that.data.userInfo.avatar,
        gender : that.data.userInfo.gender,
        age : that.data.userInfo.age,
        district : that.data.userInfo.district,
      },
    })
    wx.setStorage({ key : "user_info", data : that.data.userInfo }) //缓存用户个人信息
  },


  /**
   * 生命周期函数--监听页面加载
  */
  onLoad(options) {
    const that = this

    wx.getStorage({
      key: 'user_info',
      success (res) {
        that.setData({ userInfo : res.data, })
      }
    })
    wx.getStorage({
      key: 'login_info',
      success (res) {
        that.setData({ user_account : res.data.account, })
      }
    })
   
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    let that = this
    //console.log(that.data.userInfo)
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