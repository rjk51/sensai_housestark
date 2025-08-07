from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import openai

client = openai.OpenAI(
    api_key="sk-95MakDWNKO1SvmxreLawSA",  # Replace with your actual API key
    base_url="https://agent.dev.hyperverge.org"  # Using the provided base URL
)

router = APIRouter()

class ClassifyRequest(BaseModel):
    text: str
    
@router.post("/classify_text")
async def classify(request: ClassifyRequest):
    try:
        # Call OpenAI API to classify the text
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",  # or your preferred model
            messages=[
                {"role": "system", "content": "You are a technical content classifier. Classify the given text into exactly one of these categories: 'frontend', 'backend', 'ML', 'GenAI', 'Embedded system'. Return only the category name."},
                {"role": "user", "content": request.text}
            ],
            temperature=0.3,
            max_tokens=10
        )
        
        # Extract the classification result
        category = response.choices[0].message.content.strip().lower()
        
        # Validate that the response is one of our expected categories
        valid_categories = ["frontend", "backend", "ml", "genai", "embedded system"]
        if category not in valid_categories:
            # If the model returned something unexpected, default to most likely category
            most_likely = "frontend"  # You could improve this with more logic
            return {"category": most_likely, "confidence": "low"}
        
        return {"category": category, "confidence": "high"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")