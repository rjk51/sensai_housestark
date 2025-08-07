from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..agents.speech_agents import graph
import logging
router = APIRouter()

class SpeechRequest(BaseModel):
    text: str

@router.post("/text_speech")
async def text_speech(request: SpeechRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    print(f"[Speech Input] {request.text}")

    # Invoke the LangGraph agent
    result = await graph.ainvoke({"text": request.text})
    print(f"[Speech Output] {result}")

    # Here you would implement the logic to convert text to speech
    # For now, we will just return a placeholder response
    return {"message": "Text to speech conversion is not implemented yet", "text": result}