import { dalle } from "../utils/openAI"; 

export const dalleGenerateImage = async (image, prompt) => {
  try {
    if (image) {
    
      console.log("Editing the uploaded image with prompt:", prompt);
      const imageBlob = await fetch(image).then(res => res.blob()); // Convert URL to Blob
      const formData = new FormData();
      formData.append("image", imageBlob);

      const response = await dalle.image_edit({
        image: formData.get("image"),
        prompt: prompt,
        size: "1024x1024",
      });

      if (response?.data?.length > 0) {
        return response.data[0].url; 
      } else {
        throw new Error("No image returned from DALLE.");
      }
    } else {
      
      console.log("Generating a new image from text:", prompt);
      const response = await dalle.text2im({
        prompt: prompt,
        size: "1024x1024",
      });

      if (response?.data?.length > 0) {
        return response.data[0].url; 
      } else {
        throw new Error("No image returned from DALLE.");
      }
    }
  } catch (error) {
    console.error("Error generating image with DALLE:", error);
    alert("Failed to generate or edit the image. Please try again.");
    throw error;
  }
};
