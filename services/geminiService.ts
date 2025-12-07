import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ListeningType, TOEFLContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTOEFLMaterial = async (
  type: ListeningType,
  topic: string
): Promise<TOEFLContent> => {
  const isLecture = type === ListeningType.LECTURE;
  const wordCount = isLecture ? "500-700" : "300-450";
  const questionCount = isLecture ? 6 : 5;
  
  const prompt = `
    Create a TOEFL listening practice material.
    Type: ${type}
    Topic: ${topic}
    Approximate Word Count: ${wordCount} words.
    
    Structure the response strictly as a JSON object with the following fields:
    - title: A suitable title.
    - script: The full transcript of the conversation or lecture. It must be academic and realistic for TOEFL.
    - questions: An array of ${questionCount} multiple choice questions.
      - id: number
      - text: string (The question stem)
      - options: array of objects {id: "A"|"B"|"C"|"D", text: string}
      - correctOptionId: string ("A", "B", "C", or "D")
      - explanation: string (Why the answer is correct)
    - durationEstimate: string (e.g., "4:30")
    
    Ensure the content is challenging, uses academic vocabulary, and follows standard TOEFL logic (Main idea, Detail, Inference, Attitude).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          durationEstimate: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                text: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                  },
                },
                correctOptionId: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate content");
  }

  return JSON.parse(response.text) as TOEFLContent;
};

export const generateAudio = async (text: string, type: ListeningType) => {
  // Select voice based on type to add variety
  const voiceName = type === ListeningType.CONVERSATION ? "Puck" : "Kore";
  
  // Truncate text if absolutely necessary to fit single turn limits, 
  // but for TOEFL practice we want full text. 
  // Gemini TTS 2.5 Flash Preview has good limits.
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data returned");
  }

  return base64Audio;
};