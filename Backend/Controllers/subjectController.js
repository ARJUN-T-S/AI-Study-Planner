const Subject=require('../Models/Subject');
const fetch = require('node-fetch');
exports.addSubjectWithoutImage=async(req,res)=>{
    try{
    const userId=req.userId;
    const {subjectName,syllabusText}=req.body;
    const extractedTopics=syllabusText.split(",");
    const newSubject=new Subject({userId,subjectName,syllabusText,extractedTopics});
    await newSubject.save();
    return res.status(201).json({message:"Sucessfully created"});
    }
    catch(err){
        return res.status(500).json({message:"Failed to add!Please try again later"});
    }
}
exports.addSubjectWithImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { subjectName } = req.body;
    const imageURL = req.imageURL;

    if (!imageURL) {
      return res.status(400).json({ message: "No image URL found" });
    }

    const apiKey = process.env.AZURE_OCR_KEY;
    let endpoint = process.env.AZURE_OCR_ENDPOINT + "vision/v4.0/read/analyze";

    // Step 1: Send image to Read API
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: imageURL }),
    });

    // Try fallback v3.2 if no Operation-Location
    let operationLocation = response.headers.get("operation-location");
    if (!operationLocation) {
      console.warn("No Operation-Location in v4.0, retrying with v3.2...");
      endpoint = process.env.AZURE_OCR_ENDPOINT + "vision/v3.2/read/analyze";
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageURL }),
      });
      operationLocation = response.headers.get("operation-location");
    }

    if (!operationLocation) {
      throw new Error("No Operation-Location returned from Azure Read API");
    }

    // Step 2: Poll for results
    let result;
    for (let i = 0; i < 10; i++) { // up to 10 tries
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 sec
      const pollResponse = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
      });
      result = await pollResponse.json();
      if (result.status === "succeeded") break;
    }

    // Step 3: Extract text
    let extractedText = "";
    let extractedTopics = [];

    if (result.status === "succeeded" && result.analyzeResult) {
      extractedTopics = result.analyzeResult.readResults.flatMap(page =>
        page.lines.map(line => line.text)
      );
      extractedText = extractedTopics.join(" ");
    } else {
      console.warn("OCR did not succeed. Final status:", result.status);
    }

    // Step 4: Save to MongoDB
    const newSubject = new Subject({
      userId,
      subjectName,
      syllabusText: extractedText,
      extractedTopics,
    });

    await newSubject.save();

    res.status(201).json({
      message: "OCR successful",
      extractedText,
      extractedTopics,
      newSubjectId: newSubject._id,
    });

  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({
      message: "OCR failed. Please check the image URL and try again.",
      error: err.message,
    });
  }
};
