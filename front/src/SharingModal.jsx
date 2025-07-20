import React, { useState } from "react";

const SharingModal = ({
  isOpen,
  onClose,
  canvas,
  animalName,
  confettiEmoji,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (!isOpen) return null;

  const showFeedback = (message, duration = 3000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), duration);
  };

  // Detect if user is on mobile
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const downloadImage = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `vibe-animal-${animalName
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");

      // For mobile, we need to handle this differently
      if (isMobile) {
        // On mobile, open the image in a new tab so user can save it
        const newWindow = window.open();
        newWindow.document.write(`
          <html>
            <head>
              <title>Save Your Vibe Animal</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; text-align: center; }
                img { max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .instructions { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h2 { color: #333; margin-bottom: 10px; }
                p { color: #666; line-height: 1.5; }
              </style>
            </head>
            <body>
              <h2>Your Vibe Animal Result</h2>
              <img src="${canvas.toDataURL(
                "image/png"
              )}" alt="Vibe Animal Result" />
              <div class="instructions">
                <p><strong>To save this image:</strong></p>
                <p>📱 <strong>iPhone/iPad:</strong> Tap and hold the image → "Save to Photos"</p>
                <p>🤖 <strong>Android:</strong> Tap and hold the image → "Download image"</p>
              </div>
            </body>
          </html>
        `);
        showFeedback("📱 Image opened in new tab. Tap and hold to save!");
      } else {
        // Desktop download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback("✅ Image downloaded successfully!");
      }
    } catch (error) {
      showFeedback("❌ Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    setIsCopying(true);
    try {
      // For mobile, prioritize copying text since image clipboard is unreliable
      if (isMobile) {
        const text = `I got ${animalName}! ${confettiEmoji} Discover your vibe animal at https://vibe-animal.vercel.app/`;
        await navigator.clipboard.writeText(text);
        showFeedback("✅ Share text copied! Paste it anywhere to share.");
      } else {
        // Desktop: try to copy image first, fallback to text
        try {
          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png", 0.9)
          );

          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            showFeedback("✅ Image copied to clipboard!");
          } else {
            throw new Error("Clipboard API not supported");
          }
        } catch (clipboardError) {
          // Fallback to text
          const text = `I got ${animalName}! ${confettiEmoji} Discover your vibe animal at https://vibe-animal.vercel.app/`;
          await navigator.clipboard.writeText(text);
          showFeedback("✅ Share text copied to clipboard!");
        }
      }
    } catch (error) {
      showFeedback("❌ Copy failed. Try the share button instead.");
    } finally {
      setIsCopying(false);
    }
  };

  const shareViaWebAPI = async () => {
    try {
      if (navigator.share) {
        const shareData = {
          title: "My Vibe Animal Result",
          text: `I got ${animalName}! ${confettiEmoji} Discover your vibe animal:`,
          url: "https://vibe-animal.vercel.app/",
        };

        // On mobile, try to share with image if supported
        if (isMobile && navigator.canShare) {
          try {
            const blob = await new Promise((resolve) =>
              canvas.toBlob(resolve, "image/png", 0.9)
            );

            const file = new File(
              [blob],
              `vibe-animal-${animalName
                .toLowerCase()
                .replace(/\s+/g, "-")}.png`,
              { type: "image/png" }
            );

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                ...shareData,
                files: [file],
              });
              showFeedback("✅ Shared successfully!");
              return;
            }
          } catch (fileShareError) {
            console.log(
              "File sharing not supported, falling back to URL sharing"
            );
          }
        }

        // Fallback to URL sharing
        await navigator.share(shareData);
        showFeedback("✅ Shared successfully!");
      } else {
        showFeedback("❌ Sharing not supported on this browser.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showFeedback("❌ Sharing failed. Try copy or download instead.");
      }
    }
  };

  // Function to share to specific social media (for mobile)
  const shareToSocial = (platform) => {
    const text = encodeURIComponent(
      `I got ${animalName}! ${confettiEmoji} Discover your vibe animal:`
    );
    const url = encodeURIComponent("https://vibe-animal.vercel.app/");

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    showFeedback("✅ Opened sharing page!");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sharing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Your Result</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="result-preview">
            <canvas
              ref={(ref) => {
                if (ref && canvas) {
                  const ctx = ref.getContext("2d");
                  ref.width = canvas.width / 4;
                  ref.height = canvas.height / 4;
                  ctx.drawImage(canvas, 0, 0, ref.width, ref.height);
                }
              }}
              className="preview-canvas"
            />
            <p className="result-text">
              {confettiEmoji} {animalName} {confettiEmoji}
            </p>
          </div>

          <div className="sharing-options">
            {navigator.share && (
              <button className="share-btn primary" onClick={shareViaWebAPI}>
                📱 Share
              </button>
            )}

            <button
              className="share-btn secondary"
              onClick={copyToClipboard}
              disabled={isCopying}
            >
              {isCopying
                ? "⏳ Copying..."
                : isMobile
                ? "📋 Copy Text"
                : "📋 Copy Image"}
            </button>

            <button
              className="share-btn secondary"
              onClick={downloadImage}
              disabled={isDownloading}
            >
              {isDownloading
                ? "⏳ Processing..."
                : isMobile
                ? "📱 Save Image"
                : "💾 Download Image"}
            </button>

            {isMobile && (
              <div className="social-sharing">
                <p className="social-title">Or share directly:</p>
                <div className="social-buttons">
                  <button
                    className="social-btn whatsapp"
                    onClick={() => shareToSocial("whatsapp")}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    className="social-btn twitter"
                    onClick={() => shareToSocial("twitter")}
                  >
                    🐦 Twitter
                  </button>
                  <button
                    className="social-btn facebook"
                    onClick={() => shareToSocial("facebook")}
                  >
                    📘 Facebook
                  </button>
                </div>
              </div>
            )}
          </div>

          {feedback && <div className="feedback-message">{feedback}</div>}

          <div className="share-instructions">
            <p>
              <strong>How to share:</strong>
            </p>
            <ul>
              {navigator.share && (
                <li>
                  📱 <strong>Share:</strong> Opens your device's share menu
                </li>
              )}
              <li>
                📋 <strong>Copy:</strong>{" "}
                {isMobile
                  ? "Copies text to paste in messages"
                  : "Copies image or text to clipboard"}
              </li>
              <li>
                {isMobile ? "📱" : "💾"}{" "}
                <strong>{isMobile ? "Save Image" : "Download"}:</strong>{" "}
                {isMobile
                  ? "Opens image in new tab - tap and hold to save"
                  : "Downloads image to your computer"}
              </li>
              {isMobile && (
                <li>
                  💬 <strong>Direct Share:</strong> Share to WhatsApp, Twitter,
                  or Facebook
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .sharing-modal {
          background: white;
          border-radius: 15px;
          max-width: 400px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          color: #666;
        }

        .modal-content {
          padding: 20px;
        }

        .result-preview {
          text-align: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .preview-canvas {
          max-width: 200px;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .result-text {
          margin: 10px 0 0 0;
          font-size: 1.2em;
          font-weight: bold;
          color: #333;
        }

        .sharing-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .share-btn {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .share-btn.primary {
          background: #667eea;
          color: white;
        }

        .share-btn.primary:hover {
          background: #5a6fd8;
        }

        .share-btn.secondary {
          background: #f1f3f4;
          color: #333;
          border: 1px solid #ddd;
        }

        .share-btn.secondary:hover {
          background: #e8eaed;
        }

        .share-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .social-sharing {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .social-title {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-align: center;
        }

        .social-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .social-btn {
          padding: 10px 8px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .social-btn.whatsapp {
          background: #25d366;
          color: white;
        }

        .social-btn.whatsapp:hover {
          background: #22c55e;
        }

        .social-btn.twitter {
          background: #1da1f2;
          color: white;
        }

        .social-btn.twitter:hover {
          background: #1991db;
        }

        .social-btn.facebook {
          background: #1877f2;
          color: white;
        }

        .social-btn.facebook:hover {
          background: #166fe5;
        }

        .feedback-message {
          text-align: center;
          padding: 10px;
          margin: 10px 0;
          border-radius: 6px;
          background: #e8f5e8;
          border: 1px solid #4caf50;
          color: #2e7d32;
          font-weight: 500;
        }

        .share-instructions {
          font-size: 14px;
          color: #666;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }

        .share-instructions strong {
          color: #333;
        }

        .share-instructions ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .share-instructions li {
          margin-bottom: 5px;
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 10px;
          }

          .sharing-modal {
            max-height: 95vh;
          }

          .modal-header,
          .modal-content {
            padding: 15px;
          }

          .social-buttons {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .social-btn {
            padding: 12px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default SharingModal;
