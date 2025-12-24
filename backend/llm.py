import os
import json
import google.generativeai as genai
from openai import OpenAI
from typing import List, Dict, Optional
from pathlib import Path

class LLMService:
    def __init__(self):
        # Load model configurations
        models_path = Path(__file__).parent / "models.json"
        with open(models_path, 'r', encoding='utf-8') as f:
            self.models_config = json.load(f)

        # Initialize Gemini
        self.gemini_api_key = os.getenv("GOOGLE_API_KEY")
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
        else:
            print("⚠️ WARNING: GOOGLE_API_KEY not found. Gemini calls will fail.")

        # Initialize HuggingFace client
        self.hf_token = os.getenv("HF_TOKEN")
        if self.hf_token:
            self.hf_client = OpenAI(
                base_url="https://router.huggingface.co/v1",
                api_key=self.hf_token,
            )
        else:
            print("⚠️ WARNING: HF_TOKEN not found. HuggingFace calls will fail.")
            self.hf_client = None

    def get_model_config(self, model_id: str) -> Optional[Dict]:
        """Get configuration for a specific model"""
        for model in self.models_config.get("models", []):
            if model["id"] == model_id:
                return model
        return None

    async def generate_response(self, history: List[Dict], current_message: str, model_id: str = "gemini-2.5-flash") -> str:
        """Generate response using the specified model"""
        model_config = self.get_model_config(model_id)
        if not model_config:
            return f"Error: Model '{model_id}' not found in configuration."

        provider = model_config.get("provider", "gemini")

        if provider == "gemini":
            return await self._generate_gemini_response(history, current_message, model_id)
        elif provider == "huggingface":
            return await self._generate_huggingface_response(history, current_message, model_config)
        else:
            return f"Error: Unknown provider '{provider}' for model '{model_id}'."

    async def _generate_gemini_response(self, history: List[Dict], current_message: str, model_id: str) -> str:
        """Generate response using Gemini"""
        if not self.gemini_api_key:
            return "Error: GOOGLE_API_KEY is missing."

        # Format history for Gemini
        gemini_history = []
        for node in history:
            if node["role"] == "system":
                continue  # Skip system logs for the LLM context to keep it clean

            role = "user" if node["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [node["content"]]})

        try:
            # Create model instance
            model = genai.GenerativeModel(model_id)

            # Isolate past history and current message
            if gemini_history:
                past_history = gemini_history[:-1]  # All except last
                last_message_content = gemini_history[-1]['parts'][0]

                # Re-init chat with correct past history
                chat = model.start_chat(history=past_history)
                response = await chat.send_message_async(last_message_content)
            else:
                # No history, just send the current message
                response = await model.generate_content_async(current_message)

            return response.text
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"

    async def _generate_huggingface_response(self, history: List[Dict], current_message: str, model_config: Dict) -> str:
        """Generate response using HuggingFace inference endpoint"""
        if not self.hf_client:
            return "Error: HF_TOKEN is missing."

        model_path = model_config.get("model_path", "openai/gpt-oss-120b:groq")

        # Format history for OpenAI-compatible API
        messages = []
        for node in history:
            if node["role"] == "system":
                continue  # Skip system logs

            role = "user" if node["role"] == "user" else "assistant"
            messages.append({"role": role, "content": node["content"]})

        # Add current message
        messages.append({"role": "user", "content": current_message})

        try:
            import asyncio
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda: self.hf_client.chat.completions.create(
                    model=model_path,
                    messages=messages,
                )
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Error calling HuggingFace: {str(e)}"
