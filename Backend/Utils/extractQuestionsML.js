const fetch = require("node-fetch");

exports.extractQuestionsWithML = async function (rawText) {
  // Split into lines & clean
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l);

  const blocks = [];
  let currentBlock = "";

  // Regex to detect question starts (strict)
  const questionStartRegex = /^(\(?[0-9]+[\).]?|\(?[a-z][\).]?|\(i+\))\s+/i;
  // Matches:
  // 1. , 1) , (1) 
  // a. , a) , (a)
  // (i), (ii), (iii)...

  for (const line of lines) {
    if (questionStartRegex.test(line)) {
      // New question → save the old one
      if (currentBlock) blocks.push(currentBlock.trim());
      currentBlock = line;
    } else {
      // Still part of the current question
      currentBlock += " " + line;
    }
  }
  if (currentBlock) blocks.push(currentBlock.trim());

  // Filter out garbage if blocks are empty
  if (!blocks.length) return [];

  // Hugging Face classification
  const questions = [];

  for (const block of blocks) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: block,
            parameters: {
              candidate_labels: ["question", "metadata"],
            },
          }),
        }
      );

      const result = await response.json();

      if (result && result.labels) {
        const idx = result.labels.findIndex(l => l === "question");
        if (idx !== -1 && result.scores[idx] > 0.7) {
          questions.push(block);
        }
      }
    } catch (err) {
      console.error("HF error for block:", block, err);
    }
  }

  return questions;
};
