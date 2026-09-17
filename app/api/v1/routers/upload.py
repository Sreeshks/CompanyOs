import httpx
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/upload", tags=["Upload"])

IMGBB_API_KEY = "ed90a95046960d09404b4ef5b31d3035"
IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload"


class ImgBBUploadResult(BaseModel):
    display_url: str
    thumb_url: str
    url: str
    delete_url: str
    original_name: str
    size: int
    width: int
    height: int
    mime: str


@router.post(
    "/image",
    response_model=ApiResponse[ImgBBUploadResult],
    summary="Upload a single image to ImgBB"
)
async def upload_image(
    file: UploadFile = File(...),
    name: str = Form(default=None)
):
    """Upload a single image to ImgBB cloud. Returns the image URLs for display and thumbnail."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    contents = await file.read()
    if len(contents) > 32 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 32MB.")

    import base64
    image_b64 = base64.b64encode(contents).decode("utf-8")

    upload_name = name or file.filename or "upload"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            IMGBB_UPLOAD_URL,
            data={
                "key": IMGBB_API_KEY,
                "image": image_b64,
                "name": upload_name,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ImgBB upload failed: {resp.text}"
        )

    body = resp.json()
    if not body.get("success"):
        raise HTTPException(
            status_code=502,
            detail=f"ImgBB upload error: {body.get('error', {}).get('message', 'Unknown error')}"
        )

    data = body["data"]
    result = ImgBBUploadResult(
        display_url=data.get("display_url", ""),
        thumb_url=data.get("thumb", {}).get("url", data.get("display_url", "")),
        url=data.get("url", ""),
        delete_url=data.get("delete_url", ""),
        original_name=file.filename or upload_name,
        size=data.get("size", len(contents)),
        width=data.get("width", 0),
        height=data.get("height", 0),
        mime=data.get("mime", file.content_type or "image/jpeg"),
    )

    return ApiResponse(success=True, data=result, message="Image uploaded successfully")


class ImgBBBatchUploadResult(BaseModel):
    results: List[ImgBBUploadResult]
    failed: List[str]


@router.post(
    "/images",
    response_model=ApiResponse[ImgBBBatchUploadResult],
    summary="Upload multiple images to ImgBB"
)
async def upload_images(
    files: List[UploadFile] = File(...),
    prefix: str = Form(default=""),
    start_index: int = Form(default=1)
):
    """Upload multiple images to ImgBB. Optionally rename them with a prefix and sequential index."""
    import base64

    results: List[ImgBBUploadResult] = []
    failed: List[str] = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        for idx, file in enumerate(files):
            if not file.content_type or not file.content_type.startswith("image/"):
                failed.append(f"{file.filename}: Not an image file")
                continue

            contents = await file.read()
            if len(contents) > 32 * 1024 * 1024:
                failed.append(f"{file.filename}: File too large (>32MB)")
                continue

            image_b64 = base64.b64encode(contents).decode("utf-8")

            if prefix:
                seq_num = start_index + idx
                upload_name = f"{prefix}_{seq_num:03d}"
            else:
                upload_name = file.filename or f"image_{start_index + idx}"

            try:
                resp = await client.post(
                    IMGBB_UPLOAD_URL,
                    data={
                        "key": IMGBB_API_KEY,
                        "image": image_b64,
                        "name": upload_name,
                    },
                )

                if resp.status_code != 200:
                    failed.append(f"{file.filename}: ImgBB HTTP {resp.status_code}")
                    continue

                body = resp.json()
                if not body.get("success"):
                    failed.append(f"{file.filename}: {body.get('error', {}).get('message', 'Unknown error')}")
                    continue

                data = body["data"]
                results.append(ImgBBUploadResult(
                    display_url=data.get("display_url", ""),
                    thumb_url=data.get("thumb", {}).get("url", data.get("display_url", "")),
                    url=data.get("url", ""),
                    delete_url=data.get("delete_url", ""),
                    original_name=upload_name,
                    size=data.get("size", len(contents)),
                    width=data.get("width", 0),
                    height=data.get("height", 0),
                    mime=data.get("mime", file.content_type or "image/jpeg"),
                ))
            except Exception as e:
                failed.append(f"{file.filename}: {str(e)}")

    batch_result = ImgBBBatchUploadResult(results=results, failed=failed)
    return ApiResponse(
        success=True,
        data=batch_result,
        message=f"{len(results)} image(s) uploaded, {len(failed)} failed"
    )
