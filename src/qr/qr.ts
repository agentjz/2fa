import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import * as QRCode from "qrcode";

const reader = new BrowserQRCodeReader();

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 260,
    color: {
      dark: "#111827ff",
      light: "#ffffffff",
    },
  });
}

export async function decodeQrImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(url);
    return result.getText();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function startQrScanner(
  video: HTMLVideoElement,
  onText: (text: string) => void,
  onError: (message: string) => void,
): Promise<IScannerControls> {
  return reader.decodeFromVideoDevice(undefined, video, (result, error, controls) => {
    if (result) {
      onText(result.getText());
      controls.stop();
      return;
    }

    if (error && error.name !== "NotFoundException") {
      onError("扫码失败，请调整二维码位置或改用图片导入。");
    }
  });
}
