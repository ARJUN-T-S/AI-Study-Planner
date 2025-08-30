const fetch = require("node-fetch");
const { extractQuestionsWithML } = require('../Utils/extractQuestionsML');
const ModelPaper = require("../Models/ModelPaper");  // ✅ Import schema

exports.deleteModelQ = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Check if the document exists
    const modelQ = await ModelQ.findById(subjectId);
    if (!modelQ) {
      return res.status(404).json({ message: "Model Question not found" });
    }

    // Delete the document
    await ModelQ.findByIdAndDelete(subjectId);

    res.status(200).json({ message: "Model Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting Model Question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.uploadPDF = async (req, res) => {
  try {
    const AZURE_DOC_INTELLIGENCE_ENDPOINT = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    const AZURE_DOC_INTELLIGENCE_KEY = process.env.AZURE_DOC_INTELLIGENCE_KEY;

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    // Azure endpoint
    const url = `${AZURE_DOC_INTELLIGENCE_ENDPOINT}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31`;

    // Send PDF buffer to Azure
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_DOC_INTELLIGENCE_KEY,
        "Content-Type": "application/pdf",
      },
      body: req.file.buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        message: "Failed to start analysis",
        error: errorText,
      });
    }

    // Poll for result
    const operationLocation = response.headers.get("operation-location");
    if (!operationLocation) {
      return res.status(500).json({ message: "No operation-location returned by Azure" });
    }

    let result = null;
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));

      const pollResponse = await fetch(operationLocation, {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_DOC_INTELLIGENCE_KEY,
        },
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        return res.status(pollResponse.status).json({
          message: "Polling failed",
          error: errorText,
        });
      }

      const pollData = await pollResponse.json();

      if (pollData.status === "succeeded") {
        result = pollData;
        break;
      } else if (pollData.status === "failed") {
        return res.status(500).json({ message: "Analysis failed", details: pollData });
      }
    }

    if (!result) {
      return res.status(500).json({ message: "Analysis timed out" });
    }

    // Extract text
    const extractedText = result.analyzeResult?.content || "";

    // Process with ML model to only keep questions
    const questionList = await extractQuestionsWithML(extractedText);

    // ✅ Save to DB
    const newModelPaper = new ModelPaper({
      subjectId: req.body.subjectId, // must be passed from frontend
      userId: req.userId,       // Firebase UID
      extractedQuestions: questionList,
    });

    await newModelPaper.save();

    res.status(200).json({
      message: "PDF processed & saved successfully",
      data: newModelPaper,
    });

  } catch (error) {
    console.error("Error analyzing PDF:", error);
    res.status(500).json({
      message: "Error analyzing PDF",
      error: error.message,
    });
  }
};
