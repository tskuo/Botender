import OpenAI from 'openai';
import { VITE_OPENAI_API_KEY } from '$env/static/private';

export const openAIClient = new OpenAI({ apiKey: VITE_OPENAI_API_KEY });
