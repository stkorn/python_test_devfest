Start FastAPI server:
source venv/bin/activate && uvicorn backend.bookingapi:app --reload --port 8000

Open http://localhost:8000 in browser

1. Open a Terminal (or Command Prompt)
Navigate to the root directory of this project where this file is located:

cd path/to/submit_python_test

2. Create the Virtual Environment
Create a new virtual environment named venv. (Note: You need to have Python 3 installed on your device)

# On Mac/Linux:
python3 -m venv venv
# On Windows:
python -m venv venv
3. Activate the Virtual Environment
You must activate the virtual environment every time you work on the project or run the server.

# On Mac/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
(You will know it is activated when you see (venv) appear at the beginning of your terminal prompt line).

4. Install Dependencies
With the virtual environment activated, install the required packages (like FastAPI and Uvicorn):

pip install -r requirements.txt
5. Run the Server
Start the FastAPI server:

uvicorn backend.bookingapi:app --reload --port 8000