import { useState, useRef, useEffect } from "react";
import Confetti from "react-confetti";
import PaymentPopup from "./PaymentPopup"; // Assuming this component exists
import SharingModal from "./SharingModal"; // Import the new modal component
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

  // --- New state for the sharing modal ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCanvas, setShareCanvas] = useState(null);

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
   * Checks if the backend server is reachable.
   * Returns true if backend is up, false otherwise.
   */
  const checkBackendHealth = async () => {
    try {
      // Use a lightweight endpoint; fallback to /predict with OPTIONS if no /health
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/predict`, {
        method: "OPTIONS",
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  };

  /**
   * Initiates the image analysis process. Checks for file selection and payment status.
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    // Check if backend is up before proceeding
    setIsLoading(true);
    setError(null);
    const backendOk = await checkBackendHealth();
    setIsLoading(false);
    if (!backendOk) {
      setError("The server is not working right now. Please try again later.");
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
   * REWRITTEN: Generates a shareable image and opens the SharingModal.
   */
  const saveResult = async () => {
    if (!result || !preview || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const animalName = extractAnimalName(result);

      // 1. Create a hidden container to render the shareable image
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; top: -9999px; left: -9999px; width: 800px; height: 800px;
        background: linear-gradient(135deg, #e4e4e4 0%, #ffffff 100%); padding: 30px;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #333;
        box-sizing: border-box; display: flex; flex-direction: column;
        justify-content: center; align-items: center; overflow: hidden;
      `;

      const simpleContent = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="margin-bottom: 15px;">
            <h1 style="font-size: 3rem; font-weight: 700; color: #333; margin: 0 0 5px 0;">AI Vibe Animal Matcher</h1>
            <p style="font-size: 2rem; color: #666; margin: 0;">vibe-animal.vercel.app</p>
          </div>
          <img src="${preview}" alt="Vibe" style="max-width: 450px; max-height: 450px; width: auto; height: auto; object-fit: contain; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); margin: 15px auto;" />
          <div style="font-size: 2.2em; font-weight: bold; color: #333; text-align: center; padding: 15px; margin-top: 10px;">${confettiEmoji} ${animalName} ${confettiEmoji}</div>
        </div>
      `;
      container.innerHTML = simpleContent;
      document.body.appendChild(container);

      // 2. Convert the container to a canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        width: 800,
        height: 800,
      });

      document.body.removeChild(container);

      // 3. Store the canvas in state and open the modal
      setShareCanvas(canvas);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error creating shareable image:", error);
      setError("Failed to create shareable image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="app">
      <header className="header">
        <h1>AI Vibe Animal Matcher</h1>
        <h2>
          It uses the most advanced AI <br /> to discover what animal best
          represents your vibe!
        </h2>
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
        {!result && !isLoading && (
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

      {/* Render the new Sharing Modal */}
      {showShareModal && (
        <SharingModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          canvas={shareCanvas}
          animalName={extractAnimalName(result)}
          confettiEmoji={confettiEmoji}
        />
      )}
    </div>
  );
}

export default App;
