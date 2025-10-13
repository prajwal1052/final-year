from fastapi import APIRouter, File, UploadFile
from fastapi.responses import HTMLResponse
import base64
import os
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


@router.get("/get-img-data")
async def get_upload_form():
    html_content = """
    <html>
    <body>
    <h1>Upload a Receipt Image</h1>
    <form action="/get-img-data" method="post" enctype="multipart/form-data">
      <input type="file" name="file" accept="image/*" required />
      <button type="submit">Upload and Extract</button>
    </form>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.post("/get-img-data")
async def get_img_data(file: UploadFile = File(...)):
    contents = await file.read()

    questions = {
        "merchant": "What is the name of the merchant or store?",
        "total": "What is the total amount?",
        "date": "What is the date on the receipt?",
    }

    try:
        # Open image
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        results = {}
        for key, question in questions.items():
            # Use Gemini to generate answer
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                [f"Extract from this receipt image: {question}", image]
            )
            answer = response.text.strip()
            results[key] = answer

        return {
            "merchant": results["merchant"],
            "total": results["total"],
            "date": results["date"],
        }
    except Exception as e:
        return {"error": str(e)}
