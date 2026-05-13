import math
import os
import numpy as np
import joblib
import cv2
from Algorithm.main_b_tiqu import process_image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WORKSPACE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))


def resolve_existing_path(*candidates):
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate
    raise FileNotFoundError(f"未找到所需文件，候选路径：{candidates}")


def read_image_unicode(image_path, flags=cv2.IMREAD_COLOR):
    data = np.fromfile(image_path, dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, flags)

# 正面闭眼睫毛图片
# def predict_main_b_eyelashes(image_path):
#     # 调用提取函数先分离出睫毛图片
#     pred_path = process_image(image_path)
#     image = cv2.imread(pred_path)
#     if image is None:
#         return "无法加载图像"
#     # 将图像转换为灰度图像
#     gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#     # 对灰度图像进行二值化处理
#     ret, binary_image = cv2.threshold(gray_image, 128, 255, cv2.THRESH_BINARY)
#     # 定义分割区域的数量和每个区域的宽度
#     num_areas = 10
#     height, width = binary_image.shape
#     area_width = width // num_areas
#     # 初始化最大距离和最大区域索引
#     max_distance = 0
#     max_area_index = -1
#     # 遍历每个区域
#     for i in range(num_areas):
#         # 计算每个区域的起始和结束坐标
#         start_x = i * area_width
#         end_x = start_x + area_width if i < num_areas - 1 else width
#
#         # 初始化最高点和最低点的坐标
#         highest_y = -1
#         lowest_y = height
#
#         highest_point = None
#         lowest_point = None
#
#         # 遍历每个区域的像素点
#         for y in range(height):
#             for x in range(start_x, end_x):
#                 # 如果像素点是白色，更新最高点和最低点的坐标
#                 if binary_image[y, x] == 255:
#                     if x > highest_y:
#                         highest_y = x
#                         highest_point = (x, y)
#                     if x < lowest_y:
#                         lowest_y = x
#                         lowest_point = (x, y)
#
#         # 如果最高点和最低点都被找到，计算它们之间的距离
#         if highest_point and lowest_point:
#             distance = abs(highest_point[1] - lowest_point[1])
#             # 更新最大距离和最大区域索引
#             if distance > max_distance:
#                 max_distance = distance
#                 max_area_index = i
#     # 打印睫毛长度
#     # print(f"睫毛长度: {max_distance:.2f}")
#     # 删除本地暂存的临时文件
#     default_storage.delete(pred_path)
#     # 这里是随便一个界定值，如果大于20,认定为长睫毛，小于认定为短睫毛
#     if max_distance > 20:
#         return (2, "长睫毛")
#     else:
#         return (1, "短睫毛")

