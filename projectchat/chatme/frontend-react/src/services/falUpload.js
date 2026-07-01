export const uploadFileToBackend = async (file, type) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`http://localhost:8000/${type}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data?.url || null;
  } catch (error) {
    console.error(`Failed to upload ${type}:`, error);
    return null;
  }
};
