# SmartLash

SmartLash 是一个面向眼妆与睫毛推荐场景的双端服务系统，包含网页端、微信小程序端、Django 后端和图像识别算法模块。

## 目录结构

```text
.
├── SmartLash_后端/          # Django 后端与图像分析接口
├── SmartLash_网页前端/      # Vue + Vite 网页端
├── SmartLash_小程序前端/    # 微信小程序前端
├── 算法代码和模型/          # 算法代码、配置与压缩模型权重
├── 启动SmartLash网页.py     # 一键启动网页端
└── 启动SmartLash小程序.py   # 一键打开微信小程序项目
```

## 运行方式

### 网页端

```bash
python 启动SmartLash网页.py
```

脚本会自动完成：

- 解压 `算法代码和模型/模型权重.zip` 中的运行必需模型文件
- 创建后端 `.venv`
- 安装 Python 依赖
- 安装前端 npm 依赖
- 构建网页前端
- 启动 Django 服务
- 打开 `http://127.0.0.1:8002/login?fresh=1`

### 微信小程序端

```bash
python 启动SmartLash小程序.py
```

脚本会自动解压模型权重，并尝试打开微信开发者工具中的小程序项目。

## 运行依赖

- Python 3
- Node.js / npm
- 微信开发者工具（仅小程序端需要）
- 网络环境可访问 Python 与 npm 依赖源

## 可选环境变量

智能问答和 OSS 上传相关密钥不会提交到仓库。需要启用时，可在系统环境变量或 `.smartlash/local.env` 中配置：

```text
DEEPSEEK_API_KEY=your_deepseek_api_key
ALIYUN_OSS_ENABLED=true
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_BUCKET_NAME=your_bucket_name
```

## 模型权重

为便于 GitHub 上传，运行所需权重统一压缩在：

```text
算法代码和模型/模型权重.zip
```

该文件使用 Git LFS 管理。首次运行启动脚本时会自动解压到代码需要的原始路径。

## 说明

仓库不提交 `.venv`、`node_modules`、构建产物、运行日志、缓存文件和解压后的模型权重原文件。需要运行时由启动脚本自动生成或恢复。
