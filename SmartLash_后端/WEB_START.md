# 单入口网页启动方式

当前 `SmartLash_网页前端` 和后端接口已经合并为 Django 单入口。

## 启动命令

在 `SmartLash_后端` 目录运行：

```powershell
.\run_web.ps1
```

## 启动后访问

```text
http://127.0.0.1:8002/
```

## 说明

- 脚本会先把 `SmartLash_网页前端` 构建到 `frontend_dist`
- 然后由 Django 同时提供网页和 `/img/...` 接口
- 正式使用时不需要再单独打开 `5173`
