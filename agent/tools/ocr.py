import os
import pathlib
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

DIR = pathlib.Path(__file__).parent.parent / "upload"
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class OCR:
    def __init__(self):
        self.file = None
        self.config = {
            "lang": "eng",
            "config": "--psm 6 --oem 3" 
        }

    def uploader(self, filename: str) -> None:
        """Resolves the upload file path defensively."""
        self.file = (DIR / filename).resolve()

    def _preprocess_image(self, img: Image.Image) -> Image.Image:
        img = img.convert("L")
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        img = img.filter(ImageFilter.SHARPEN)
        return img

    def image_to_txt(self) -> str:
        if not self.file or not self.file.exists():
            return f"Error: Target file does not exist at {self.file}"

        try:
            with Image.open(self.file) as img:
                cleaned_img = self._preprocess_image(img)
                extracted_txt = pytesseract.image_to_string(
                    cleaned_img, 
                    lang=self.config["lang"], 
                    config=self.config["config"]
                )
                return extracted_txt.strip()
        except Exception as e:
            return f"OCR Processing Error: {str(e)}"

    def get_confidence_data(self) -> list:
        if not self.file or not self.file.exists():
            return []
            
        try:
            with Image.open(self.file) as img:
                cleaned_img = self._preprocess_image(img)
                data = pytesseract.image_to_data(cleaned_img, output_type=pytesseract.Output.DICT)
                results = []
                for i in range(len(data['text'])):
                    if data['text'][i].strip():
                        results.append({
                            "word": data['text'][i],
                            "confidence": data['conf'][i],  # Numeric value from 0 to 100
                            "bbox": (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
                        })
                return results
        except Exception:
            return []

ocr = OCR()
ocr.uploader("pres.jpg")
print(ocr.image_to_txt())