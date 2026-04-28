from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
OPEN_URL = "http://127.0.0.1:8002/login?fresh=1"
HEALTH_URL = "http://127.0.0.1:8002/img/hello/"
LOCAL_CONFIG_DIR = ROOT_DIR / ".smartlash"
LOCAL_ENV_FILE = LOCAL_CONFIG_DIR / "local.env"


def find_backend_dir() -> Path:
    for entry in ROOT_DIR.iterdir():
        if entry.is_dir() and (entry / "manage.py").exists() and (entry / "djangoProject1").exists():
            return entry
    raise FileNotFoundError("未找到 Django 后端目录。")


def find_frontend_dir() -> Path:
    for entry in ROOT_DIR.iterdir():
        if entry.is_dir() and (entry / "vite.config.js").exists() and (entry / "package.json").exists():
            return entry
    raise FileNotFoundError("未找到网页前端目录。")


BACKEND_DIR = find_backend_dir()
FRONTEND_DIR = find_frontend_dir()
VENV_DIR = BACKEND_DIR / ".venv"
PYTHON_EXE = VENV_DIR / "Scripts" / "python.exe"
REQUIREMENTS_FILE = BACKEND_DIR / "requirements.txt"
VENV_READY_MARKER = VENV_DIR / ".smartlash-ready"


def resolve_npm_cmd() -> Path:
    npm_cmd = shutil.which("npm.cmd") or shutil.which("npm")
    if npm_cmd:
        return Path(npm_cmd)
    fallback = Path(r"D:\Program Files\nodejs\npm.cmd")
    if fallback.exists():
        return fallback
    raise FileNotFoundError("未找到 npm，请先安装 Node.js。")


def resolve_bootstrap_python() -> list[str]:
    candidates = [
        ["py", "-3.12"],
        ["py", "-3.11"],
        ["py", "-3"],
        [sys.executable],
        ["python"],
    ]
    for candidate in candidates:
        try:
            result = subprocess.run(
                [*candidate, "--version"],
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore",
            )
        except OSError:
            continue
        if result.returncode == 0:
            return candidate
    raise FileNotFoundError("未找到可用 Python，请先安装 Python 3。")


def ensure_exists(path: Path, message: str) -> None:
    if not path.exists():
        raise FileNotFoundError(message)


def is_server_running(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            return 200 <= response.status < 500
    except Exception:
        return False


def load_local_env() -> dict[str, str]:
    env_vars: dict[str, str] = {}
    if not LOCAL_ENV_FILE.exists():
        return env_vars

    for raw_line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env_vars[key.strip()] = value.strip().strip('"').strip("'")
    return env_vars


def run_command(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    subprocess.run(command, cwd=str(cwd), env=env, check=True)


def ensure_backend_venv() -> None:
    if PYTHON_EXE.exists():
        return
    print("未检测到后端虚拟环境，正在创建 .venv ...")
    bootstrap_python = resolve_bootstrap_python()
    run_command([*bootstrap_python, "-m", "venv", str(VENV_DIR)], ROOT_DIR)


def ensure_backend_requirements() -> None:
    ensure_exists(REQUIREMENTS_FILE, f"未找到后端依赖文件: {REQUIREMENTS_FILE}")
    ensure_backend_venv()
    if VENV_READY_MARKER.exists() and VENV_READY_MARKER.stat().st_mtime >= REQUIREMENTS_FILE.stat().st_mtime:
        return

    print("正在安装后端依赖...")
    run_command([str(PYTHON_EXE), "-m", "pip", "install", "--upgrade", "pip"], ROOT_DIR)
    run_command([str(PYTHON_EXE), "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)], ROOT_DIR)
    VENV_READY_MARKER.write_text("ready\n", encoding="utf-8")


def ensure_frontend_dependencies(runtime_env: dict[str, str]) -> None:
    if (FRONTEND_DIR / "node_modules").exists():
        return

    print("未检测到前端依赖，正在执行 npm install ...")
    env = os.environ.copy()
    env.update(runtime_env)
    env["npm_config_cache"] = str(ROOT_DIR / ".npm-cache")
    run_command([str(resolve_npm_cmd()), "install"], FRONTEND_DIR, env=env)


def build_frontend(runtime_env: dict[str, str]) -> None:
    print("正在构建网页前端...")
    env = os.environ.copy()
    env.update(runtime_env)
    env["npm_config_cache"] = str(ROOT_DIR / ".npm-cache")
    run_command([str(resolve_npm_cmd()), "run", "build:backend"], FRONTEND_DIR, env=env)


def start_backend(runtime_env: dict[str, str]) -> subprocess.Popen[bytes]:
    print("正在启动 Django 服务...")
    stdout_path = BACKEND_DIR / "runserver.out.log"
    stderr_path = BACKEND_DIR / "runserver.err.log"
    stdout_file = open(stdout_path, "ab")
    stderr_file = open(stderr_path, "ab")

    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_CONSOLE

    env = os.environ.copy()
    env.update(runtime_env)

    return subprocess.Popen(
        [str(PYTHON_EXE), "manage.py", "runserver", "127.0.0.1:8002", "--noreload"],
        cwd=str(BACKEND_DIR),
        stdout=stdout_file,
        stderr=stderr_file,
        env=env,
        creationflags=creationflags,
    )


def stop_existing_backend() -> None:
    command = r"""
$targets = @()
$targets += Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*manage.py*runserver*127.0.0.1:8002*' }
$targets += Get-NetTCPConnection -LocalPort 8002 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object {
    Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $_.OwningProcess)
  }
$targets |
  Where-Object { $_ } |
  Sort-Object ProcessId -Unique |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
"""
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", command],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)


def wait_for_server(url: str, timeout: float = 30.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if is_server_running(url):
            return True
        time.sleep(0.5)
    return False


def main() -> int:
    try:
        runtime_env = load_local_env()
        ensure_backend_requirements()
        ensure_frontend_dependencies(runtime_env)
        build_frontend(runtime_env)

        if is_server_running(HEALTH_URL):
            print("检测到 8002 端口已有 Django 服务，先关闭旧进程后再启动。")
        stop_existing_backend()

        start_backend(runtime_env)
        if not wait_for_server(HEALTH_URL):
            raise RuntimeError("Django 服务启动超时，请查看后端目录下的日志文件。")

        print(f"正在打开网页: {OPEN_URL}")
        webbrowser.open(OPEN_URL)
        print("启动完成。")
        return 0
    except Exception as exc:
        print(f"启动失败：{exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
