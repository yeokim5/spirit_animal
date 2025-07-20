import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import "./PaymentPopup.css";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

const PaymentForm = ({ onSuccess, onCancel, isLoading, setIsLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent on the backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 99, // 99 cents
          currency: "usd",
          product_id: import.meta.env.VITE_STRIPE_CREDIT_PRODUCT_ID,
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

      if (paymentError) {
        setError(paymentError.message);
      } else if (paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-header">
        <h2>🔒 Payment Required</h2>
        <p>
          To unlock this feature and support our website, please consider a
          small contribution of <strong>99 cents.</strong>
        </p>
      </div>

      <div className="payment-details">
        <div className="amount-display">
          <span className="amount">$0.99</span>
          <span className="currency">USD</span>
        </div>
        <p className="payment-description">
          One-time payment to find your VIBE ANIMAL
        </p>
      </div>

      <div className="card-element-container">
        <label>Credit or Debit Card</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
            disableLink: true,
          }}
        />
      </div>

      {error && (
        <div className="payment-error">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="payment-buttons">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || isLoading}
        >
          {isLoading ? "Processing..." : "Pay $0.99"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>

      <div className="payment-security">
        <p>Your payment is secure and encrypted by Stripe</p>
      </div>
    </form>
  );
};

const PaymentPopup = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="payment-popup-overlay" onClick={onClose}>
      <div className="payment-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>

        <Elements stripe={stripePromise}>
          <PaymentForm
            onSuccess={onSuccess}
            onCancel={onClose}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentPopup;
