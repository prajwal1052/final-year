from fastapi import FastAPI
from get_img_data import router

app = FastAPI()

app.include_router(router)


@app.get("/")
async def root():
    return {"message": "server on"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
