
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  GEMINI_MODEL, 
  NOTIFICATION_EMAILS, 
  COMPLIANCE_HEADER,
  INTERNAL_ADMIN_DOSSIER,
} from "../constants";
import { Attachment } from "../types";

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiService {
  private audioCtx: AudioContext | null = null;

  async generateSpeech(text: string): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Vocalize this content precisely: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return;

      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, this.audioCtx, 24000, 1);
      
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch (err) {}
  }

  async *streamChat(message: string, history: any[], attachment?: Attachment) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const currentParts: any[] = [{ text: message }];
      if (attachment) {
        currentParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }

      const responseStream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [...history, { role: 'user', parts: currentParts }],
        config: {
          temperature: 0.3,
          systemInstruction: `
            You are the ATD Neural Core - A Unified Intelligence System.
            ${COMPLIANCE_HEADER} 
            
            OPERATIONAL PROTOCOLS:
            1. MULTI-MODAL VISION: You analyze all uploaded images and documents with precision.
            2. HIGH-FIDELITY OUTPUT: When asked to write, type, or format information, use industry-standard professional layouts (CVs, letters, reports, lists) naturally.
            3. SEQUENTIAL ORDER: Always present information from top-to-bottom in a logical, non-scattered sequence.
            4. COMPREHENSIVE RECONSTRUCTION: If a user uploads a file and asks to "type" it or "process" it, perform high-fidelity transcription and formatting.
            
            ${INTERNAL_ADMIN_DOSSIER}
          `
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) yield text;
      }
    } catch (error: any) {
      yield "ATD CORE ERROR: Intelligence link failure.";
    }
  }
}

export const geminiService = new GeminiService();
