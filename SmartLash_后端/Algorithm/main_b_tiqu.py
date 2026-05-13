import os
import cv2
import toml
import numpy as np
import torch
from torch.nn import functional as F
from Algorithm import utils
from Algorithm.utils.config import load_config
from Algorithm.utils import CONFIG
from Algorithm import networks

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


def write_image_unicode(image_path, image):
    ext = os.path.splitext(image_path)[1] or '.png'
    ok, encoded = cv2.imencode(ext, image)
    if not ok:
        raise ValueError(f"无法编码图片: {image_path}")
    encoded.tofile(image_path)
    return image_path


class GammaTransform(object):
    def __init__(self, low=0.4, up=0.6):
        self.low = low
        self.up = up

    def __call__(self, sample, gamma=None):
        fg = sample['image']

        if gamma is None:
            gamma = self.low + np.random.rand() * (self.up - self.low)

        hsv = cv2.cvtColor(fg, cv2.COLOR_BGR2HSV)
        illum = hsv[..., 2] / 255.
        illum = np.power(illum, gamma)
        v = illum * 255.
        v[v > 255] = 255
        v[v < 0] = 0
        hsv[..., 2] = v.astype(np.uint8)
        sample['image'] = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        return sample

    def get_illum_mean_and_std(img):
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        illum = hsv[..., 2] / 255.
        return np.mean(illum), np.std(illum)


def single_inference(model, image_dict, return_offset=False):
    with torch.no_grad():
        image, trimap = image_dict['image'], image_dict['trimap']
        alpha_shape = image_dict['alpha_shape']

        alpha_pred, info_dict = model(image, trimap)

        if CONFIG.model.trimap_channel == 3:
            trimap_argmax = trimap.argmax(dim=1, keepdim=True)

        alpha_pred[trimap_argmax == 2] = 1
        alpha_pred[trimap_argmax == 0] = 0

        h, w = alpha_shape
        test_pred = alpha_pred[0, 0, ...].data.cpu().numpy() * 255
        test_pred = test_pred.astype(np.uint8)
        test_pred = test_pred[32:h + 32, 32:w + 32]

        if return_offset:
            short_side = h if h < w else w
            ratio = 512 / short_side
            offset_1 = utils.flow_to_image(info_dict['offset_1'][0][0, ...].data.cpu().numpy()).astype(np.uint8)
            scale = info_dict['offset_1'][1].cpu()
            offset_1 = cv2.resize(offset_1, (int(w * ratio), int(h * ratio)), interpolation=cv2.INTER_NEAREST)
            text = 'unknown: {:.2f}, known: {:.2f}'.format(scale[-1, 0].item(), scale[-1, 1].item())
            offset_1 = cv2.putText(offset_1, text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, thickness=2)

            offset_2 = utils.flow_to_image(info_dict['offset_2'][0][0, ...].data.cpu().numpy()).astype(np.uint8)
            scale = info_dict['offset_2'][1].cpu()
            offset_2 = cv2.resize(offset_2, (int(w * ratio), int(h * ratio)), interpolation=cv2.INTER_NEAREST)
            text = 'unknown: {:.2f}, known: {:.2f}'.format(scale[-1, 0].item(), scale[-1, 1].item())
            offset_2 = cv2.putText(offset_2, text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 0, thickness=2)

            return test_pred, (offset_1, offset_2)
        else:
            return test_pred, None


