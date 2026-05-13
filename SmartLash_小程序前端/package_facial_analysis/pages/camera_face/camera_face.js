const app = getApp();

const CLOUD_PREFIX = 'cloud://cloud1-d9g7jgs1qc31ddf86.636c-cloud1-d9g7jgs1qc31ddf86-1423443526/static';

Page({
  data: {
    isAuth: false,
    cameraReady: false,
    camera_position: 'front',
    cameraEngine: null,
    layout_height: 0,
    load_time: '',
    images: {},
    tip_text: '请将眼睛对准取景区域',
    flag_main: false,
    flag_main_shut: false,
    image_main: '',
    image_main_shut: '',
    openEyeImage: '',
    closedEyeImage: ''
  },

  onLoad() {
    this.captureTimers = [];
    this.isCapturing = false;

    const sysinfo = wx.getWindowInfo();
    this.setData({
      layout_height: sysinfo.screenHeight,
      cameraEngine: wx.createCameraContext(),
      load_time: Date.now()
    });

    app.resolveCloudFiles({
      plus: `${CLOUD_PREFIX}/camera_face/plus.png`,
      face: `${CLOUD_PREFIX}/camera_face/face.png`,
      peopleFace: `${CLOUD_PREFIX}/camera_face/people_face.png`
    }).then((images) => {
      this.setData({
        images: {
          ...images,
          peopleFace: '/images/camera_face/people_face.png'
        },
        openEyeImage: images.plus || '',
        closedEyeImage: images.plus || ''
      });
    }).catch((error) => {
      console.error('load camera_face images failed', error);
    });

    this.checkCameraAuth();
  },

  onShow() {
    this.setData({ load_time: Date.now() });
    this.checkCameraAuth();
  },

  onUnload() {
    this.clearCaptureTimers();
  },

  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        const auth = res.authSetting['scope.camera'];
        if (auth) {
          this.setData({
            isAuth: true,
            cameraReady: true,
            tip_text: '请将眼睛对准取景区域'
          });
          this.startCaptureFlow();
          return;
        }

        if (auth === false) {
          this.setData({
            isAuth: false,
            cameraReady: false,
            tip_text: ''
          });
          return;
        }

        wx.authorize({
          scope: 'scope.camera',
          success: () => {
            this.setData({
              isAuth: true,
              cameraReady: true,
              tip_text: '请将眼睛对准取景区域'
            });
            this.startCaptureFlow();
          },
          fail: () => {
            this.setData({
              isAuth: false,
              cameraReady: false,
              tip_text: ''
            });
          }
        });
      }
    });
  },

  openCameraSettings() {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        this.setData({
          isAuth: true,
          cameraReady: true,
          tip_text: '请将眼睛对准取景区域'
        });
        this.startCaptureFlow(800);
      },
      fail: () => {
        this.openCameraSettingsFallback();
      }
    });
  },

  openCameraSettingsFallback() {
    if (wx.openAppAuthorizeSetting) {
      wx.openAppAuthorizeSetting({
        success: (res) => {
          if (res.authSetting && res.authSetting['scope.camera']) {
            this.setData({
              isAuth: true,
              cameraReady: true,
              tip_text: '请将眼睛对准取景区域'
            });
            this.startCaptureFlow(800);
            return;
          }

          this.setData({
            isAuth: false,
            cameraReady: false,
            tip_text: ''
          });
        },
        fail: () => {
          this.openWxSettingFallback();
        }
      });
      return;
    }

    this.openWxSettingFallback();
  },

  openWxSettingFallback() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({
            isAuth: true,
            cameraReady: true,
            tip_text: '请将眼睛对准取景区域'
          });
          this.startCaptureFlow(800);
          return;
        }

        this.setData({
          isAuth: false,
          cameraReady: false,
          tip_text: ''
        });
      },
      fail: () => {
        this.setData({
          isAuth: false,
          cameraReady: false,
          tip_text: ''
        });
      }
    });
  },

  forceOpenCamera() {
    this.setData({
      isAuth: true,
      cameraReady: true,
      tip_text: '正在尝试打开相机...'
    });
    this.startCaptureFlow(1200);
  },

  clearCaptureTimers() {
    const timers = this.captureTimers || [];
    timers.forEach((timer) => clearTimeout(timer));
    this.captureTimers = [];
  },

  queueTimeout(fn, delay) {
    if (!this.captureTimers) {
      this.captureTimers = [];
    }

    const timer = setTimeout(() => {
      this.captureTimers = (this.captureTimers || []).filter((item) => item !== timer);
      fn();
    }, delay);

    this.captureTimers.push(timer);
  },

  switchCamera() {
    const nextPosition = this.data.camera_position === 'front' ? 'back' : 'front';
    this.clearCaptureTimers();
    this.isCapturing = false;
    this.setData({ camera_position: nextPosition });
    this.startCaptureFlow(1200);
  },

  cameraError(error) {
    console.error('cameraError', error);
    this.setData({
      isAuth: false,
      cameraReady: false,
      tip_text: '相机启动失败，请稍后重试'
    });
  },

  updateTip(control) {
    const tipMap = {
      open: '请保持不动',
      close: '请闭眼',
      done: '拍摄完成，正在分析'
    };

    this.setData({
      tip_text: tipMap[control] || this.data.tip_text
    });
  },

  startCaptureFlow(initialDelay = 1800) {
    if (!this.data.cameraReady || !this.data.isAuth || this.isCapturing) {
      return;
    }

    this.clearCaptureTimers();
    this.isCapturing = true;
    this.setData({
      tip_text: '请保持不动',
      flag_main: false,
      flag_main_shut: false,
      image_main: '',
      image_main_shut: '',
      openEyeImage: this.data.images.plus || '',
      closedEyeImage: this.data.images.plus || ''
    });

    this.queueTimeout(() => {
      this.takeStagePhoto('open');
    }, initialDelay);
  },

  takeStagePhoto(stage) {
    const cameraContext = this.data.cameraEngine || wx.createCameraContext();
    this.setData({ cameraEngine: cameraContext });

    cameraContext.takePhoto({
      quality: 'low',
      success: (res) => {
        if (stage === 'open') {
          this.setData({
            flag_main: true,
            image_main: res.tempImagePath,
            openEyeImage: res.tempImagePath,
            tip_text: '睁眼照已保存'
          });

          this.queueTimeout(() => {
            this.updateTip('close');
            this.queueTimeout(() => {
              this.takeStagePhoto('closed');
            }, 1800);
          }, 800);
          return;
        }

        this.setData({
          flag_main_shut: true,
          image_main_shut: res.tempImagePath,
          closedEyeImage: res.tempImagePath
        });
        this.updateTip('done');
        wx.showToast({ title: '拍摄完成', icon: 'success', duration: 1200 });
        this.submit();
      },
      fail: (error) => {
        console.error('takePhoto failed', error);
        this.isCapturing = false;
        this.setData({ tip_text: '拍照失败，请重试' });
      }
    });
  },

  submit() {
    if (!this.data.flag_main || !this.data.flag_main_shut) {
      wx.showToast({ title: '需要两张照片', icon: 'none' });
      this.isCapturing = false;
      return;
    }

    wx.showLoading({ title: '分析中...', mask: true });
    this.save_Storage_Database()
      .then((analysis) => {
        wx.redirectTo({
          url: `/package_facial_analysis/pages/statement/statement?id=${analysis.categoryId}&analysisId=${this.data.load_time}`
        });
      })
      .catch((err) => {
        console.error('analysis failed', err);
        wx.showToast({ title: err.message || '处理失败', icon: 'none' });
      })
      .finally(() => {
        this.isCapturing = false;
        wx.hideLoading();
      });
  },

  getShapeNameByCategoryId(categoryId) {
    const shapeMap = {
      '66169db721821b6d2b54cb77': 'round-long',
      '66169dc4a7c432936b5826aa': 'round-short',
      '66169dcf6e5d2ddb510f806e': 'flat-long',
      '66169dd9f08210b07d497a50': 'flat-short'
    };

    return shapeMap[categoryId] || 'flat-long';
  },

  uploadImage(tempImagePath) {
    return new Promise((resolve, reject) => {
      const baseUrl = (app.globalData && app.globalData.backendBaseUrl) || 'http://127.0.0.1:8002';
      wx.uploadFile({
        url: `${baseUrl}/img/get_main_b/`,
        filePath: tempImagePath,
        name: 'main_b',
        timeout: 60000,
        success: (res) => {
          let result;

          try {
            result = JSON.parse(res.data);
          } catch (error) {
            reject(new Error('识别结果解析失败'));
            return;
          }

          if (!result || result.status !== 200) {
            reject(new Error((result && result.message) || '检测失败'));
            return;
          }

          const eyeResult = Number(result.data);
          const categoryId = eyeResult >= 4 ? '66169db721821b6d2b54cb77' : '66169dcf6e5d2ddb510f806e';

          resolve({
            eyeResult,
            categoryId,
            eyeShape: this.getShapeNameByCategoryId(categoryId)
          });
        },
        fail: (error) => {
          reject(new Error(error.errMsg || '检测请求失败'));
        }
      });
    });
  },

  uploadCloudImage(cloudPath, filePath) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res) => resolve(res.fileID),
        fail: () => reject(new Error('图片上传失败'))
      });
    });
  },

  saveRecord(data, analysisResult) {
    return wx.cloud.database().collection('record-test')
      .add({ data })
      .then(() => {
        wx.setStorageSync('last_analysis', data);
        return analysisResult;
      });
  },

  save_Storage_Database() {
    const analysisTask = this.uploadImage(this.data.image_main_shut);
    const imageMainTask = this.uploadCloudImage(`gather/main/${this.data.load_time}.png`, this.data.image_main);
    const imageClosedTask = this.uploadCloudImage(`gather/main_shut/${this.data.load_time}.png`, this.data.image_main_shut);

    return Promise.all([analysisTask, imageMainTask, imageClosedTask]).then(([analysisResult, temp_image_main, temp_image_main_shut]) => {
      const date = new Date(this.data.load_time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const record = {
        id_test: this.data.load_time,
        id: analysisResult.categoryId,
        categoryId: analysisResult.categoryId,
        result: analysisResult.eyeResult,
        shape: analysisResult.eyeShape,
        eye_shape: analysisResult.eyeShape,
        year,
        month,
        day,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        image_main: temp_image_main,
        image_main_shut: temp_image_main_shut,
        createTime: wx.cloud.database().serverDate()
      };

      return new Promise((resolve, reject) => {
        wx.getStorage({
          key: 'login_info',
          success: (res) => {
            record.id_user = res.data._id;
            this.saveRecord(record, analysisResult).then(resolve).catch(reject);
          },
          fail: () => {
            this.saveRecord(record, analysisResult).then(resolve).catch(reject);
          }
        });
      });
    });
  }
});
