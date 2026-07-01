from PyPDF2 import PdfReader
from bs4 import BeautifulSoup
import requests
from io import BytesIO

async def read_document(file):
    filename = file.filename.lower()
    content = await file.read()

    if filename.endswith(".pdf"):

        reader = PdfReader(BytesIO(content))
        full_text = "".join([
            page.extract_text() for page in reader.pages if page.extract_text()
            ])
    elif filename.endswith(".txt"):
        full_text = content.decode("utf-8")
    else:
        raise ValueError("Unsupported file type. Please upload a PDF or TXT file.")

    return split_into_chunks(full_text)


def scrape_website(url):
    try:
        print(f"Attempting to fetch: {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        raw_text = soup.get_text(separator="\n")
  
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        long_lines = [line for line in lines if len(line) > 50]
        text_chunks = [
            {
                "text": line,
                "metadata": {
                    "source": url
                 }
            }
            for line in long_lines
            ]   

        print(f"[scrape_website] Extracted {len(text_chunks)} text chunks.")
        return text_chunks

    except requests.exceptions.RequestException as e:
        print(f"[scrape_website] Failed to load website: {e}")
        raise Exception(f"Failed to load website: {e}")

def split_into_chunks(text, max_chars=3000):
    chunks = []
  
    for i in range(0, len(text), max_chars):
        chunk = text[i:i + max_chars]
        chunks.append(chunk.strip())
    return chunks
