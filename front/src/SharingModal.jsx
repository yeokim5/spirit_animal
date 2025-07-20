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

  const downloadImage = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `vibe-animal-${animalName
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showFeedback("✅ Image downloaded successfully!");
    } catch (error) {
      showFeedback("❌ Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    setIsCopying(true);
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
        // Fallback: copy text
        const text = `I got ${animalName} ${confettiEmoji}!  Discover your vibe animal at https://vibe-animal.vercel.app/`;
        await navigator.clipboard.writeText(text);
        showFeedback("✅ Share text copied to clipboard!");
      }
    } catch (error) {
      showFeedback("❌ Copy failed. Try downloading instead.");
    } finally {
      setIsCopying(false);
    }
  };

  const shareViaWebAPI = async () => {
    try {
      if (navigator.canShare && window.ClipboardItem) {
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `vibe-animal-${animalName}.png`, {
            type: "image/png",
          });
          const shareData = {
            title: "My Vibe Animal Result",
            text: `My vibe animal is ${animalName} ${confettiEmoji}! Discover your vibe animal too!`,
            url: "https://vibe-animal.vercel.app/",
            files: [file],
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            showFeedback("✅ Shared successfully!");
          } else {
            showFeedback(
              "❌ Sharing image not supported on this device/browser."
            );
          }
        }, "image/png");
      } else if (navigator.share) {
        // Fallback: share only text and url
        const text = `My vibe animal is ${animalName} ${confettiEmoji}! Discover your vibe animal too!`;
        await navigator.share({
          title: "My Vibe Animal Result",
          text: text,
          url: "https://vibe-animal.vercel.app/",
        });
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
          </div>

          <div className="sharing-options">
            {navigator.share && (
              <button className="share-btn primary" onClick={shareViaWebAPI}>
                Share
              </button>
            )}

            {/* <button
              className="share-btn secondary"
              onClick={copyToClipboard}
              disabled={isCopying}
            >
              {isCopying ? "⏳ Copying..." : "📋 Copy Image"}
            </button>

            <button
              className="share-btn secondary"
              onClick={downloadImage}
              disabled={isDownloading}
            >
              {isDownloading ? "⏳ Downloading..." : "💾 Download Image"}
            </button> */}
          </div>

          {feedback && <div className="feedback-message">{feedback}</div>}
          {/* 
          <div className="share-instructions">
            <p>
              <strong>How to share:</strong>
            </p>
            <ul>
              <li>
                📱 <strong>Share Link:</strong> Opens your device's share menu
              </li>
              <li>
                📋 <strong>Copy:</strong> Copies image to paste in messages
              </li>
              <li>
                💾 <strong>Download:</strong> Saves image to your device
              </li>
            </ul>
          </div> */}
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
        }
      `}</style>
    </div>
  );
};

export default SharingModal;
