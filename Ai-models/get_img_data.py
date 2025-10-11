from fastapi import APIRouter, File, UploadFile
from fastapi.responses import HTMLResponse
import base64

router = APIRouter()


@router.get("/get-img-data")
async def get_upload_form():
    html_content = """
    <html>
    <body>
    <h1>Upload an Image</h1>
    <form action="/get-img-data" method="post" enctype="multipart/form-data">
      <input type="file" name="file" accept="image/*" required />
      <button type="submit">Upload</button>
    </form>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.post("/get-img-data")
async def get_img_data(file: UploadFile = File(...)):
    contents = await file.read()
    encoded = base64.b64encode(contents).decode("utf-8")
    html_content = f"""
    <html>
    <body>
    <h1>Uploaded Image</h1>
    <img src="data:image/png;base64,{encoded}" alt="Uploaded Image" />
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
