import os
import google.generativeai as genai
from typing import List, Dict

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("⚠️ WARNING: GOOGLE_API_KEY not found. LLM calls will fail.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def generate_response(self, history: List[Dict], current_message: str) -> str:
        if not self.api_key:
            return "Error: GOOGLE_API_KEY is missing."

        # Format history for Gemini
        gemini_history = []
        for node in history:
            if node["role"] == "system":
                continue # Skip system logs for the LLM context to keep it clean?
                # Actually, maybe detailed logs help? But "Invoking model..." is noise.
                # Let's skip system nodes for now.

            role = "user" if node["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [node["content"]]})
            
        chat = self.model.start_chat(history=gemini_history)
        
        try:
            # Send the new message
            # Note: start_chat history doesn't include the *current* message we just received?
            # Actually, `start_chat` initializes the context. Then `send_message` sends the NEW user prompt.
            # In our architecture, the `current_message` is already in the `history` passed to this function?
            # Let's check call site.
            
            # If `history` INCLUDES the current user node, we should pop it or not send it in history.
            # The `start_chat` expects PAST history.
            
            # Let's assume `history` is *ancestors including the current user node* (based on linear context logic).
            # The current user node is the last item.
            
            # Isolate past history and current message
            past_history = gemini_history[:-1] # All except last
            last_message_content = gemini_history[-1]['parts'][0] 
            
            # Re-init chat with correct past history
            chat = self.model.start_chat(history=past_history)
            
            response = await chat.send_message_async(last_message_content)
            return response.text
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"
