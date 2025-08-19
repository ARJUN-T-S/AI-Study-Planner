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
function groupTopics(lines) {
  const topics = [];
  let currentTopic = "";

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;

    // If line looks like a main topic (starts with capital letter or ends with colon)
    if (/^[A-Z][A-Za-z\s&,]+(:)?$/.test(trimmed) || trimmed.endsWith(":")) {
      // If we have a current topic, push it before starting a new one
      if (currentTopic) {
        topics.push(currentTopic);
        currentTopic = "";
      }
      
      currentTopic = trimmed.replace(/:$/, "").trim(); // remove colon and trim
    }
    // If line starts with "-", "(", or looks like a subtopic
    else if ((/^[-(\d•]/.test(trimmed) || /^[a-z]/.test(trimmed)) && currentTopic) {
      // Push the current topic and start a new subtopic
      if (currentTopic) {
        topics.push(currentTopic);
      }
      currentTopic = trimmed.replace(/^[-•\s()]+/, "").trim(); // remove bullets, dashes, parentheses
    }
    else if (currentTopic) {
      // If already inside a topic, append to current topic with space
      currentTopic += " " + trimmed;
    }
    else {
      // fallback: no heading found, treat as standalone topic
      topics.push(trimmed);
    }
  });

  // Push the last topic if exists
  if (currentTopic) {
    topics.push(currentTopic);
  }

  // Further process to split combined topics
  const splitTopics = [];
  topics.forEach(topic => {
    // Split by commas that are followed by a space and capital letter or bullet points
    const subTopics = topic.split(/,\s+(?=[A-Z(-])|;\s+(?=[A-Z(-])/);
    
    subTopics.forEach(t => {
      const cleanTopic = t.trim();
      if (cleanTopic) {
        // Remove any trailing commas or other punctuation
        splitTopics.push(cleanTopic.replace(/[.,;:]$/, '').trim());
      }
    });
  });

  // Group first 2-3 topics together
  const finalTopics = [];
  if (splitTopics.length > 0) {
    // Group the first 2-3 topics
    const firstGrouping = splitTopics.slice(0, 3).join(", ");
    finalTopics.push(firstGrouping);
    
    // Add the remaining topics individually
    if (splitTopics.length > 3) {
      for (let i = 3; i < splitTopics.length; i++) {
        finalTopics.push(splitTopics[i]);
      }
    }
  }

  return finalTopics;
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

    // Step 1: Send image to Azure OCR
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: imageURL }),
    });

    // fallback v3.2 if v4.0 fails
    let operationLocation = response.headers.get("operation-location");
    if (!operationLocation) {
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

    // Step 2: Poll until finished
    let result;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      const lines = result.analyzeResult.readResults.flatMap(page =>
        page.lines.map(line => line.text)
      );

      extractedTopics = groupTopics(lines);
      extractedText = extractedTopics.join(" ");
    }

    // Step 4: Save in MongoDB
    const newSubject = new Subject({
      userId,
      subjectName,
      image:imageURL,
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