def predict_main_b_eye(image_path):
    pred_path = None
    try:
        pred_path = process_image(image_path)
        # 读取处理后的图片
        image = read_image_unicode(pred_path)
        if image is None:
            raise FileNotFoundError(f"无法加载处理后的图片: {pred_path}")
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        ret, binary_image = cv2.threshold(gray_image, 50, 255, cv2.THRESH_BINARY)

        kernel1 = np.ones((3, 3), np.uint8)
        kernel2 = np.ones((5, 5), np.uint8)

        dilated_image = cv2.dilate(binary_image, kernel1, iterations=1)
        erosion_image = cv2.erode(dilated_image, kernel2, iterations=1)

        num_areas = 40  # up areas
        height, width = erosion_image.shape
        area_width = width // num_areas

        max_points_per_areas = []
        max_eyelash_long = 0

        for i in range(num_areas):
            start_x = i * area_width
            end_x = start_x + area_width if i < num_areas - 1 else width

            white_pixels_y = np.where(erosion_image[:, start_x:end_x] > 0)[0]  # find white points

            if len(white_pixels_y) > 0:
                # left up is 0
                top_y = white_pixels_y.min()  # toppest
                bottom_y = white_pixels_y.max()  # bottomest
                eyelash_long = abs(top_y - bottom_y) / height

                center_x = (start_x + end_x) // 2
                max_points_per_areas.append((center_x, top_y))

                if max_eyelash_long < eyelash_long:
                    max_eyelash_long = eyelash_long

        key_points_sub = []
        key_point_num = len(max_points_per_areas)
        points_per_subarray = key_point_num // 5
        remaining_points = key_point_num % 5

        # 1------5
        for i in range(5):
            start_index = i * points_per_subarray + (i if remaining_points > 0 else 0)
            end_index = start_index + points_per_subarray + (1 if i == 5 - 1 and remaining_points else 0)
            key_points_sub.append(max_points_per_areas[start_index:end_index])

        key_point1 = min(key_points_sub[0], key=lambda point: point[1])  # left point
        key_point2 = max(key_points_sub[1], key=lambda point: point[1])  # left medium point
        key_point3 = max(key_points_sub[2], key=lambda point: point[1])  # medium point
        key_point4 = max(key_points_sub[3], key=lambda point: point[1])  # right medium point
        key_point5 = min(key_points_sub[4], key=lambda point: point[1])  # right point

        angle = calculate_angle(key_point4, key_point3, key_point5)
        max_curvature = calculate_max_curvature(key_points_sub[2], key_points_sub[3], key_points_sub[4],
                                                key_point3, key_point4, key_point5)
        cv2.circle(image, (key_point3[0], key_point3[1]), 5, (0, 255, 0), -1)  # green
        cv2.circle(image, (key_point4[0], key_point4[1]), 5, (0, 255, 0), -1)
        cv2.circle(image, (key_point5[0], key_point5[1]), 5, (0, 255, 0), -1)

        classifier_path = resolve_existing_path(
            os.path.join(BASE_DIR, 'common', 'best_model.joblib'),
            os.path.join(WORKSPACE_DIR, '算法代码和模型', 'checkpoints', 'svm', 'best_model.joblib'),
        )
        loaded_classifier = joblib.load(classifier_path)
        pred_data = np.array([[angle, max_curvature]]).reshape(1, -1)
        predictions = loaded_classifier.predict(pred_data)
        # 这样清除不会影响其他人
        if pred_path and os.path.exists(pred_path):
            os.remove(pred_path)
        if predictions == 1:  # 凸眼
            return (2, "凸眼")
        else:  # 平眼
            return (1, "平眼")
    except Exception as e:
        if pred_path and os.path.exists(pred_path):
            os.remove(pred_path)
        raise e

def calculate_angle(point1, point2, point3):  # calculate 21 31 angle
    l1 = (point2[0] - point1[0], point2[1] - point1[1])
    l2 = (point3[0] - point1[0], point3[1] - point1[1])
    dot = l1[0] * l2[0] + l1[1] * l2[1]
    norm_l1 = math.sqrt(l1[0] ** 2 + l1[1] ** 2)
    norm_l2 = math.sqrt(l2[0] ** 2 + l2[1] ** 2)
    cos_theta = dot / (norm_l1 * norm_l2)
    theta_rad = math.acos(cos_theta)
    theta_deg = math.degrees(theta_rad)
    return theta_deg


def calculate_max_curvature(points_1, points_2, points_3, point1, point2, point3):
    points_1 = np.array(points_1)
    points_2 = np.array(points_2)
    points_3 = np.array(points_3)
    point1 = np.array(point1)
    point2 = np.array(point2)
    point3 = np.array(point3)

    bijiao_1 = (points_1[:, 0] >= point1[0])
    points_1_finish = points_1[bijiao_1]
    bijiao_3 = (points_3[:, 0] <= point3[0])
    points_3_finish = points_3[bijiao_3]

    points = np.concatenate((points_1_finish, points_2, points_3_finish))

    x = points[:, 0]
    y = - points[:, 1]  # 负号一定要保留！！！！！！

    params = np.polyfit(x, y, 4)
    poly_eqn = np.poly1d(params)
    y_curve = poly_eqn(x)

    coefs_deriv1 = np.polyder(params, 1)
    coefs_deriv2 = np.polyder(params, 2)
    poly_eqn_deriv1 = np.poly1d(coefs_deriv1)
    poly_eqn_deriv2 = np.poly1d(coefs_deriv2)
    y_deriv1 = poly_eqn_deriv1(x)
    y_deriv2 = poly_eqn_deriv2(x)
    curvature = np.abs(y_deriv2) / (1 + y_deriv1 ** 2) ** (3 / 2)

    max_curvature = np.max(curvature)  # 最大曲率

    return max_curvature

