from utils_test.process import crop_mainB_face
# 引入正面闭眼预测睫毛算法
from Algorithm.main_b import predict_main_b_eye
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from utils_test.response import apiResponse
from utils_test.process import save_unique_image
from utils_test.process import upload_image_to_aliyun_oss
import concurrent.futures
from django.core.files.storage import default_storage
import random
import json
import os
from urllib import error, request

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_MODEL = 'deepseek-chat'
DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions'


@csrf_exempt
def hello(request):
    return JsonResponse({'django': 'It is OK'})


def build_chat_messages(question, analysis=None, history=None):
    analysis = analysis or {}
    history = history or []

    profile = analysis.get('profile') or {}
    backend = analysis.get('backend') or {}
    products = analysis.get('products') or []
    product_names = '、'.join([item.get('name', '') for item in products[:3] if item.get('name')]) or '暂无推荐商品'
    has_analysis = bool(profile.get('label')) and profile.get('label') != '暂无'

    system_prompt = (
        "你是 SmartLash 的专业 AI 美睫顾问。"
        "请始终使用中文回答，语气专业、直接、自然。"
        "优先结合用户当前的识别结果、使用场景、妆效目标、护理顾虑和推荐商品来给建议。"
        "回答要实用，尽量分点，避免空话。"
        "输出格式要求简洁：首句直接回答问题，后面最多给 3 到 5 个短点。"
        "不要使用 Markdown 标题、不要使用加粗星号、不要输出多余符号或装饰性分隔线。"
        "如果上下文里已经给出了识别档案、后端判断、场景和顾虑，就视为用户已经完成识别，直接给建议，不要再要求用户去做识别。"
        "只有在上下文明确为空或没有识别结果时，才提醒用户先完成识别。"
        "如果某项信息不足，就直接说明信息不足并给出保守建议，不要编造，不要输出 ???、占位词或模板残句。"
    )

    context_prompt = (
        f"识别状态：{'已完成识别，可直接给建议' if has_analysis else '暂无识别结果，需要先引导用户完成识别'}\n"
        f"当前识别档案：{profile.get('label', '暂无')}\n"
        f"档案特征：{profile.get('tone', '暂无')}\n"
        f"档案描述：{profile.get('description', '暂无')}\n"
        f"后端判断：{backend.get('className', '暂无')}\n"
        f"使用场景：{analysis.get('occasionLabel', '暂无')}\n"
        f"妆效目标：{analysis.get('styleGoalLabel', '暂无')}\n"
        f"当前顾虑：{analysis.get('concernLabel', '暂无')}\n"
        f"护理建议：{profile.get('aiAdvice', '暂无')}\n"
        f"护理提示：{'；'.join(profile.get('careTips', [])) or '暂无'}\n"
        f"推荐商品：{product_names}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": context_prompt},
    ]

    for item in history[-6:]:
        role = item.get('role')
        content = (item.get('content') or '').strip()
        if role in {'user', 'assistant'} and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question.strip()})
    return messages


def call_deepseek_chat(messages):
    if not DEEPSEEK_API_KEY:
        raise RuntimeError('DEEPSEEK_API_KEY is not configured')

    payload = json.dumps({
        "model": DEEPSEEK_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "stream": False,
    }).encode('utf-8')

    req = request.Request(
        url=DEEPSEEK_CHAT_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
        },
        method='POST',
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            raw = response.read().decode('utf-8')
    except error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'DeepSeek HTTP {exc.code}: {detail}') from exc
    except error.URLError as exc:
        raise RuntimeError(f'DeepSeek network error: {exc.reason}') from exc

    data = json.loads(raw)
    choices = data.get('choices') or []
    if not choices:
        raise RuntimeError('DeepSeek returned empty choices')

    message = choices[0].get('message') or {}
    content = (message.get('content') or '').strip()
    if not content:
        raise RuntimeError('DeepSeek returned empty content')

    return {
        'reply': content,
        'usage': data.get('usage') or {},
        'model': data.get('model') or DEEPSEEK_MODEL,
        'raw': data,
    }


