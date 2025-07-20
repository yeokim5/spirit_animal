import { useState, useRef, useEffect } from "react";
import Confetti from "react-confetti";
import PaymentPopup from "./PaymentPopup"; // Assuming this component exists
import html2canvas from "html2canvas";
import "./App.css"; // Keep existing CSS for the main app

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null); // This holds the base64 image data for preview
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); // New ref for camera input
  const resultRef = useRef(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiEmoji, setConfettiEmoji] = useState("");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  // Example images for the carousel
  const exampleImages = [
    "/example/beast.jpg",
    "/example/rohnaldo.jpg",
    "/example/speed.jpg",
    "/example/taylor.jpg",
    "/example/wong.jpg",
  ];

  // State for carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const animalEmojiMap = {
    // Mammals
    leopard: "🐆",
    lion: "🦁",
    tiger: "🐅",
    elephant: "🐘",
    panda: "🐼",
    bear: "🐻",
    koala: "🐨",
    monkey: "🐒",
    gorilla: "🦍",
    orangutan: "🦧",
    dog: "🐶",
    poodle: "🐩",
    wolf: "🐺",
    fox: "🦊",
    raccoon: "🦝",
    cat: "🐱",
    cow: "🐄",
    ox: "🐂",
    buffalo: "🐃",
    pig: "🐷",
    boar: "🐗",
    goat: "🐐",
    sheep: "🐑",
    ram: "🐏",
    deer: "🦌",
    horse: "🐴",
    zebra: "🦓",
    giraffe: "🦒",
    camel: "🐫",
    llama: "🦙",
    hippopotamus: "🦛",
    rhinoceros: "🦏",
    kangaroo: "🦘",
    bat: "🦇",
    mouse: "🐭",
    rat: "🐀",
    rabbit: "🐰",
    chipmunk: "🐿️",
    hedgehog: "🦔",

    // Birds
    chick: "🐤",
    rooster: "🐓",
    chicken: "🐔",
    turkey: "🦃",
    duck: "🦆",
    swan: "🦢",
    owl: "🦉",
    eagle: "🦅",
    dove: "🕊️",
    flamingo: "🦩",
    peacock: "🦚",
    parrot: "🦜",
    penguin: "🐧",

    // Aquatic
    fish: "🐟",
    tropical_fish: "🐠",
    blowfish: "🐡",
    shark: "🦈",
    dolphin: "🐬",
    whale: "🐳",
    seal: "🦭",
    octopus: "🐙",
    crab: "🦀",
    lobster: "🦞",
    shrimp: "🦐",
    squid: "🦑",

    // Insects & others
    snail: "🐌",
    butterfly: "🦋",
    bug: "🐛",
    ant: "🐜",
    honeybee: "🐝",
    cricket: "🦗",
    spider: "🕷️",
    scorpion: "🦂",
    mosquito: "🦟",

    // Reptiles & Amphibians
    turtle: "🐢",
    crocodile: "🐊",
    lizard: "🦎",
    snake: "🐍",
    frog: "🐸",

    // Mythical
    dragon: "🐉",
    unicorn: "🦄",

    // Extinct
    dinosaur: "🦕",
  };

  /**
   * Extracts the animal name from the first line of the LLM response.
   * @param {string} response - The raw response string from the LLM.
   * @returns {string} The extracted animal name, or an empty string if not found.
   */
  const extractAnimalName = (response) => {
    console.log("🔍 Extracting animal name from response:", response);

    if (!response) {
      console.log("❌ No response provided to extractAnimalName");
      return "";
    }

    const lines = response.split("\n");
    console.log("📝 Response split into lines:", lines);

    const firstLine = lines[0]?.trim();
    console.log("📝 First line:", firstLine);

    if (firstLine) {
      // Remove "animal: " or "**animal:**" or "Animal:" prefixes, and any remaining bold markers
      const cleanedName = firstLine
        .replace(/^\*\*?animal\s*:\s*\*\*?/i, "")
        .replace(/^animal\s*:\s*/i, "") // Added this line to handle "Animal:" or "animal:" without asterisks
        .replace(/^animal:\s*:\s*/i, "") // Added this line to handle "Animal:" or "animal:" without asterisks
        .replace(/\*\*/g, "")
        .trim();

      console.log("🦁 Extracted animal name:", cleanedName);
      return cleanedName;
    }

    console.log("❌ No first line found or first line is empty");
    return "";
  };

  /**
   * Parses the raw LLM response into HTML content for display.
   * This function formats headers, lists, and paragraphs based on markdown-like syntax.
   * @param {string} response - The raw response string from the LLM.
   * @returns {string} The HTML string representing the parsed response.
   */
  const parseLLMResponse = (response) => {
    console.log("🔧 Parsing LLM response:", response);

    if (!response) {
      console.log("❌ No response provided to parseLLMResponse");
      return "";
    }

    const lines = response.split("\n");
    console.log("📝 Response split into lines for parsing:", lines);

    let html = '<div class="container">';
    let firstLineProcessed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      console.log(`🔍 Processing line ${i}: "${trimmedLine}"`);

      if (!trimmedLine) continue; // Skip empty lines

      // Handle the first line as the animal name, adding confetti emoji
      if (!firstLineProcessed) {
        // Apply the same cleaning logic as in extractAnimalName
        const animalName = trimmedLine
          .replace(/^\*\*?animal\s*:\s*\*\*?/i, "") // Remove "**animal:**" or "animal: "
          .replace(/^animal\s*:\s*/i, "") // Remove "Animal:" or "animal:" without asterisks
          .replace(/\*\*/g, "") // Remove any remaining bold markers
          .trim();
        html += `<div class="animal_name">${confettiEmoji} ${animalName} ${confettiEmoji}</div>`;
        firstLineProcessed = true;
        continue;
      }

      // Handle specific headers like "Explanation" and "Connection"
      if (trimmedLine.startsWith("**") && trimmedLine.includes("Explanation")) {
        html += `<h2>Explanation</h2>`;
        // Check if there's content after the colon on the same line
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex !== -1 && colonIndex < trimmedLine.length - 1) {
          const content = trimmedLine.substring(colonIndex + 1).trim();
          if (content) {
            // Clean the content by removing markdown formatting
            const cleanedContent = content.replace(/\*\*/g, "").trim();
            html += `<p>${cleanedContent}</p>`;
          }
        }
        continue;
      } else if (
        trimmedLine.startsWith("**") &&
        trimmedLine.includes("Connection")
      ) {
        html += `<h2>Connection</h2>`;
        // Check if there's content after the colon on the same line
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex !== -1 && colonIndex < trimmedLine.length - 1) {
          const content = trimmedLine.substring(colonIndex + 1).trim();
          if (content) {
            // Clean the content by removing markdown formatting
            const cleanedContent = content.replace(/\*\*/g, "").trim();
            html += `<p>${cleanedContent}</p>`;
          }
        }
        continue;
      }

      // Handle any other text wrapped in ** as general headers
      if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
        const headerText = trimmedLine.replace(/\*\*/g, "").trim();
        html += `<h2>${headerText}</h2>`;
        continue;
      }

      // Handle lines ending with ":" as headers (but not list items)
      if (trimmedLine.endsWith(":") && !trimmedLine.startsWith("-")) {
        const headerText = trimmedLine
          .replace(/\*\*/g, "")
          .replace(/:$/, "")
          .trim();
        html += `<h2>${headerText}</h2>`;
        continue;
      }

      // Handle bulleted lists
      if (trimmedLine.startsWith("-")) {
        html += "<ul>";
        while (i < lines.length && lines[i]?.trim().startsWith("-")) {
          const itemLine = lines[i];
          const itemContent = itemLine.trim().substring(1).trim();
          const currentIndent = itemLine.search(/\S/); // Get current indentation

          const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
          const nextIndent = nextLine ? nextLine.search(/\S/) : -1;

          // Check for nested lists
          if (nextIndent > currentIndent && nextLine?.trim().startsWith("-")) {
            html += `<li>${itemContent
              .replace(
                /\*\*([^*]+)\*\*/g,
                '<strong class="list-strong">$1</strong>'
              )
              .replace(/:$/, "")}<ul>`; // Start nested list
            i++;
            // Consume all lines of the nested list
            while (i < lines.length && lines[i]?.search(/\S/) > currentIndent) {
              const subItemContent = lines[i].trim().substring(1).trim();
              html += `<li>${subItemContent.replace(
                /\*\*([^*]+)\*\*/g,
                '<strong class="list-strong">$1</strong>'
              )}</li>`;
              i++;
            }
            html += "</ul></li>"; // Close nested list and parent list item
            i--; // Decrement i to re-evaluate the line after the nested list ends
          } else {
            html += `<li>${itemContent.replace(
              /\*\*([^*]+)\*\*/g,
              '<strong class="list-strong">$1</strong>'
            )}</li>`;
          }
          i++;
        }
        html += "</ul>"; // Close the main list
        i--; // Decrement i to re-evaluate the line after the list ends
        continue;
      }

      // Handle regular paragraphs with ** formatting
      const formattedLine = trimmedLine.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="paragraph-strong">$1</strong>'
      );
      html += `<p>${formattedLine}</p>`;
    }

    html += "</div>";
    console.log("🎨 Final parsed HTML:", html);
    return html;
  };

  // Effect hook for carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % exampleImages.length
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [exampleImages.length]);

  // Effect hook to trigger confetti animation when a new result is available
  useEffect(() => {
    console.log("🎆 Confetti effect triggered with result:", result);

    if (!result) {
      console.log("❌ No result, turning off confetti");
      setShowConfetti(false);
      setConfettiEmoji("");
      return;
    }

    const animalName = extractAnimalName(result);
    console.log("🦁 Animal name for confetti:", animalName);

    if (!animalName) {
      console.log("❌ No animal name found, no confetti");
      return;
    }

    const lowerCaseAnimalName = animalName.toLowerCase();
    console.log("🔍 Looking for emoji for:", lowerCaseAnimalName);

    let foundEmoji = "";

    // 1. Try to find an exact match for the full animal name
    if (animalEmojiMap[lowerCaseAnimalName]) {
      foundEmoji = animalEmojiMap[lowerCaseAnimalName];
      console.log("✅ Found exact emoji match:", foundEmoji);
    } else {
      console.log("❌ No exact match, trying word splits");
      // 2. If no exact match, split the name into words and try to find a match for individual words
      const words = lowerCaseAnimalName.split(" ");
      console.log("📝 Split words:", words);

      for (const word of words) {
        if (animalEmojiMap[word]) {
          foundEmoji = animalEmojiMap[word];
          console.log("✅ Found emoji match for word:", word, "->", foundEmoji);
          break;
        }
      }
    }

    if (foundEmoji) {
      console.log("🎆 Setting confetti with emoji:", foundEmoji);
      setConfettiEmoji(foundEmoji);
      setShowConfetti(true);
      // Automatically turn off confetti after some time
      const timer = setTimeout(() => {
        console.log("⏰ Turning off confetti after 5 seconds");
        setShowConfetti(false);
      }, 5000); // Confetti lasts for 5 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or result change
    } else {
      console.log("❌ No emoji found, no confetti");
      setShowConfetti(false);
      setConfettiEmoji("");
    }
  }, [result]); // Effect runs whenever the 'result' state changes

  // Allowed file extensions for images
  const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"];

  /**
   * Handles the selection of an image file, setting it as the selected file
   * and generating a preview.
   * @param {File} file - The selected image file.
   */
  const handleFileSelect = (file) => {
    if (file) {
      // Get file extension
      const ext = file.name.split(".").pop().toLowerCase();
      if (file.type.startsWith("image/") && ALLOWED_EXTENSIONS.includes(ext)) {
        setSelectedFile(file);
        setError(null);
        setResult(null); // Clear previous results
        setShowConfetti(false); // Turn off confetti
        setConfettiEmoji(""); // Clear confetti emoji
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result); // Set image preview
        reader.readAsDataURL(file); // Read file as Data URL
      } else {
        setError(
          `Please upload an image in one of these formats: ${ALLOWED_EXTENSIONS.map(
            (e) => e.toUpperCase()
          ).join(", ")}`
        );
        setSelectedFile(null);
        setPreview(null);
      }
    } else {
      setError("Please select a valid image file");
      setSelectedFile(null);
      setPreview(null);
    }
  };

  /**
   * Handles the file drop event for drag-and-drop functionality.
   * @param {Event} e - The drag event.
   */
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  /**
   * Prevents default behavior for drag over events to allow dropping.
   * @param {Event} e - The drag event.
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Handles file selection from the hidden file input.
   * @param {Event} e - The change event from the input.
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    // Reset the value so the same file can be selected again if needed
    e.target.value = "";
  };

  /**
   * Initiates the image analysis process. Checks for file selection and payment status.
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    // Check if user has already paid; if not, show payment popup
    if (!hasPaid) {
      setShowPaymentPopup(true);
      return;
    }

    // Proceed with analysis if payment is complete
    await performAnalysis();
  };

  /**
   * Performs the actual image analysis by sending the image to the backend API.
   */
  const performAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowConfetti(false);
    setConfettiEmoji("");
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      // Get API URL from environment variable or default to localhost
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      console.log("🌐 Making API request to:", `${apiUrl}/predict`);
      console.log(
        "📁 File being sent:",
        selectedFile.name,
        "Size:",
        selectedFile.size,
        "Type:",
        selectedFile.type
      );

      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      console.log("📡 Response status:", response.status);
      console.log(
        "📡 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("📦 Raw API response data:", data);
      console.log("📦 Response data type:", typeof data);
      console.log("📦 Response data keys:", Object.keys(data));

      if (response.ok) {
        console.log("✅ API call successful");
        console.log("🎯 Result content:", data.result);
        console.log("🎯 Result type:", typeof data.result);
        console.log("🎯 Result length:", data.result ? data.result.length : 0);

        // Log the extracted animal name
        const animalName = extractAnimalName(data.result);
        console.log("🦁 Extracted animal name:", animalName);

        setResult(data.result); // Set the analysis result
      } else {
        console.error("❌ API call failed");
        console.error("❌ Error data:", data);
        setError(data.message || "Failed to analyze image"); // Display error message
      }
    } catch (err) {
      console.error("💥 Network/API error:", err);
      console.error("💥 Error message:", err.message);
      console.error("💥 Error stack:", err.stack);
      setError("Network error. Please check if the backend server is running.");
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  /**
   * Callback function for successful payment. Sets payment status and proceeds with analysis.
   */
  const handlePaymentSuccess = () => {
    setHasPaid(true);
    setShowPaymentPopup(false);
    // Automatically proceed with analysis after successful payment
    performAnalysis();
  };

  /**
   * Resets the form to its initial state, clearing selections and results.
   */
  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowConfetti(false);
    setConfettiEmoji("");
    setHasPaid(false); // Reset payment status when starting over
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input value
    }
  };

  /**
   * Generates and shares the result images.
   * Optimized for mobile sharing with proper fallbacks.
   */
  const saveResult = async () => {
    if (!result || !preview) return;

    setIsSaving(true);
    try {
      // 1. Extract necessary data
      const animalName = extractAnimalName(result);
      const fullParsedHtml = parseLLMResponse(result);

      // 2. Helper function to create a styled container for rendering (No changes here)
      const createContainer = (content, isSimple = false) => {
        const container = document.createElement("div");

        if (isSimple) {
          // Square format for simple view
          container.style.cssText = `
          position: fixed; top: -9999px; left: -9999px; width: 800px; height: 800px;
          background: linear-gradient(135deg, #e4e4e4 0%, #ffffff 100%); padding: 30px;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #333;
          box-sizing: border-box; display: flex; flex-direction: column;
          justify-content: center; align-items: center; overflow: hidden;
        `;
        } else {
          // Original rectangular format for detailed view
          container.style.cssText = `
          position: fixed; top: -9999px; left: -9999px; width: 800px;
          background: linear-gradient(135deg, #e4e4e4 0%, #ffffff 100%);
          padding: 40px; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #333; box-sizing: border-box;
        `;
        }

        const styleTag = document.createElement("style");
        styleTag.innerHTML = `
        .save-wrapper { width: 100%; text-align: center; }
        .save-wrapper.square { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .save-image-simple { max-width: 450px; max-height: 450px; width: auto; height: auto; object-fit: contain; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); margin: 15px auto; }
        .save-image { max-width: 50%; height: auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); margin: 20px auto; }
        .share-header { margin-bottom: 15px; }
        .share-title { font-size: 3rem; font-weight: 700; color: #333; margin: 0 0 5px 0; }
        .share-url { font-size: 2rem; color: #666; margin: 0; }
        .result-content { background: white; border-radius: 15px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
        .result-content .animal_name { color: #5a4830; font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 2rem; text-shadow: 0 2px 4px rgba(102, 126, 234, 0.2); }
        .result-content h2 { text-align: left; color: #333; font-size: 1.4rem; font-weight: 600; margin: 1.5rem 0 1rem 0; border-bottom: 2px solid #667eea; padding-bottom: 0.5rem; }
        .result-content p { text-align: left; margin-bottom: 1rem; color: #555; }
        .result-content ul { text-align: left; margin: 1rem 0; padding-left: 1.5rem; }
        .result-content li { margin-bottom: 1rem; color: #555; }
        .result-content li strong { color: #667eea; font-weight: 600; }
        .result-content .container { max-width: 100%; }
        .simple-animal-name { font-size: 2.2em; font-weight: bold; color: #333; text-align: center; padding: 15px; margin-top: 10px; }
      `;

        container.innerHTML = content;
        container.prepend(styleTag);
        return container;
      };

      // 3. Define HTML content for both simple and detailed images (No changes here)
      const simpleContent = `
      <div class="save-wrapper square">
        <div class="share-header">
          <h1 class="share-title">Vibe Animal Matcher</h1>
          <p class="share-url">https://vibe-animal.vercel.app/</p>
        </div>
        <img src="${preview}" alt="Vibe" class="save-image-simple" />
        <div class="simple-animal-name">${confettiEmoji} ${animalName} ${confettiEmoji}</div>
      </div>
    `;

      const detailedContent = `
      <div class="save-wrapper">
        <div class="share-header">
          <h1 class="share-title">Vibe Animal Matcher</h1>
          <p class="share-url">https://vibe-animal.vercel.app/</p>
        </div>
        <img src="${preview}" alt="Vibe" class="save-image" />
        <div class="result-content">${fullParsedHtml}</div>
      </div>
    `;

      const simpleContainer = createContainer(simpleContent, true);
      const detailedContainer = createContainer(detailedContent, false);

      // 4. Append containers to the DOM to be rendered (No changes here)
      document.body.appendChild(simpleContainer);
      document.body.appendChild(detailedContainer);

      // 5. Render both containers to canvases in parallel (No changes here)
      const [simpleCanvas, detailedCanvas] = await Promise.all([
        html2canvas(simpleContainer, {
          scale: 2,
          useCORS: true,
          width: 800,
          height: 800,
        }),
        html2canvas(detailedContainer, {
          scale: 2,
          useCORS: true,
        }),
      ]);

      // 6. Clean up the containers from the DOM (No changes here)
      document.body.removeChild(simpleContainer);
      document.body.removeChild(detailedContainer);

      // 7. Helper to trigger download for a canvas (No changes here)
      const downloadCanvas = (canvas, filename) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas for", filename);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, "image/png");
      };

      // Helper to convert a canvas to a File object with better error handling
      const canvasToFile = (canvas, filename) => {
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas to Blob conversion failed."));
                return;
              }
              console.log("📄 Created blob:", {
                size: blob.size,
                type: blob.type,
              });
              const file = new File([blob], filename, { type: "image/png" });
              console.log("📁 Created file:", {
                name: file.name,
                size: file.size,
                type: file.type,
              });
              resolve(file);
            },
            "image/png",
            0.9
          ); // Added quality parameter for better compression
        });
      };

      // Check if we're on a mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      console.log("📱 Device type:", isMobile ? "Mobile" : "Desktop");

      // Try sharing with Web Share API if available
      if (navigator.share && typeof navigator.share === "function") {
        try {
          const simpleFileName = `vibe-animal-result-${Date.now()}.png`;
          const simpleFile = await canvasToFile(simpleCanvas, simpleFileName);

          console.log(
            "📤 Attempting to share file:",
            simpleFile.name,
            "Size:",
            simpleFile.size
          );

          // Check if we can share files
          if (
            navigator.canShare &&
            navigator.canShare({ files: [simpleFile] })
          ) {
            console.log("✅ Can share files, attempting share...");
            await navigator.share({
              title: "Vibe Animal Matcher Result",
              text: `Check out my vibe animal: ${animalName}! 🦁`,
              files: [simpleFile],
            });
            console.log("✅ Share successful!");
          } else {
            // Fallback: share text and URL
            console.log("⚠️ Cannot share files, trying text-only share...");
            await navigator.share({
              title: "Vibe Animal Matcher Result",
              text: `Check out my vibe animal: ${animalName}! 🦁 Visit https://vibe-animal.vercel.app/ to try it yourself!`,
            });
            console.log("✅ Text-only share successful!");
          }
        } catch (error) {
          console.error("❌ Share failed:", error);
          // Don't trigger download if the user simply cancelled the share dialog
          if (error.name !== "AbortError") {
            console.log("🔄 Falling back to download due to share error");
            // On mobile, show a message about the fallback
            if (isMobile) {
              setError("Sharing not available. Downloading image as fallback.");
              setTimeout(() => setError(null), 3000);
            }
            // Fallback to downloading the simple image
            downloadCanvas(
              simpleCanvas,
              `vibe-animal-result-${Date.now()}.png`
            );
          } else {
            console.log("✅ Share action was cancelled by the user.");
          }
        }
      } else {
        console.log("🔄 No share API available, falling back to download");
        // On desktop or when share API is not available, download both images
        if (!isMobile) {
          downloadCanvas(simpleCanvas, `vibe-animal-simple-${Date.now()}.png`);
          downloadCanvas(
            detailedCanvas,
            `vibe-animal-detailed-${Date.now()}.png`
          );
        } else {
          // On mobile without share API, download just the simple image
          downloadCanvas(simpleCanvas, `vibe-animal-result-${Date.now()}.png`);
        }
      }
    } catch (error) {
      console.error("Error saving result:", error);
      setError("Failed to save result. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Vibe Animal Matcher</h1>
        <p>
          Upload an image to discover what animal best represents your vibe!
        </p>
      </header>

      <main className="main">
        <div className="upload-section">
          <div
            className={`upload-area ${preview ? "has-preview" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            // Remove onClick from upload-area
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <h3>Upload Your Image</h3>
                <p>Drag and drop an image here, or use the buttons below</p>
                <p className="file-types">Supports: JPG, PNG, GIF, BMP, JPEG</p>
                <div
                  className="upload-buttons"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "1rem",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    📷 Take Photo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    🖼️ Upload from Gallery
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Camera input (for taking a photo) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
          {/* Gallery input (for uploading from gallery) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
          <div className="button-group">
            {selectedFile && !result && (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Analyzing..." : "Analyze Image"}
              </button>
            )}
            {selectedFile && (
              <button
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={isLoading}
              >
                {result ? "Try Another Image" : "Reset"}
              </button>
            )}
          </div>
        </div>

        {/* Example Images Carousel - Only show when no result */}
        {!result && (
          <div className="example-carousel-container">
            <div className="example-carousel">
              <div className="carousel-track">
                {exampleImages.map((image, index) => (
                  <div
                    key={index}
                    className={`example-image-wrapper ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Example ${index + 1}`}
                      className="example-image"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing your image...</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <div
              ref={resultRef}
              className="result-content"
              dangerouslySetInnerHTML={{ __html: parseLLMResponse(result) }}
            />
            <div className="save-button-container">
              <button
                className="btn btn-save"
                onClick={saveResult}
                disabled={isSaving}
              >
                {isSaving ? "Sharing..." : "📤 Share Result"}
              </button>
            </div>
          </div>
        )}
      </main>

      {showConfetti && confettiEmoji && (
        <Confetti
          recycle={false}
          numberOfPieces={100}
          confettiSource={{
            x: 0,
            y: 0,
            w: window.innerWidth,
            h: 0,
          }}
          initialVelocityX={{ min: -5, max: 5 }}
          initialVelocityY={{ min: 10, max: 15 }}
          gravity={0.3}
          wind={0.01}
          drawShape={(ctx) => {
            ctx.font = "30px serif";
            ctx.fillText(confettiEmoji, 0, 0);
          }}
        />
      )}

      <footer className="footer">
        <p>
          Powered by{" "}
          <a
            href="http://yeokim5.github.io/"
            style={{ textDecoration: "none" }}
          >
            http://yeokim5.github.io/
          </a>
        </p>
      </footer>

      {/* Payment popup component */}
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default App;
