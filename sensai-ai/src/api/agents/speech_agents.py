# speech_agent.py
from langgraph.graph import StateGraph
from langchain.agents import tool
from langchain_core.runnables import RunnableLambda
import httpx
import asyncio
import openai
import json
import re
import os

# Setup OpenAI client directly
client = openai.OpenAI(
    api_key="sk-95MakDWNKO1SvmxreLawSA",  # Replace with your actual API key
    base_url="https://agent.dev.hyperverge.org"  # Using the provided base URL
)

# Define a tool to call the internal /courses/ API
@tool
async def get_courses(org_id: int = 1):
    """
    Fetch courses for a given organization.
    """
    url = f"http://127.0.0.1:8000/courses/?org_id=1"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

# Function to filter courses based on user query using OpenAI
async def find_relevant_courses(query: str, courses: list) -> dict:
    """
    Use OpenAI to find relevant courses based on user query.
    Returns dict with course IDs, their descriptions, and a story that connects them.
    """
    # Format courses for the prompt
    formatted_courses = "\n".join([
        f"ID: {course.get('id')}, Title: {course.get('name')}, Description: {course.get('description', '')}" 
        for course in courses
    ])
    
    # Prompt for OpenAI
    prompt_content = f"""
    You are a course recommendation assistant. Given a user's query and a list of available courses with IDs, titles, and descriptions, 
    select the most relevant courses.

    User query: "{query}"

    Available courses:
    {formatted_courses}

    Respond in strict JSON format ONLY as follows:
    {{
      "relevant_ids": [list of course IDs],
      "titles": {{
        "id1": "Course Title 1",
        "id2": "Course Title 2"
      }},
      "descriptions": {{
        "id1": "brief explanation why this course fits the user’s needs",
        "id2": "..."
      }},
      "story": "A short narrative (2-4 sentences) connecting the selected courses in a logical learning path or journey."
    }}

    If no courses match, return:
    {{
      "relevant_ids": [],
      "descriptions": {{}},
      "story": ""
    }}
    """

    # Call OpenAI
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that returns relevant course IDs, reasons, and a story in strict JSON format only."
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ]
    )

    # Extract content
    content = response.choices[0].message.content
    print("OpenAI Response:", content)

    # Try parsing JSON directly
    try:
        parsed = json.loads(content)
        if (
            isinstance(parsed, dict) 
            and "relevant_ids" in parsed 
            and "descriptions" in parsed 
            and "story" in parsed
        ):
            return parsed
    except json.JSONDecodeError:
        # Fallback: try regex extraction
        json_match = re.search(r'{.*}', content, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return parsed
            except:
                pass

    return {
        "relevant_ids": [],
        "descriptions": {},
        "story": ""
    }


'''
1) central site database
2) site info
3) particular list of course with ids 
4) instructions on how the flow of sites are along with the voice
'''

# Tool registry
tools = [get_courses]

# Main agent logic
async def simple_agent_logic(state: dict) -> dict:
    text = state.get("text", "").lower()
    print(f"[Agent Input] {text}")

    if text:
        # Get all courses
        all_courses = await get_courses.ainvoke({"org_id": 1})
        
        if isinstance(all_courses, dict) and "error" in all_courses:
            return {
                "text": text,
                "result": f"Error fetching courses: {all_courses['error']}"
            }
        
        # Find relevant courses based on user query
        relevant_course_ids = await find_relevant_courses(text, all_courses)
        
        # Filter the full course list to only include relevant courses
        relevant_courses = [course for course in all_courses if course.get('id') in relevant_course_ids]
        
        result = {
            "matching_query": text,
            "relevant_course_ids": relevant_course_ids,
            "relevant_courses": relevant_courses
        }
        
        print(f"[Agent Tool Result] Found {len(relevant_courses)} relevant courses")
        return {
            "text": text,
            "result": result
        }

    return {
        "text": text,
        "result": "No matching action found in the input."
    }

# Build LangGraph flow
graph_builder = StateGraph(dict)
graph_builder.add_node("agent_node", RunnableLambda(simple_agent_logic))
graph_builder.set_entry_point("agent_node")
graph_builder.set_finish_point("agent_node")
graph = graph_builder.compile()
