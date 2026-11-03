import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Safely converts an image URL to Base64 to bypass any potential CORS / canvas security taint
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not convert image to base64, returning original URL:', error);
    return url;
  }
}

/**
 * Downloads a rendered DOM element as a high-resolution PNG image
 */
export async function downloadElementAsPng(
  element: HTMLElement,
  filename: string = 'ID-Card.png',
  pixelRatio: number = 2.5
): Promise<void> {
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio,
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Downloads a rendered DOM element as a high-resolution JPEG image
 */
export async function downloadElementAsJpg(
  element: HTMLElement,
  filename: string = 'ID-Card.jpg',
  pixelRatio: number = 2.5
): Promise<void> {
  const dataUrl = await toJpeg(element, {
    quality: 0.95,
    pixelRatio,
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Generates and downloads a clean, print-ready PDF containing the ID card
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string = 'ID-Card.pdf'
): Promise<void> {
  // Capture as high-res PNG
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2.5,
    cacheBust: true,
  });

  // Standard Portrait card dimensions (100mm x 150mm - exact 2:3 ratio)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 100, 150, undefined, 'FAST');
  pdf.save(filename);
}

