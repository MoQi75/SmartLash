from django.http import JsonResponse

class apiResponse:
    SUCCESS = 200
    CREATED = 201
    UPDATED = 200
    DELETED = 204
    ERROR = 400
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    SERVER_ERROR = 500
    REQUEST_TIMEOUT = 408

    @staticmethod
    def request_timeout(data=None, message='请求超时', status=REQUEST_TIMEOUT):
        return JsonResponse({'status': status, 'message': message, 'data': data})
    @staticmethod
    def success(data=None, message='操作成功', status=SUCCESS):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def created(data=None, message='创建成功', status=CREATED):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def updated(data=None, message='更新成功', status=UPDATED):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def deleted(data=None, message='删除成功', status=DELETED):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def error(data=None, message='操作失败', status=ERROR):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def not_found(data=None, message='未找到资源', status=NOT_FOUND):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def method_not_allowed(data=None, message='方法不允许', status=METHOD_NOT_ALLOWED):
        return JsonResponse({'status': status, 'message': message, 'data': data})

    @staticmethod
    def server_error(data=None, message='服务器错误', status=SERVER_ERROR):
        return JsonResponse({'status': status, 'message': message, 'data': data})
