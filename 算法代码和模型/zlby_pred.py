import subprocess
import cv2
import os
import math
import numpy as np
import matplotlib.pyplot as plt
import shutil
import joblib

args = [
    'python', 'eyelash_test.py',
    '--config', 'config/EyelashNet.toml',
    '--checkpoint', 'checkpoints/EyelashNet/best_model.pth',
    '--image-dir', './changshi',
    '--trimap-dir', 'path/to/your/input/trimaps',
    '--output', './shuchu'
]
subprocess.run(args, check=True)


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


def clear_directory(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)


image_folder = './shuchu/EyelashNet_best_model.pth'

for image_name in os.listdir(image_folder):
    if image_name.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):

        image_path = os.path.join(image_folder, image_name)
        image = cv2.imread(image_path)
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

        loaded_classifier = joblib.load('checkpoints/svm/best_model.joblib')
        pred_data = np.array([[angle, max_curvature]]).reshape(1, -1)
        predictions = loaded_classifier.predict(pred_data)

        if predictions == 1:
            print("tu")
        else:
            print("ping")


clear_directory('shuchu/EyelashNet_best_model.pth')
clear_directory('changshi')
