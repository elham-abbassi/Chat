import { fal } from "@fal-ai/client";
import msgpack from "@msgpack/msgpack";
const Decoder = msgpack.Decoder;


fal.config({
  credentials: "omit", 
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_FAL_KEY}`,
  },
});

export const useGenerateTalkingVideo = () => {
  const generateTalkingVideo = async (imageBase64, audioUrl) => {
    try {
      
      const rayResult = await fal.subscribe("fal-ai/luma-dream-machine/ray-2-flash", {
        input: {
          image_url: imageBase64,
          motion: "natural",
          duration: 4,
        },
      });

      const videoUrl = rayResult?.data?.video_url;
      if (!videoUrl) throw new Error("No video from Ray2Flash");

    
      const museResult = await fal.subscribe("fal-ai/musetalk/musetalk-lip-sync", {
        input: {
          video_url: videoUrl,
          audio_url: audioUrl,
        },
      });

      return { videoUrl: museResult?.data?.video_url };
    } catch (error) {
      console.error("Fal generation error:", error);
      return { error: error.message };
    }
  };

  return { generateTalkingVideo };
};
