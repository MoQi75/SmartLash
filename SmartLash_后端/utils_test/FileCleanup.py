import os
from django.core.files.storage import default_storage
class FileCleanup:
    def __init__(self, file_path):
        self.file_path = file_path

    def __enter__(self):
        # 进入 with 语句块时执行的操作
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        # 退出 with 语句块时执行的操作
        if exc_type is not None:
            if default_storage.exists(self.file_path):
                default_storage.delete(self.file_path)
        return False  # 不抑制异常
