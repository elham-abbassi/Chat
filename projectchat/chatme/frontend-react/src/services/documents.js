const BASE_URL = "http://localhost:8000";
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BASE_URL}/upload-document/`, {
      method: 'POST',
      body: formData,
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", errorText);
      throw new Error("Failed to upload document");
    }

    const result = await response.json();
    console.log("Upload result:", result);
    return result;
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};


export const scrapeWebsite = async (url) => {
  try {
    const response = await fetch(`${BASE_URL}/scrape-website/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unknown error");
    }

    console.log("Scrape successful:", data);
    alert("Website scraped and embedded!");
    return data;

  } catch (err) {
    console.error("Scrape error:", err.message);
    alert("Scrape failed: " + err.message);
  }
};