def generator_tensor_dict(image_path, trimap_path, augment_data=False):
    image = read_image_unicode(image_path)
    if image is None:
        raise FileNotFoundError(f"无法加载图像: {image_path}")

    if os.path.exists(trimap_path):
        trimap = read_image_unicode(trimap_path, cv2.IMREAD_GRAYSCALE)
    else:
        trimap = np.full_like(image[:, :, 0], 128)
    sample = {'image': image, 'trimap': trimap, 'alpha_shape': trimap.shape}

    if augment_data:
        sample = GammaTransform()(sample)

    h, w = sample["alpha_shape"]

    if h % 32 == 0 and w % 32 == 0:
        padded_image = np.pad(sample['image'], ((32, 32), (32, 32), (0, 0)), mode="reflect")
        padded_trimap = np.pad(sample['trimap'], ((32, 32), (32, 32)), mode="reflect")
        sample['image'] = padded_image
        sample['trimap'] = padded_trimap
    else:
        target_h = 32 * ((h - 1) // 32 + 1)
        target_w = 32 * ((w - 1) // 32 + 1)
        pad_h = target_h - h
        pad_w = target_w - w
        padded_image = np.pad(sample['image'], ((32, pad_h + 32), (32, pad_w + 32), (0, 0)), mode="reflect")
        padded_trimap = np.pad(sample['trimap'], ((32, pad_h + 32), (32, pad_w + 32)), mode="reflect")
        sample['image'] = padded_image
        sample['trimap'] = padded_trimap

    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    image, trimap = sample['image'][:, :, ::-1], sample['trimap']
    image = image.transpose((2, 0, 1)).astype(np.float32)
    trimap[trimap < 85] = 0
    trimap[trimap >= 170] = 2
    trimap[trimap >= 85] = 1
    image /= 255.

    sample['image'], sample['trimap'] = torch.from_numpy(image), torch.from_numpy(trimap).to(torch.long)
    sample['image'] = sample['image'].sub_(mean).div_(std)

    if CONFIG.model.trimap_channel == 3:
        sample['trimap'] = F.one_hot(sample['trimap'], num_classes=3).permute(2, 0, 1).float()
    elif CONFIG.model.trimap_channel == 1:
        sample['trimap'] = sample['trimap'][None, ...].float()
    else:
        raise NotImplementedError("CONFIG.model.trimap_channel can only be 3 or 1")

    sample['image'], sample['trimap'] = sample['image'][None, ...], sample['trimap'][None, ...]

    return sample


def process_image(image_path):
    config_path = resolve_existing_path(
        os.path.join(BASE_DIR, 'common', 'EyelashNet.toml'),
        os.path.join(WORKSPACE_DIR, '算法代码和模型', 'config', 'EyelashNet.toml'),
    )
    checkpoint_path = resolve_existing_path(
        os.path.join(BASE_DIR, 'common', 'best_model.pth'),
        os.path.join(WORKSPACE_DIR, '算法代码和模型', 'checkpoints', 'EyelashNet', 'best_model.pth'),
        os.path.join(WORKSPACE_DIR, '算法代码和模型', 'checkpoints', 'RenderEyelashNet', 'best_model.pth'),
    )
    output_dir = os.path.join(BASE_DIR, 'test', 'temporary')

    with open(config_path, encoding='utf-8') as f:
        load_config(toml.load(f))

    if CONFIG.is_default:
        raise ValueError("No .toml config loaded.")

    checkpoint_name = os.path.basename(checkpoint_path)
    output_dir = os.path.join(output_dir, f'{CONFIG.version}_{checkpoint_name}')
    utils.make_dir(output_dir)

    model = networks.get_generator(encoder=CONFIG.model.arch.encoder, decoder=CONFIG.model.arch.decoder)
    checkpoint = torch.load(checkpoint_path, map_location=torch.device('cpu'))
    model.load_state_dict(utils.remove_prefix_state_dict(checkpoint['state_dict']), strict=True)
    model.to('cpu')
    model.eval()

    image_name = os.path.basename(image_path)
    trimap_path = os.path.join(os.path.dirname(image_path), image_name)
    image_dict = generator_tensor_dict(image_path, trimap_path)
    pred, offset = single_inference(model, image_dict)
    pred_path = os.path.join(output_dir, image_name)
    write_image_unicode(pred_path, pred)
    if offset is not None:
        write_image_unicode(os.path.join(output_dir, os.path.splitext(image_name)[0] + '_offset1.png'), offset[0])
        write_image_unicode(os.path.join(output_dir, os.path.splitext(image_name)[0] + '_offset2.png'), offset[1])
    return pred_path


# def main():
#     image_path = 'changshi/4.png'
#     process_image(image_path)
#
#
# if __name__ == '__main__':
#     main()