# @csrf_exempt
# def getLeft(request):
#     if request.method == 'POST' and request.FILES.get('left'):
#         # 接收上传图片
#         image_file = request.FILES['left']
#         image_data = image_file.read()
#         folder_name = 'test/left'
#         # 上传到阿里云
#         upload_image_to_aliyun_oss(image_data, folder_name)
#         # # 保存图片到本地或内存
#         # image_path=save_unique_image(folder_name,image_file,image_data)
#         # image_path = default_storage.path(image_path)
#         #
#         # with FileCleanup(image_path):
#         #     # 先裁剪侧面人眼
#         #     image_path = crop_left_face(image_path)
#         #     # 进行图片分类预测
#         #     eye_result,predicted_class_name = predict_left_eye(image_path)
#         #     pass
#         # # 删除本地临时文件
#         # default_storage.delete(image_path)
#         eye_result = random.choice([1, 2])
#         if eye_result==1:
#             predicted_class_name="平眼"
#         else:
#             predicted_class_name="凸眼"
#         return apiResponse.success(data=eye_result, message=f'Upload succeeded,predicted class: {predicted_class_name}')
#     return apiResponse.error(data={'error': 'Ineffective parameters'}, message='Operation failed')


def processMain_B(request):
    if request.method == 'POST' and request.FILES.get('main_b'):
        # 接收上传图片
        image_file = request.FILES['main_b']
        image_data = image_file.read()
        folder_name = 'test1/main_b'
        # 上传到阿里云
        upload_image_to_aliyun_oss(image_data, folder_name)
        # 保存图片到本地或内存
        image_path = save_unique_image(folder_name, image_file, image_data)
        image_path = default_storage.path(image_path)
        try:
            # 先调用图像分离算法处理出目标图片
            image_path = crop_mainB_face(image_path)
            if not image_path:
                raise ValueError('未识别到有效眼部区域')
            # 凸眼为2，平眼为1
            eye_result, predicted_class_name = predict_main_b_eye(image_path)
        except Exception as e:
            if image_path and os.path.exists(image_path):
                os.remove(image_path)
            return apiResponse.server_error(
                data={'error': 'main-b-predict-failed'},
                message=f'Main_B predict failed: {e}',
            )

        # 删除本地暂存的临时文件
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        return apiResponse.success(data=eye_result, message=f'Upload succeeded,predicted class: {predicted_class_name}')
    return apiResponse.error(data={'error': 'Ineffective parameters'}, message='Operation failed')


@csrf_exempt
def getMain_B(request):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(processMain_B, request)
        try:
            result = future.result(timeout=20)
            return result
        except concurrent.futures.TimeoutError:
            return apiResponse.request_timeout(data=2, message='Main_B Operation failed')


@csrf_exempt
def chat(request):
    if request.method != 'POST':
        return apiResponse.method_not_allowed(data={'error': 'POST only'}, message='Method not allowed')

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return apiResponse.error(data={'error': 'invalid-json'}, message='Invalid JSON payload')

    question = (payload.get('question') or '').strip()
    if not question:
        return apiResponse.error(data={'error': 'empty-question'}, message='Question is required')

    try:
        messages = build_chat_messages(
            question=question,
            analysis=payload.get('analysis'),
            history=payload.get('history'),
        )
        result = call_deepseek_chat(messages)
    except Exception as exc:
        return apiResponse.server_error(data={'error': 'deepseek-chat-failed'}, message=str(exc))

    return apiResponse.success(
        data={
            'reply': result['reply'],
            'usage': result['usage'],
            'model': result['model'],
        },
        message='Chat succeeded',
    )


@csrf_exempt
def getMain(request):
    if request.method == 'POST' and request.FILES.get('main'):
        # 接收上传图片
        image_file = request.FILES['main']
        image_data = image_file.read()
        folder_name = 'test1/main'
        # 上传到阿里云
        upload_image_to_aliyun_oss(image_data, folder_name)
        # 调用算法处理图像得出结果

        result = 2
        return apiResponse.success(data=result, message=f'Upload succeeded,predicted class: {result}')
    return apiResponse.error(data={'error': 'Ineffective parameters'}, message='Operation failed')
