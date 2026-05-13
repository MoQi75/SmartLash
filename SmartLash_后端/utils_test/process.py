import logging
import os
import uuid

import cv2
import dlib
import numpy as np
import oss2
from PIL import Image
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


logger = logging.getLogger(__name__)


def read_image_unicode(image_path, flags=cv2.IMREAD_COLOR):
    data = np.fromfile(image_path, dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, flags)


def write_image_unicode(image_path, image):
    ext = os.path.splitext(image_path)[1] or '.png'
    ok, encoded = cv2.imencode(ext, image)
    if not ok:
        raise ValueError(f'Failed to encode image for: {image_path}')
    encoded.tofile(image_path)
    return image_path


def save_unique_image(folder_name, image_file, image_data):
    unique_filename = f"{uuid.uuid4()}.{image_file.name.split('.')[-1]}"
    image_path = f"{folder_name}/{unique_filename}"
    path = default_storage.save(image_path, ContentFile(image_data))
    return path


def upload_image_to_aliyun_oss(image_bytes, folder_name):
    try:
        if not getattr(settings, 'ALIYUN_OSS_ENABLED', False):
            logger.info("OSS upload skipped: ALIYUN_OSS_ENABLED is False")
            return False

        access_key_id = settings.ALIYUN_OSS_ACCESS_KEY_ID
        access_key_secret = settings.ALIYUN_OSS_ACCESS_KEY_SECRET
        endpoint = settings.ALIYUN_OSS_ENDPOINT
        bucket_name = settings.ALIYUN_OSS_BUCKET_NAME

        if not all([access_key_id, access_key_secret, endpoint, bucket_name]):
            logger.warning("OSS upload skipped: missing OSS configuration")
            return False

        auth = oss2.Auth(access_key_id, access_key_secret)
        bucket = oss2.Bucket(auth, endpoint, bucket_name)
        filename = f"image_{uuid.uuid4()}.png"
        object_key = f"{folder_name}/{filename}"
        bucket.put_object(object_key, image_bytes, headers={"Content-Type": "image/png"})
        return True
    except Exception as exc:
        # OSS 上传失败时仍允许本地分析继续执行。
        logger.warning("OSS upload skipped: %s", exc)
        return False


def file_cleanup(image_path):
    try:
        yield
    except Exception as e:
        if os.path.exists(image_path):
            default_storage.delete(image_path)
        raise e


def crop_mainB_face(image_path):
    detector = dlib.get_frontal_face_detector()
    predictor_model = "Algorithm/common/shape_predictor_68_face_landmarks.dat"
    predictor = dlib.shape_predictor(predictor_model)
    image_np = read_image_unicode(image_path)
    if image_np is None:
        raise FileNotFoundError(f"无法加载图片: {image_path}")
    img_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

    rects = detector(img_rgb, 0)
    if len(rects) == 0:
        return None

    shape = predictor(img_rgb, rects[0])

    left_eye_x1 = shape.part(36).x
    left_eye_y1 = shape.part(37).y
    left_eye_x2 = shape.part(39).x
    left_eye_y2 = shape.part(41).y

    x = left_eye_x1 - 30
    y = left_eye_y1 - 30
    width = left_eye_x2 - left_eye_x1 + 60
    height = left_eye_y2 - left_eye_y1 + 60

    cropped_face = img_rgb[y : y + height, x : x + width]
    cropped_face_bgr = cv2.cvtColor(cropped_face, cv2.COLOR_RGB2BGR)
    write_image_unicode(image_path, cropped_face_bgr)
    return image_path


# def crop_left_face(image_path):
#     image = Image.open(image_path)
#     crop_size = (300, 250)
#     width, height = image.size
#     new_width, new_height = crop_size
#     vertical_offset = -100
#     horizontal_offset = 200
#     left = (width - new_width) // 2 + horizontal_offset
#     top = (height - new_height) // 2 + vertical_offset
#     right = (width + new_width) // 2 + horizontal_offset
#     bottom = (height + new_height) // 2 + vertical_offset
#     cropped_image = image.crop((left, top, right, bottom))
#     cropped_image.save(image_path)
#     return image_path
