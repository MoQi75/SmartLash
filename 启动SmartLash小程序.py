from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

try:
    import winreg
except ImportError:  # pragma: no cover
    winreg = None


ROOT_DIR = Path(__file__).resolve().parent

CLI_CANDIDATES = [
    Path(r"D:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"),
    Path(r"D:\Program Files (x86)\Tencent\微信web开发者工具\cli"),
    Path(r"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"),
    Path(r"C:\Program Files (x86)\Tencent\微信web开发者工具\cli"),
    Path(r"D:\Program Files\Tencent\微信web开发者工具\cli.bat"),
    Path(r"D:\Program Files\Tencent\微信web开发者工具\cli"),
    Path(r"C:\Program Files\Tencent\微信web开发者工具\cli.bat"),
    Path(r"C:\Program Files\Tencent\微信web开发者工具\cli"),
]

GUI_CANDIDATES = [
    Path(r"D:\Program Files (x86)\Tencent\微信web开发者工具\微信开发者工具.exe"),
    Path(r"C:\Program Files (x86)\Tencent\微信web开发者工具\微信开发者工具.exe"),
    Path(r"D:\Program Files\Tencent\微信web开发者工具\微信开发者工具.exe"),
    Path(r"C:\Program Files\Tencent\微信web开发者工具\微信开发者工具.exe"),
    Path(r"D:\Program Files (x86)\Tencent\微信web开发者工具\wechatdevtools.exe"),
    Path(r"C:\Program Files (x86)\Tencent\微信web开发者工具\wechatdevtools.exe"),
    Path(r"D:\Program Files\Tencent\微信web开发者工具\wechatdevtools.exe"),
    Path(r"C:\Program Files\Tencent\微信web开发者工具\wechatdevtools.exe"),
]

REGISTRY_KEYS = [
    r"SOFTWARE\WOW6432Node\Tencent\微信web开发者工具",
    r"SOFTWARE\Tencent\微信web开发者工具",
]


def find_miniprogram_dir() -> Path:
    for entry in ROOT_DIR.iterdir():
        if entry.is_dir() and (entry / "app.json").exists() and (entry / "project.config.json").exists():
            return entry
    raise FileNotFoundError("未找到小程序前端目录。")


MINIPROGRAM_DIR = find_miniprogram_dir()


def find_from_registry(filename: str) -> Path | None:
    if winreg is None:
        return None

    for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        for key_path in REGISTRY_KEYS:
            try:
                with winreg.OpenKey(hive, key_path) as key:
                    install_path, _ = winreg.QueryValueEx(key, "")
            except OSError:
                continue

            install_dir = Path(install_path).parent
            candidate = install_dir / filename
            if candidate.exists():
                return candidate
    return None


def first_existing(candidates: list[Path]) -> Path | None:
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def find_cli() -> Path:
    registry_cli = find_from_registry("cli.bat") or find_from_registry("cli")
    cli_path = registry_cli or first_existing(CLI_CANDIDATES)
    if cli_path:
        return cli_path
    raise FileNotFoundError("未找到微信开发者工具 CLI，请先安装微信开发者工具。")


def find_gui(cli_path: Path) -> Path:
    registry_gui = find_from_registry("微信开发者工具.exe") or find_from_registry("wechatdevtools.exe")
    gui_path = registry_gui or first_existing(GUI_CANDIDATES)
    if gui_path:
        return gui_path

    for filename in ("微信开发者工具.exe", "wechatdevtools.exe"):
        candidate = cli_path.parent / filename
        if candidate.exists():
            return candidate

    raise FileNotFoundError("未找到微信开发者工具主程序，请确认安装完整。")


def close_existing_devtools() -> None:
    command = r"""
$targets = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -in @('微信开发者工具.exe', 'wechatdevtools.exe', 'cli.exe', 'WeChatAppEx.exe') -or
    ($_.CommandLine -like '*微信web开发者工具*')
  }
$targets | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
"""
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", command],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)


def run_command(command: list[str], cwd: Path, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=str(cwd),
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        timeout=timeout,
    )


def start_gui(gui_path: Path) -> None:
    subprocess.Popen([str(gui_path)], cwd=str(gui_path.parent))
    time.sleep(5)


def open_project_with_cli(cli_path: Path) -> tuple[bool, str]:
    commands = [
        [str(cli_path), "--project", str(MINIPROGRAM_DIR)],
        [str(cli_path), "open", "--project", str(MINIPROGRAM_DIR)],
        [str(cli_path), "open", "--project", str(MINIPROGRAM_DIR), "--compile-condition", "{}"],
    ]

    last_output = ""
    for command in commands:
        result = run_command(command, ROOT_DIR)
        last_output = f"{result.stdout}\n{result.stderr}".strip()
        if result.returncode == 0 and "#initialize-error" not in last_output and "timeout" not in last_output.lower():
            return True, last_output
    return False, last_output


def main() -> int:
    try:
        cli_path = find_cli()
        gui_path = find_gui(cli_path)

        close_existing_devtools()
        start_gui(gui_path)
        ok, output = open_project_with_cli(cli_path)

        if ok:
            print("已自动打开微信开发者工具并载入小程序项目。")
            print(f"项目目录：{MINIPROGRAM_DIR}")
            return 0

        print("微信开发者工具已打开，但 CLI 自动载入项目失败。")
        print(f"项目目录：{MINIPROGRAM_DIR}")
        if output:
            print(output)
        return 1
    except Exception as exc:
        print(f"打开失败：{exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
