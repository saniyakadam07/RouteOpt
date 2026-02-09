import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Setup API Key (Vite/Frontend way)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: VITE_GEMINI_API_KEY is missing in .env");
}

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(API_KEY);

// 🔥 UPDATED MODEL NAME
const MODEL_NAME = "gemini-1.5-flash";

/**
 * 🛠️ HELPER: Convert Browser File to Base64
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result looks like "data:image/jpeg;base64,....."
      const base64Data = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ==========================================
// 🛡️ FEATURE A: ID CARD VERIFICATION
// ==========================================
export const verifyIDCard = async (file) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image strictly. It must be a valid physical Student ID card or Employee ID card.
      
      Return ONLY a JSON object with this structure:
      {
        "isValid": boolean, // true ONLY if it is a clear, valid ID card.
        "name": "Extracted Name" || null,
        "institution": "Extracted Institution Name" || null,
        "authenticity_score": number (0-10), // 10 = Real physical card, <5 = Screen/Photocopy
        "reason": "Short reason if invalid or low score"
      }
      
      CRITICAL RULES:
      1. If the image is blurry, dark, or not an ID card, set isValid: false.
      2. If it looks like a photo of a screen or a xerox/photocopy, set authenticity_score below 5.
      3. Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    console.log(`Sending ID to Gemini (${MODEL_NAME})...`);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      isValid: false,
      authenticity_score: 0,
      reason: "AI Service Error",
    };
  }
};

// ==========================================
// 🆔 FEATURE: AADHAR VERIFICATION (REAL AI RESTORED)
// ==========================================
export const verifyAadhar = async (file) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image. It must be an Indian Aadhar Card.
      
      Return ONLY a JSON object:
      {
        "isValid": boolean,
        "name": "Extracted Name" || null,
        "aadharNumber": "Last 4 digits only" || null,
        "authenticity_score": number (0-10),
        "reason": "Reason if invalid"
      }
      
      Do not include markdown.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Aadhar Scan Error:", error);
    return { isValid: false, reason: "Scan Failed" };
  }
};

// ==========================================
// 🚗 FEATURE: VEHICLE RC VERIFICATION (REAL AI RESTORED)
// ==========================================
export const verifyVehicleRC = async (file) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image. It must be a Vehicle Registration Certificate (RC).
      
      Return ONLY a JSON object:
      {
        "isValid": boolean,
        "plateNumber": "Extracted Vehicle Number" || null,
        "ownerName": "Extracted Owner Name" || null,
        "vehicleModel": "Car Model" || null,
        "reason": "Reason if invalid"
      }
      
      Do not include markdown.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("RC Scan Error:", error);
    return { isValid: false, reason: "Scan Failed" };
  }
};

// ==========================================
// 🪪 FEATURE: DRIVING LICENSE VERIFICATION (REAL AI RESTORED)
// ==========================================
export const verifyDrivingLicense = async (file) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image. It must be a valid Driving License.
      
      Return ONLY a JSON object:
      {
        "isValid": boolean,
        "licenseNumber": "Extracted DL Number" || null,
        "name": "Extracted Name" || null,
        "vehicleClass": "LMV/MCWG etc" || null,
        "reason": "Reason if invalid"
      }
      
      Do not include markdown.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("License Scan Error:", error);
    return { isValid: false, reason: "Scan Failed" };
  }
};

// ==========================================
// 🌿 FEATURE B: ECO-LOOP AI COACH
// ==========================================
export const generateEcoTip = async (kmSaved, co2Saved) => {
  try {
    const km = Math.round(kmSaved || 0);
    const co2 = Math.round(co2Saved || 0);

    if (km <= 5 && co2 <= 1) {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              "Take your first shared ride today to unlock AI-powered eco-insights!",
            ),
          800,
        ),
      );
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      Context: You are an enthusiastic AI coach for a carpooling app focused on sustainability.
      Data: This user has saved ${km} kilometers of driving and avoided ${co2} kg of CO2 emissions so far.
      
      Task: Generate a single, short, punchy, 1-sentence motivational "Green Fact" or specific comparison based on this data to encourage them.
      
      Constraint: Return ONLY the single sentence. Do not add quotation marks.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/^"|"$/g, "").trim();
    return text;
  } catch (error) {
    console.error("Gemini Eco-Tip API Error:", error);
    return "Your sustainable choices are making a real difference. Keep it up!";
  }
};
