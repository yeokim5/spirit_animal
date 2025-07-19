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

  const animalEmojiMap = {
    // ... (animalEmojiMap remains the same)
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
    if (!response) return "";

    const lines = response.split("\n");
    const firstLine = lines[0]?.trim();

    if (firstLine) {
      // Remove "animal: " or "**animal:**" or "Animal:" prefixes, and any remaining bold markers
      return firstLine
        .replace(/^\*\*?animal\s*:\s*\*\*?/i, "")
        .replace(/^animal\s*:\s*/i, "") // Added this line to handle "Animal:" or "animal:" without asterisks
        .replace(/\*\*/g, "")
        .trim();
    }

    return "";
  };

  /**
   * Parses the raw LLM response into HTML content for display.
   * This function formats headers, lists, and paragraphs based on markdown-like syntax.
   * @param {string} response - The raw response string from the LLM.
   * @returns {string} The HTML string representing the parsed response.
   */
  const parseLLMResponse = (response) => {
    // ... (parseLLMResponse remains the same)
    if (!response) return "";

    const lines = response.split("\n");
    let html = '<div class="container">';
    let firstLineProcessed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

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
        continue;
      } else if (
        trimmedLine.startsWith("**") &&
        trimmedLine.includes("Connection")
      ) {
        html += `<h2>Connection</h2>`;
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
    return html;
  };

  // Effect hook to trigger confetti animation when a new result is available
  useEffect(() => {
    if (!result) {
      setShowConfetti(false);
      setConfettiEmoji("");
      return;
    }

    const animalName = extractAnimalName(result);
    if (!animalName) return;

    const lowerCaseAnimalName = animalName.toLowerCase();
    let foundEmoji = "";

    // 1. Try to find an exact match for the full animal name
    if (animalEmojiMap[lowerCaseAnimalName]) {
      foundEmoji = animalEmojiMap[lowerCaseAnimalName];
    } else {
      // 2. If no exact match, split the name into words and try to find a match for individual words
      const words = lowerCaseAnimalName.split(" ");
      for (const word of words) {
        if (animalEmojiMap[word]) {
          foundEmoji = animalEmojiMap[word];
          break;
        }
      }
    }

    if (foundEmoji) {
      setConfettiEmoji(foundEmoji);
      setShowConfetti(true);
      // Automatically turn off confetti after some time
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000); // Confetti lasts for 5 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or result change
    } else {
      setShowConfetti(false);
      setConfettiEmoji("");
    }
  }, [result]); // Effect runs whenever the 'result' state changes

  // ... (handleFileSelect, handleDrop, handleDragOver, handleFileInputChange, handleSubmit, performAnalysis, handlePaymentSuccess, resetForm functions remain the same)
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setError(null);
      setResult(null); // Clear previous results
      setShowConfetti(false); // Turn off confetti
      setConfettiEmoji(""); // Clear confetti emoji
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result); // Set image preview
      reader.readAsDataURL(file); // Read file as Data URL
    } else {
      setError("Please select a valid image file");
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    e.target.value = "";
  };
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    if (!hasPaid) {
      setShowPaymentPopup(true);
      return;
    }
    await performAnalysis();
  };
  const performAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowConfetti(false);
    setConfettiEmoji("");
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.message || "Failed to analyze image");
      }
    } catch (err) {
      setError("Network error. Please check if the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };
  const handlePaymentSuccess = () => {
    setHasPaid(true);
    setShowPaymentPopup(false);
    performAnalysis();
  };
  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowConfetti(false);
    setConfettiEmoji("");
    setHasPaid(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // CHANGE: Replaced 'saveResult' with a new function to handle mobile sharing and desktop downloading.
  /**
   * Generates result images and uses the Web Share API on mobile devices,
   * falling back to a standard download on desktop.
   */
  const shareOrDownloadResult = async () => {
    if (!result || !preview) return;

    setIsSaving(true);
    try {
      // 1. Extract necessary data
      const animalName = extractAnimalName(result);
      const fullParsedHtml = parseLLMResponse(result);

      // 2. Helper function to create a styled container for rendering
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
            background: linear-gradient(135deg, #e4e4e4 0%, #ffffff 100%); padding: 40px;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #333;
            box-sizing: border-box;
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

      // 3. Define HTML content for both simple and detailed images
      const simpleContent = `
        <div class="save-wrapper square">
          <div class="share-header">
            <h1 class="share-title">Vibe Animal Matcher</h1>
            <p class="share-url">www.animalmatcher.com</p>
          </div>
          <img src="${preview}" alt="Vibe" class="save-image-simple" />
          <div class="simple-animal-name">${confettiEmoji} ${animalName} ${confettiEmoji}</div>
        </div>
      `;

      const detailedContent = `
        <div class="save-wrapper">
          <div class="share-header">
            <h1 class="share-title">Vibe Animal Matcher</h1>
            <p class="share-url">www.animalmatcher.com</p>
          </div>
          <img src="${preview}" alt="Vibe" class="save-image" />
          <div class="result-content">${fullParsedHtml}</div>
        </div>
      `;

      const simpleContainer = createContainer(simpleContent, true);
      const detailedContainer = createContainer(detailedContent, false);

      document.body.appendChild(simpleContainer);
      document.body.appendChild(detailedContainer);

      const [simpleCanvas, detailedCanvas] = await Promise.all([
        html2canvas(simpleContainer, {
          scale: 2,
          useCORS: true,
          width: 800,
          height: 800,
        }),
        html2canvas(detailedContainer, { scale: 2, useCORS: true }),
      ]);

      document.body.removeChild(simpleContainer);
      document.body.removeChild(detailedContainer);

      // CHANGE: Use Web Share API on mobile, fallback to download on desktop
      if (navigator.share && navigator.canShare) {
        // Mobile Path: Use the Web Share API 📱
        const [simpleBlob, detailedBlob] = await Promise.all([
          new Promise((resolve) => simpleCanvas.toBlob(resolve, "image/png")),
          new Promise((resolve) => detailedCanvas.toBlob(resolve, "image/png")),
        ]);

        const files = [
          new File([simpleBlob], "vibe-animal-simple.png", {
            type: "image/png",
          }),
          new File([detailedBlob], "vibe-animal-detailed.png", {
            type: "image/png",
          }),
        ];

        // Check if the browser can share these files
        if (navigator.canShare({ files })) {
          try {
            await navigator.share({
              title: "My Vibe Animal!",
              text: "Check out the animal that matches my vibe.",
              files: files,
            });
          } catch (err) {
            // Handle case where user cancels the share action
            if (err.name !== "AbortError") {
              console.error("Sharing failed:", err);
              setError(
                "Could not share the image. Please try downloading instead."
              );
            }
          }
        } else {
          // Fallback if sharing these specific files isn't supported
          setError("Your browser doesn't support sharing these files.");
        }
      } else {
        // Desktop Path: Download the simplified image only
        const link = document.createElement("a");
        link.download = `vibe-animal-simple-${Date.now()}.png`;
        link.href = simpleCanvas.toDataURL("image/png");
        link.click();
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
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <div className="preview-overlay">
                  <p>Click to change image</p>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <h3>Upload Your Image</h3>
                <p>Drag and drop an image here, or use the buttons below</p>
                <p className="file-types">Supports: JPG, PNG, GIF, BMP</p>
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
          {/* Inputs remain hidden */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
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
                // CHANGE: Call the new function
                onClick={shareOrDownloadResult}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "💾 Save & Share"}
              </button>
              <p className="save-hint">
                Save your result as a beautiful square image to share on social
                media!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ... (Confetti, Footer, and PaymentPopup components remain the same) */}
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
        <p>Powered by https://yeokim5.github.io/</p>
      </footer>
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default App;
