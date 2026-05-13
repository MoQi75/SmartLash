App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    wx.cloud.init({
      env: 'cloud1-d9g7jgs1qc31ddf86',
      traceUser: true
    });

    wx.cloud.callFunction({
      name: 'get_openID',
      success: (res) => {
        this.globalData.user_openID = res.result.userInfo.openId;
      },
      fail: (error) => {
        console.warn('get_openID failed', error);
      }
    });
  },

  downloadCloudFile(fileID) {
    const cache = this.globalData.cloudFileCache || {};
    if (cache[fileID]) {
      return Promise.resolve(cache[fileID]);
    }

    return new Promise((resolve) => {
      wx.cloud.downloadFile({
        fileID,
        success: (res) => {
          if (res && typeof res.tempFilePath === 'string' && res.tempFilePath) {
            cache[fileID] = res.tempFilePath;
            this.globalData.cloudFileCache = cache;
            resolve(res.tempFilePath);
            return;
          }
          resolve('');
        },
        fail: (downloadError) => {
          console.warn('cloud.downloadFile failed', fileID, downloadError);
          wx.cloud.getTempFileURL({
            fileList: [fileID],
            success: (tempRes) => {
              const item = tempRes && tempRes.fileList && tempRes.fileList[0];
              if (item && item.status === 0 && typeof item.tempFileURL === 'string' && item.tempFileURL) {
                cache[fileID] = item.tempFileURL;
                this.globalData.cloudFileCache = cache;
                resolve(item.tempFileURL);
                return;
              }
              console.warn('cloud.getTempFileURL invalid', fileID, item);
              resolve('');
            },
            fail: (tempError) => {
              console.warn('cloud.getTempFileURL failed', fileID, tempError);
              resolve('');
            }
          });
        }
      });
    });
  },

  resolveCloudFiles(fileMap) {
    const entries = Object.entries(fileMap || {});
    if (!entries.length) {
      return Promise.resolve({});
    }

    const tasks = entries.map(([key, fileID]) =>
      this.downloadCloudFile(fileID).then((value) => [key, value, fileID])
    );

    return Promise.all(tasks).then((pairs) => {
      const result = {};
      const failed = [];

      pairs.forEach(([key, value, fileID]) => {
        if (value) {
          result[key] = value;
        } else {
          failed.push({ key, fileID });
        }
      });

      if (failed.length) {
        console.warn('resolveCloudFiles missing files', failed);
      }

      return result;
    });
  },

  globalData: {
    user_openID: '',
    backendBaseUrl: 'http://10.101.139.78:8002',
    cloudFileCache: {}
  }
});
