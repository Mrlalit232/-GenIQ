import { useState, type KeyboardEvent } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Page =
  | "chat"
  | "documents"
  | "knowledge"
  | "agents"
  | "reports"
  | "security";

function App() {
  const [page, setPage] = useState<Page>("chat");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);

  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const [report, setReport] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  const API = "https://geniq-backend.onrender.com";

  // =========================
  // NORMAL AI CHAT
  // =========================
  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Unable to connect to GenIQ backend. Please make sure FastAPI is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPLOAD PDF
  // =========================
  const uploadPDF = async () => {
    if (!file || uploading) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file.");
      return;
    }

    setUploading(true);
    setAnalysis("");
    setReport("");
    setDocumentUploaded(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setDocumentUploaded(true);

      alert(`PDF uploaded successfully: ${data.filename}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload PDF."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // ANALYZE DOCUMENT
  // =========================
  const analyzeDocument = async () => {
    if (!documentUploaded || analyzing) return;

    setAnalyzing(true);
    setAnalysis("");

    try {
      const response = await fetch(`${API}/analyze-document`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Document analysis failed"
        );
      }

      setAnalysis(data.analysis);
    } catch (error) {
      setAnalysis(
        error instanceof Error
          ? error.message
          : "Unable to analyze document."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // =========================
  // ASK DOCUMENT
  // =========================
  const askDocument = async () => {
    if (!message.trim() || loading || !documentUploaded) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/ask-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Document question failed"
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Unable to answer document question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE REPORT
  // =========================
  const generateReport = async () => {
    if (!documentUploaded) {
      alert("Please upload a PDF first.");
      return;
    }

    setGeneratingReport(true);
    setReport("");

    try {
      const response = await fetch(`${API}/generate-report`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Report generation failed"
        );
      }

      setReport(data.report);

      setPage("reports");
    } catch (error) {
      setReport(
        error instanceof Error
          ? error.message
          : "Unable to generate report."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // =========================
  // ENTER KEY
  // =========================
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      if (page === "documents" && documentUploaded) {
        askDocument();
      } else {
        sendMessage();
      }
    }
  };

  // =========================
  // SIDEBAR ITEM
  // =========================
  const navItem = (
    id: Page,
    icon: string,
    title: string,
    subtitle: string
  ) => {
    const active = page === id;

    return (
      <button
        onClick={() => setPage(id)}
        className={`w-full text-left px-4 py-3 rounded-xl transition ${
          active
            ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/10"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>

          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-[10px] text-gray-600">
              {subtitle}
            </p>
          </div>
        </div>
      </button>
    );
  };

  // =========================
  // PAGE TITLE
  // =========================
  const getPageTitle = () => {
    switch (page) {
      case "chat":
        return "AI Chat";
      case "documents":
        return "Documents";
      case "knowledge":
        return "Knowledge Base";
      case "agents":
        return "AI Agents";
      case "reports":
        return "Reports";
      case "security":
        return "Security";
    }
  };

  const getPageSubtitle = () => {
    switch (page) {
      case "chat":
        return "Private local AI conversation";
      case "documents":
        return "Analyze confidential documents locally";
      case "knowledge":
        return "Internal knowledge and retrieval";
      case "agents":
        return "Controlled intelligent workflows";
      case "reports":
        return "AI generated deliverables";
      case "security":
        return "Sovereign deployment and security";
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex">

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside className="w-64 border-r border-white/10 bg-[#0b1020] p-4 hidden md:flex flex-col">

        {/* LOGO */}

        <div className="px-3 pt-2 pb-7">

          <h1 className="text-2xl font-bold">
            Gen<span className="text-cyan-400">IQ</span>
          </h1>

          <p className="text-[11px] text-gray-500 mt-1">
            Sovereign AI Workbench
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="space-y-2">

          {navItem(
            "chat",
            "🤖",
            "AI Chat",
            "Local AI assistant"
          )}

          {navItem(
            "documents",
            "📄",
            "Documents",
            "Analyze files"
          )}

          {navItem(
            "knowledge",
            "🧠",
            "Knowledge Base",
            "Internal knowledge"
          )}

          {navItem(
            "agents",
            "⚙️",
            "Agents",
            "AI workflows"
          )}

          {navItem(
            "reports",
            "📊",
            "Reports",
            "Generated outputs"
          )}

          {navItem(
            "security",
            "🔐",
            "Security",
            "System protection"
          )}

        </nav>

        {/* BOTTOM STATUS */}

        <div className="mt-auto border-t border-white/10 pt-4 px-2">

          <div className="flex items-center gap-2 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            LOCAL MODE
          </div>

          <p className="text-[10px] text-gray-600 mt-2">
            External AI APIs disabled
          </p>

        </div>

      </aside>


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}

        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0b1020]/80">

          <div>

            <h2 className="font-semibold">
              {getPageTitle()}
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              {getPageSubtitle()}
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="text-[10px] px-3 py-1.5 rounded-full bg-red-400/10 text-red-300 border border-red-400/20">
              🚫 EXTERNAL API BLOCKED
            </span>

            <span className="text-[10px] px-3 py-1.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
              ● LOCAL
            </span>

          </div>

        </header>


        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto p-6">

          <div className="max-w-6xl mx-auto">


            {/* ================================================= */}
            {/* AI CHAT */}
            {/* ================================================= */}

            {page === "chat" && (

              <section className="space-y-5">

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] overflow-hidden">

                  <div className="px-6 py-5 border-b border-white/10">

                    <div className="flex items-center justify-between">

                      <div>

                        <h2 className="text-lg font-semibold">
                          🤖 GenIQ Local Assistant
                        </h2>

                        <p className="text-xs text-gray-500 mt-1">
                          Powered by local Llama inference through
                          Ollama
                        </p>

                      </div>

                      <span className="text-xs text-green-400">
                        ● ONLINE
                      </span>

                    </div>

                  </div>


                  {/* CHAT */}

                  <div className="min-h-[430px] max-h-[520px] overflow-y-auto p-6 space-y-4">

                    {messages.length === 0 && (

                      <div className="text-center py-24">

                        <div className="text-5xl mb-4">
                          🧠
                        </div>

                        <h3 className="text-xl font-semibold">
                          Welcome to GenIQ
                        </h3>

                        <p className="text-sm text-gray-500 mt-2">
                          Ask questions using your private local AI.
                        </p>

                      </div>

                    )}

                    {messages.map((msg, index) => (

                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-cyan-500 text-black"
                              : "bg-white/5 border border-white/10 text-gray-200"
                          }`}
                        >
                          {msg.content}
                        </div>

                      </div>

                    ))}

                    {loading && (

                      <div className="flex justify-start">

                        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-400">
                          GenIQ is thinking...
                        </div>

                      </div>

                    )}

                  </div>


                  {/* INPUT */}

                  <div className="border-t border-white/10 p-4">

                    <div className="flex gap-3">

                      <input
                        value={message}
                        onChange={(e) =>
                          setMessage(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Ask GenIQ anything..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
                      />

                      <button
                        onClick={sendMessage}
                        disabled={
                          !message.trim() || loading
                        }
                        className="px-6 rounded-xl bg-cyan-500 text-black font-medium disabled:opacity-30 hover:bg-cyan-400 transition"
                      >
                        {loading ? "..." : "Send"}
                      </button>

                    </div>

                    <p className="text-[10px] text-gray-600 mt-2">
                      Local inference • No external AI API
                    </p>

                  </div>

                </div>


                {/* CHAT INFO */}

                <div className="grid md:grid-cols-3 gap-4">

                  <StatusCard
                    title="AI Engine"
                    value="Ollama"
                    status="Local"
                  />

                  <StatusCard
                    title="Model"
                    value="Llama 3.2 3B"
                    status="Running"
                  />

                  <StatusCard
                    title="External APIs"
                    value="Blocked"
                    status="Secure"
                  />

                </div>

              </section>

            )}


            {/* ================================================= */}
            {/* DOCUMENTS */}
            {/* ================================================= */}

            {page === "documents" && (

              <section className="space-y-5">

                {/* UPLOAD */}

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <div className="flex items-start justify-between">

                    <div>

                      <h2 className="text-xl font-semibold">
                        📄 Document Intelligence
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Process confidential documents locally.
                      </p>

                    </div>

                    {documentUploaded && (

                      <span className="text-xs px-3 py-1.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                        ✓ DOCUMENT READY
                      </span>

                    )}

                  </div>


                  <div className="mt-6 flex flex-col md:flex-row gap-3">

                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {

                        const selectedFile =
                          e.target.files?.[0] || null;

                        setFile(selectedFile);
                        setDocumentUploaded(false);
                        setAnalysis("");
                        setReport("");

                      }}
                      className="flex-1 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-400/10 file:text-cyan-300"
                    />

                    <button
                      onClick={uploadPDF}
                      disabled={!file || uploading}
                      className="px-6 py-2 rounded-xl bg-cyan-500 text-black font-medium disabled:opacity-30 hover:bg-cyan-400"
                    >
                      {uploading
                        ? "Uploading..."
                        : "Upload PDF"}
                    </button>

                  </div>

                  {file && (

                    <div className="mt-4 text-xs text-gray-500">
                      Selected:{" "}
                      <span className="text-gray-300">
                        {file.name}
                      </span>
                    </div>

                  )}

                </div>


                {/* DOCUMENT ACTIONS */}

                {documentUploaded && (

                  <div className="grid md:grid-cols-3 gap-4">

                    <ActionCard
                      icon="🔍"
                      title="Analyze Document"
                      description="Extract key information and findings."
                      button={
                        analyzing
                          ? "Analyzing..."
                          : "Analyze"
                      }
                      onClick={analyzeDocument}
                      disabled={analyzing}
                    />

                    <ActionCard
                      icon="💬"
                      title="Ask Document"
                      description="Ask questions about uploaded content."
                      button="Ask AI"
                      onClick={() => {
                        const input =
                          document.getElementById(
                            "document-question"
                          ) as HTMLInputElement | null;

                        input?.focus();
                      }}
                    />

                    <ActionCard
                      icon="📝"
                      title="Generate Report"
                      description="Create a structured AI report."
                      button={
                        generatingReport
                          ? "Generating..."
                          : "Generate"
                      }
                      onClick={generateReport}
                      disabled={generatingReport}
                    />

                  </div>

                )}


                {/* ANALYSIS */}

                {analysis && (

                  <div className="border border-cyan-400/20 rounded-2xl p-6 bg-cyan-400/[0.03]">

                    <h3 className="font-semibold text-cyan-300 mb-4">
                      🔍 AI Document Analysis
                    </h3>

                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {analysis}
                    </p>

                  </div>

                )}


                {/* DOCUMENT CHAT */}

                {documentUploaded && (

                  <div className="border border-white/10 rounded-2xl bg-white/[0.03] overflow-hidden">

                    <div className="px-5 py-4 border-b border-white/10">

                      <h3 className="font-semibold">
                        💬 Ask Questions About Document
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        Answers are generated using the uploaded
                        document.
                      </p>

                    </div>


                    <div className="max-h-[350px] overflow-y-auto p-5 space-y-3">

                      {messages.map((msg, index) => (

                        <div
                          key={index}
                          className={`flex ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-cyan-500 text-black"
                                : "bg-white/5 border border-white/10"
                            }`}
                          >
                            {msg.content}
                          </div>

                        </div>

                      ))}

                      {messages.length === 0 && (

                        <p className="text-center text-gray-600 py-10 text-sm">
                          Ask something about your document.
                        </p>

                      )}

                    </div>


                    <div className="border-t border-white/10 p-4 flex gap-3">

                      <input
                        id="document-question"
                        value={message}
                        onChange={(e) =>
                          setMessage(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your document..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
                      />

                      <button
                        onClick={askDocument}
                        disabled={
                          !message.trim() || loading
                        }
                        className="px-5 rounded-xl bg-cyan-500 text-black font-medium disabled:opacity-30"
                      >
                        {loading ? "..." : "Ask"}
                      </button>

                    </div>

                  </div>

                )}

              </section>

            )}


            {/* ================================================= */}
            {/* KNOWLEDGE BASE */}
            {/* ================================================= */}

            {page === "knowledge" && (

              <section className="space-y-5">

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-xl font-semibold">
                        🧠 Knowledge Base
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Authorized internal knowledge for GenIQ.
                      </p>

                    </div>

                    <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
                      PROTOTYPE
                    </span>

                  </div>

                </div>


                <div className="grid md:grid-cols-3 gap-4">

                  <FeatureCard
                    icon="📚"
                    title="Internal Documents"
                    description="Store authorized enterprise knowledge."
                  />

                  <FeatureCard
                    icon="🔎"
                    title="Semantic Search"
                    description="Retrieve relevant internal information."
                  />

                  <FeatureCard
                    icon="🧩"
                    title="RAG Pipeline"
                    description="Ground AI responses in internal sources."
                  />

                </div>


                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <div className="flex justify-between items-center mb-5">

                    <h3 className="font-semibold">
                      Knowledge Sources
                    </h3>

                    <button
                      onClick={() => setPage("documents")}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-medium"
                    >
                      + Add Document
                    </button>

                  </div>

                  <div className="border border-dashed border-white/10 rounded-xl p-10 text-center">

                    <div className="text-4xl mb-3">
                      🗂️
                    </div>

                    <p className="text-gray-400 text-sm">
                      No indexed knowledge sources yet.
                    </p>

                    <p className="text-gray-600 text-xs mt-1">
                      Upload documents to begin building the
                      internal knowledge layer.
                    </p>

                  </div>

                </div>

              </section>

            )}


            {/* ================================================= */}
            {/* AGENTS */}
            {/* ================================================= */}

            {page === "agents" && (

              <section className="space-y-5">

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <h2 className="text-xl font-semibold">
                    ⚙️ Intelligent Agents
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Controlled AI workflows for confidential work.
                  </p>

                </div>


                <div className="grid md:grid-cols-2 gap-4">

                  <AgentCard
                    icon="📄"
                    title="Document Analyst"
                    description="Analyze documents and extract important information."
                    status="Ready"
                    onClick={() => setSelectedAgent("Document Analyst")}
                  />

                  <AgentCard
                    icon="🔎"
                    title="Research Agent"
                    description="Organize authorized internal information for analysis."
                    status="Ready"
                    onClick={() => setSelectedAgent("Research Agent")}
                  />

                  <AgentCard
                    icon="📊"
                    title="Report Generator"
                    description="Convert analysis into structured reports."
                    status="Ready"
                    onClick={() => setSelectedAgent("Report Generator")}
                  />

                  <AgentCard
                    icon="💻"
                    title="Data Analysis Agent"
                    description="Perform controlled calculations and data workflows."
                    status="Prototype"
                    onClick={() => setSelectedAgent("Data Analysis Agent")}
                  />

                </div>


                {selectedAgent && (
                  <div className="border border-cyan-400/20 rounded-2xl bg-cyan-400/[0.04] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-cyan-400">ACTIVE WORKFLOW</p>
                        <h3 className="font-semibold mt-1">{selectedAgent}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Close ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        ["01", "Input"],
                        ["02", "Router"],
                        ["03", "Agent"],
                        ["04", "Tools"],
                        ["05", "Output"],
                      ].map(([number, title]) => (
                        <div key={number} className="border border-white/10 rounded-xl p-3 text-center bg-white/[0.03]">
                          <div className="text-xs text-cyan-400">{number}</div>
                          <div className="text-sm font-medium mt-1">{title}</div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      Controlled workflow preview for the selected agent.
                    </p>
                  </div>
                )}

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <h3 className="font-semibold mb-5">
                    Agent Workflow
                  </h3>

                  <div className="flex flex-col md:flex-row items-center gap-3">

                    <WorkflowStep
                      number="01"
                      title="Input"
                    />

                    <Arrow />

                    <WorkflowStep
                      number="02"
                      title="Router"
                    />

                    <Arrow />

                    <WorkflowStep
                      number="03"
                      title="Agent"
                    />

                    <Arrow />

                    <WorkflowStep
                      number="04"
                      title="Tool"
                    />

                    <Arrow />

                    <WorkflowStep
                      number="05"
                      title="Output"
                    />

                  </div>

                </div>

              </section>

            )}


            {/* ================================================= */}
            {/* REPORTS */}
            {/* ================================================= */}

            {page === "reports" && (

              <section className="space-y-5">

                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <div className="flex justify-between items-center">

                    <div>

                      <h2 className="text-xl font-semibold">
                        📊 Reports
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        AI-generated structured deliverables.
                      </p>

                    </div>

                    <button
                      onClick={() => setPage("documents")}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-medium"
                    >
                      Create Report
                    </button>

                  </div>

                </div>


                {report ? (

                  <div className="border border-purple-400/20 rounded-2xl bg-purple-400/[0.03] p-6">

                    <div className="flex justify-between items-center mb-5">

                      <div>

                        <h3 className="font-semibold text-purple-300">
                          📝 AI Generated Report
                        </h3>

                        <p className="text-xs text-gray-600 mt-1">
                          Generated locally by GenIQ
                        </p>

                      </div>

                      <span className="text-xs text-green-400">
                        ● GENERATED
                      </span>

                    </div>

                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {report}
                    </p>

                  </div>

                ) : (

                  <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">

                    <div className="text-5xl mb-4">
                      📊
                    </div>

                    <h3 className="font-semibold">
                      No reports generated yet
                    </h3>

                    <p className="text-sm text-gray-600 mt-2">
                      Upload a document and generate your first
                      report.
                    </p>

                    <button
                      onClick={() => setPage("documents")}
                      className="mt-5 px-5 py-2 rounded-xl bg-cyan-500 text-black text-sm font-medium"
                    >
                      Go to Documents
                    </button>

                  </div>

                )}

              </section>

            )}


            {/* ================================================= */}
            {/* SECURITY */}
            {/* ================================================= */}

            {page === "security" && (

              <section className="space-y-5">

                <div className="border border-green-400/20 rounded-2xl bg-green-400/[0.03] p-6">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center text-2xl">
                      🔐
                    </div>

                    <div>

                      <h2 className="text-xl font-semibold">
                        Sovereign Security
                      </h2>

                      <p className="text-sm text-green-400 mt-1">
                        Local AI environment active
                      </p>

                    </div>

                  </div>

                </div>


                <div className="grid md:grid-cols-2 gap-4">

                  <SecurityCard
                    title="AI Inference"
                    value="LOCAL"
                    description="Inference is performed through the local Ollama runtime."
                    active
                  />

                  <SecurityCard
                    title="External APIs"
                    value="BLOCKED"
                    description="No external AI API is required for the current workflow."
                    active
                  />

                  <SecurityCard
                    title="Model"
                    value="Llama 3.2 3B"
                    description="Open-weight local language model."
                    active
                  />

                  <SecurityCard
                    title="Network Isolation"
                    value="READY"
                    description="Architecture supports isolated/on-premise deployment."
                    active
                  />

                </div>


                <div className="border border-white/10 rounded-2xl bg-white/[0.03] p-6">

                  <h3 className="font-semibold mb-5">
                    Security Controls
                  </h3>

                  <div className="space-y-3">

                    <SecurityRow
                      title="Local inference"
                      status="ACTIVE"
                    />

                    <SecurityRow
                      title="External AI API access"
                      status="BLOCKED"
                    />

                    <SecurityRow
                      title="Document processing"
                      status="LOCAL"
                    />

                    <SecurityRow
                      title="Audit logging"
                      status="DESIGN"
                    />

                    <SecurityRow
                      title="Role-based access"
                      status="DESIGN"
                    />

                    <SecurityRow
                      title="Sandboxed execution"
                      status="DESIGN"
                    />

                  </div>

                </div>

              </section>

            )}

          </div>

        </div>


        {/* FOOTER */}

        <footer className="border-t border-white/10 px-6 py-3 text-center text-[10px] text-gray-600">
          GenIQ · Sovereign On-Premise AI · Local inference
        </footer>

      </main>

    </div>
  );
}


// =====================================================
// SMALL UI COMPONENTS
// =====================================================

function StatusCard({
  title,
  value,
  status,
}: {
  title: string;
  value: string;
  status: string;
}) {
  return (
    <div className="border border-white/10 rounded-xl p-4 bg-white/[0.03]">

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="mt-2 font-medium">
        {value}
      </p>

      <p className="text-xs text-green-400 mt-1">
        ● {status}
      </p>

    </div>
  );
}


function ActionCard({
  icon,
  title,
  description,
  button,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  description: string;
  button: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.03] p-5">

      <div className="text-2xl">
        {icon}
      </div>

      <h3 className="font-semibold mt-3">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-1 min-h-[32px]">
        {description}
      </p>

      <button
        onClick={onClick}
        disabled={disabled}
        className="mt-4 px-4 py-2 rounded-lg border border-cyan-400/20 text-cyan-300 text-xs hover:bg-cyan-400/10 disabled:opacity-30"
      >
        {button}
      </button>

    </div>
  );
}


function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.03] p-5">

      <div className="text-2xl">
        {icon}
      </div>

      <h3 className="font-semibold mt-3">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>

    </div>
  );
}


function AgentCard({
  icon,
  title,
  description,
  status,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
  onClick: () => void;
}) {
  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.03] p-5 hover:border-cyan-400/30 transition">

      <div className="flex justify-between">

        <div className="text-2xl">
          {icon}
        </div>

        <span className="text-[10px] px-2 py-1 rounded-full bg-green-400/10 text-green-400">
          {status}
        </span>

      </div>

      <h3 className="font-semibold mt-4">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-4 text-xs text-cyan-300 hover:text-cyan-200"
      >
        View Workflow →
      </button>

    </div>
  );
}


function WorkflowStep({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex-1 w-full border border-white/10 rounded-xl p-4 text-center bg-white/[0.02]">

      <div className="text-xs text-cyan-400">
        {number}
      </div>

      <div className="font-medium text-sm mt-1">
        {title}
      </div>

    </div>
  );
}


function Arrow() {
  return (
    <div className="text-gray-600 hidden md:block">
      →
    </div>
  );
}


function SecurityCard({
  title,
  value,
  description,
  active,
}: {
  title: string;
  value: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.03] p-5">

      <div className="flex justify-between items-center">

        <h3 className="font-medium">
          {title}
        </h3>

        <span
          className={`text-xs ${
            active ? "text-green-400" : "text-gray-500"
          }`}
        >
          ● {value}
        </span>

      </div>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        {description}
      </p>

    </div>
  );
}


function SecurityRow({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">

      <span className="text-sm text-gray-300">
        {title}
      </span>

      <span className="text-xs text-green-400">
        {status}
      </span>

    </div>
  );
}


export default App;