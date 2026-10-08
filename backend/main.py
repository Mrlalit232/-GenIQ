from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

from services.ollama_service import generate_response


app = FastAPI(
    title="GenIQ API",
    description="Sovereign On-Premise Agentic AI Workbench",
    version="0.1.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
 allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://geniq-frontend.onrender.com"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request model
class ChatRequest(BaseModel):
    message: str


# Root
@app.get("/")
def root():
    return {
        "project": "GenIQ",
        "status": "running",
        "message": "Sovereign AI Workbench API is online"
    }


# Health check
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai": "Ollama",
        "model": "llama3.2:3b"
    }


# Normal AI Chat
@app.post("/chat")
def chat(request: ChatRequest):

    answer = generate_response(request.message)

    return {
        "response": answer
    }


# Upload PDF
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Only PDF files are supported."
        }

    contents = await file.read()

    with open("uploaded_document.pdf", "wb") as f:
        f.write(contents)

    reader = PdfReader("uploaded_document.pdf")

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return {
        "success": True,
        "filename": file.filename,
        "pages": len(reader.pages),
        "text_preview": text[:3000]
    }


# Analyze uploaded document
@app.post("/analyze-document")
def analyze_document():

    try:
        reader = PdfReader("uploaded_document.pdf")

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        if not text.strip():
            return {
                "success": False,
                "message": "No readable text found in the PDF."
            }

        prompt = f"""
You are GenIQ, a secure local AI document analysis assistant.

Analyze the following document and provide:

1. Document Summary
2. Key Information
3. Important Skills / Topics
4. Important Findings
5. Suggested Next Actions

Keep the answer clear and structured.

DOCUMENT:
{text[:12000]}
"""

        analysis = generate_response(prompt)

        return {
            "success": True,
            "analysis": analysis
        }

    except FileNotFoundError:
        return {
            "success": False,
            "message": "Please upload a PDF document first."
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


# Ask questions about uploaded document
@app.post("/ask-document")
def ask_document(request: ChatRequest):

    try:
        reader = PdfReader("uploaded_document.pdf")

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        if not text.strip():
            return {
                "success": False,
                "message": "No readable text found in uploaded document."
            }

        prompt = f"""
You are GenIQ, a local document question-answering assistant.

You MUST answer the user's question using the DOCUMENT CONTENT below.

Rules:
- Read the document carefully.
- Give a direct answer based only on the document.
- If the information exists in the document, do not say it is unavailable.
- If multiple relevant items exist, list them clearly.
- Do not invent information.
- Keep the answer concise.

USER QUESTION:
{request.message}

DOCUMENT CONTENT:
{text[:12000]}

Now answer the user's question:
"""

        answer = generate_response(prompt)

        return {
            "success": True,
            "question": request.message,
            "answer": answer
        }

    except FileNotFoundError:
        return {
            "success": False,
            "message": "Please upload a PDF document first."
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }
@app.post("/generate-report")
def generate_report():
    try:
        reader = PdfReader("uploaded_document.pdf")

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        if not text.strip():
            return {
                "success": False,
                "message": "No readable text found in uploaded document."
            }

        prompt = f"""
You are GenIQ Report Generator.

Create a professional structured report based ONLY on the document below.

Use this structure:

# Executive Summary

# Key Information

# Skills / Technical Areas

# Important Findings

# Recommendations

# Conclusion

Do not invent information that is not present in the document.
Keep the report clear and professional.

DOCUMENT:
{text[:12000]}
"""

        report = generate_response(prompt)

        return {
            "success": True,
            "report": report
        }

    except FileNotFoundError:
        return {
            "success": False,
            "message": "Please upload a PDF document first."
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }