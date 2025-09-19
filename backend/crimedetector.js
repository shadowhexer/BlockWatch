import langdetect from "langdetect"; // Import langdetect for language detection
import compromise from "compromise"; // Import compromise for basic NLP tasks

// Define crime keywords for each language
const lowCrimeKeywords = {
  english: [
    "vandalism",
    "graffiti",
    "theft",
    "shoplifting",
    "disturbance",
    "petty theft",
    "damage",
  ],
  tagalog: ["paninira", "grafitti", "nakawan", "shoplifting", "gulo"],
  bisaya: [
    "pamalikas",
    "namalikas",
    "nangawat",
    "paglapas sa balaod",
    "gubot",
    "panaway",
  ],
};

const highCrimeKeywords = {
  english: [
    "murder",
    "stabbing",
    "assault",
    "shooting",
    "kidnapping",
    "robbery",
    "rape",
    "homicide",
    "violent attack",
  ],
  tagalog: ["pagpatay", "saksak", "pag-atake", "pagdukot", "pang-aabuso"],
  bisaya: ["pagpatay", "saksak", "panlupig", "pagdakop", "pang-abuso"],
};

// Crime Classification Function with Language Detection and NLP
function classifyCrime(report) {
  let severity = "Low"; // Default is low crime

  // Detect the language of the description (return the first match from langdetect)
  const detectedLanguage =
    langdetect.detect(report.description)[0]?.language || "en"; // Default to 'en' if detection fails

  // Use compromise to extract named entities, especially weapons or victims
  const doc = compromise(report.description);
  const weapons = doc.match("#Weapon").out("array"); // Look for weapon-related terms
  const victims = doc.match("#Person").out("array"); // Look for person-related terms
  const locations = doc.match("#Place").out("array"); // Look for location-related terms

  // If a weapon or a victim is mentioned, classify as High Crime
  if (weapons.length > 0 || victims.length > 0) {
    severity = "High";
  }

  // Select crime keywords based on detected language
  const crimeKeywords = {
    english: { low: lowCrimeKeywords.english, high: highCrimeKeywords.english },
    tagalog: { low: lowCrimeKeywords.tagalog, high: highCrimeKeywords.tagalog },
    bisaya: { low: lowCrimeKeywords.bisaya, high: highCrimeKeywords.bisaya },
  };

  // Default to English if the detected language is not in the list
  const selectedKeywords =
    crimeKeywords[detectedLanguage] || crimeKeywords.english;

  // Check for high crime based on keywords
  let highCrimeDetected = false;
  for (let keyword of selectedKeywords.high) {
    if (report.description.toLowerCase().includes(keyword)) {
      severity = "High";
      highCrimeDetected = true;
      break;
    }
  }

  // If no high crime detected, check for low crime
  if (!highCrimeDetected) {
    for (let keyword of selectedKeywords.low) {
      if (report.description.toLowerCase().includes(keyword)) {
        severity = "Low";
        break;
      }
    }
  }

  return severity;
}

export { classifyCrime }; // Export the function for use in other files
