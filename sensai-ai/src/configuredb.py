import asyncio
import os
import sys
from os.path import exists, dirname

# Add the src directory to the Python path
current_dir = dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from api.db import create_organizations_table, create_org_api_keys_table, create_users_table
from api.db import create_user_organizations_table, create_milestones_table, create_cohort_tables
from api.db import create_courses_table, create_course_cohorts_table, create_tasks_table
from api.db import create_questions_table, create_scorecards_table, create_question_scorecards_table
from api.db import create_chat_history_table, create_task_completion_table, create_course_tasks_table
from api.db import create_course_milestones_table, create_course_generation_jobs_table
from api.db import create_task_generation_jobs_table, create_code_drafts_table
from api.config import sqlite_db_path
from api.utils.db import get_new_db_connection

async def setup_database():
    print(f"Database path: {sqlite_db_path}")
    
    # Remove existing database if it exists
    if os.path.exists(sqlite_db_path):
        print(f"Removing existing database: {sqlite_db_path}")
        try:
            os.remove(sqlite_db_path)
            print("Existing database removed successfully.")
        except Exception as e:
            print(f"Error removing database: {e}")
            return
    
    print("Initializing database...")
    try:
        # Ensure the database folder exists
        db_folder = os.path.dirname(sqlite_db_path)
        if not os.path.exists(db_folder):
            os.makedirs(db_folder)

        # Set database defaults
        from api.utils.db import set_db_defaults
        set_db_defaults()
        print("Database defaults set.")
        
        # Create all tables directly, bypassing the conditional logic in init_db()
        async with get_new_db_connection() as conn:
            cursor = await conn.cursor()
            
            print("Creating all tables...")
            await create_organizations_table(cursor)
            await create_org_api_keys_table(cursor)
            await create_users_table(cursor)
            await create_user_organizations_table(cursor)
            await create_milestones_table(cursor)
            await create_cohort_tables(cursor)
            await create_courses_table(cursor)
            await create_course_cohorts_table(cursor)
            await create_tasks_table(cursor)
            await create_questions_table(cursor)
            await create_scorecards_table(cursor)
            await create_question_scorecards_table(cursor)
            await create_chat_history_table(cursor)
            await create_task_completion_table(cursor)
            await create_course_tasks_table(cursor)
            await create_course_milestones_table(cursor)
            await create_course_generation_jobs_table(cursor)
            await create_task_generation_jobs_table(cursor)
            await create_code_drafts_table(cursor)
            
            await conn.commit()
            print("All tables created successfully.")
        
        # Verify database tables
        from api.utils.db import execute_db_operation
        
        tables = await execute_db_operation(
            "SELECT name FROM sqlite_master WHERE type='table'",
            fetch_all=True
        )
        
        print("\nVerified tables in database:")
        for table in tables:
            print(f"- {table[0]}")
        
        # Specifically check for the problematic tables
        required_tables = [
            "task_generation_jobs",
            "course_generation_jobs",
            "tasks"
        ]
        
        table_names = [table[0] for table in tables]
        missing_tables = [table for table in required_tables if table not in table_names]
        
        if missing_tables:
            print("\n⚠️ WARNING: The following required tables are missing:")
            for table in missing_tables:
                print(f"- {table}")
            print("\nYour application may not function correctly.")
        else:
            print("\n✅ All required tables have been created successfully!")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(setup_database())