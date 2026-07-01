import os
import shutil
import uuid
import requests
from fastapi import UploadFile,HTTPException
import replicate
from dotenv import load_dotenv
from PIL import Image


load_dotenv()

REMOVE_BG_API_KEY = os.getenv("REMOVEBG_API_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
replicate.Client(api_token=REPLICATE_API_TOKEN)

TEMP_FOLDER = "temps/avatars"
EDITED_FOLDER = "avatars/edited"
os.makedirs(TEMP_FOLDER, exist_ok=True)
os.makedirs(EDITED_FOLDER, exist_ok=True)



def save_output_image(output_file, prefix="edited", extension=".png"):
    os.makedirs(EDITED_FOLDER, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex}{extension}"
    save_path = os.path.join(EDITED_FOLDER, filename)

    if isinstance(output_file, str) and output_file.startswith("http"):
        response = requests.get(output_file)
        with open(save_path, "wb") as f:
            f.write(response.content)
    else:
        with open(save_path, "wb") as f:
            f.write(output_file.read())

    return save_path 

def remove_background(image_path: str) -> str:
    output_path = image_path.replace(".png", "_nobg.png")
    with open(image_path, 'rb') as image_file:
        response = requests.post(
            "https://api.remove.bg/v1.0/removebg",
            files={'image_file': image_file},
            data={'size': 'auto'},
            headers={'X-Api-Key': REMOVE_BG_API_KEY}
        )
    if response.status_code == 200:
        with open(output_path, 'wb') as out:
            out.write(response.content)
        return output_path
    else:
        raise Exception(f"Remove.bg API error: {response.text}")

def colorize_photo(path):
    try:
        print("➡️ Colorizing photo...")

        with open(path, "rb") as image_file:
            output = replicate.run(
                "arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950",
                input={
                    "model_name": "Artistic",
                    "input_image": image_file
                }
            )

        # Save result
        if isinstance(output, list) and len(output) > 0:
            output_path = save_output_image(output[0], "colorized", extension=".jpg")
            return output_path
        else:
            raise ValueError("Colorization failed: No output received.")

    except Exception as e:
        print("Colorize failed:", e)
        raise HTTPException(status_code=500, detail=f"Colorize failed: {e}")

    

def enhance_face_real(image_path: str) -> str:
    output_path = os.path.splitext(image_path)[0] + "_enhanced.png"

    with open(image_path, "rb") as img_file:
        output = replicate.run(
            "tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
            input={
                "img": img_file,
                "scale": 2,
                "version": "v1.4"
            }
        )

    # ✅ Output is a FileOutput object or list of FileOutput
    if isinstance(output, list):
        output_url = output[0].url
    elif hasattr(output, "url"):
        output_url = output.url
    else:
        raise Exception("Unexpected output format from Replicate")

    r = requests.get(output_url)
    if r.status_code != 200:
        raise Exception("Failed to download enhanced image.")

    with open(output_path, "wb") as f:
        f.write(r.content)

    return output_path

    

def remove_object_real(image_path: str, mask_path: str) -> str:
    output_path = image_path.replace(".png", "_object_removed.png")
    with open(image_path, "rb") as img_file, open(mask_path, "rb") as mask_file:
        result = replicate.run(
            "replicate/inpaint:dc9d434b17f14048a3cd5dbd3bc1a2fc73ddee0e29b2dfb6b3c693fb49068c05",
            input={
                "image": img_file,
                "mask": mask_file,
                "prompt": "remove the marked object"
            }
        )
    url = result["output"]
    r = requests.get(url)
    with open(output_path, "wb") as f:
        f.write(r.content)
    return output_path

async def edit_photo_pipeline_advanced(file_path: str, operations: list, mask_path: str = None) -> str:
    current_path = file_path

    try:
        if "remove_bg" in operations:
            print("Removing background...")
            current_path = await remove_background(current_path)

        if "enhance_face" in operations:
            print("Enhancing face...")
            current_path = await enhance_face_real(current_path)

        if "remove_object" in operations:
            print("Removing object using mask:", mask_path)
            if not mask_path:
                raise Exception("Mask file is required for object removal.")
            current_path = await remove_object_real(current_path, mask_path)

        if "colorize" in operations:
            print("Colorizing photo...")
            current_path = await colorize_photo(current_path)

    except Exception as e:
        print("Error during photo editing:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

    final_filename = f"edited_{uuid.uuid4().hex}.png"
    final_path = os.path.join(EDITED_FOLDER, final_filename)
    shutil.copy(current_path, final_path)

    return final_path
