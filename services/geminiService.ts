
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResponse } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFridgeImage = async (base64Image: string): Promise<AnalysisResponse> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `أنت شيف بغدادي خبير جداً. حلل هذه الصورة لمكونات المطبخ واقترح 3 وصفات عراقية أصيلة. 
          تحدث باللهجة العراقية البغدادية المحببة. 
          يجب أن يكون الرد بتنسيق JSON حصراً بنفس الهيكلية المحددة.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedIngredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "المواد اللي شفتها بالصورة"
          },
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "اسم الطبخة" },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "المكونات" },
                instructions: { type: Type.STRING, description: "طريقة التحضير بالبغدادي" },
                tips: { type: Type.STRING, description: "نصيحة الشيف" }
              },
              required: ["title", "ingredients", "instructions", "tips"]
            }
          }
        },
        required: ["identifiedIngredients", "recipes"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AnalysisResponse;
};

export const chatWithChef = async (message: string, history: any[]) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "أنت 'شيف بغداد'، مساعد مطبخ عراقي ذكي. كلامك بغدادي أصيل (عيني، أغاتي، تدلل، شكو ماكو، هله بيك). تنصح الناس بأفضل طرق طبخ التمن، المرگ، والكباب وغيرها من أكلاتنا الطيبة.",
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `اقرأ هذا النص بلهجة عراقية هادئة وودودة: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
