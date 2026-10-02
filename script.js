var RAZORPAY_KEY_ID = "rzp_test_TEp8zhyxriqYwA";

(function () {
  "use strict";

  var selectedAmount = 50;
  var amountButtons = document.querySelectorAll(".amount-btn");
  var customAmount = document.getElementById("customAmount");
  var displayAmount = document.getElementById("displayAmount");
  var paymentForm = document.getElementById("paymentForm");
  var nameInput = document.getElementById("name");
  var noteInput = document.getElementById("note");
  var payBtn = document.getElementById("payBtn");
  var statusBox = document.getElementById("status");
  var menuBtn = document.getElementById("menuBtn");
  var mobileMenu = document.getElementById("mobileMenu");

  function formatAmount(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
  }

  function setStatus(message, type) {
    statusBox.textContent = message || "";
    statusBox.className = "status" + (type ? " " + type : "");
  }

  function setAmount(amount) {
    var numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) numericAmount = 50;
    numericAmount = Math.floor(numericAmount);
    if (numericAmount < 1) numericAmount = 1;
    if (numericAmount > 100000) numericAmount = 100000;

    selectedAmount = numericAmount;
    displayAmount.value = formatAmount(selectedAmount);
    payBtn.textContent = "💳 Pay " + formatAmount(selectedAmount) + " with Razorpay";

    amountButtons.forEach(function (button) {
      button.classList.toggle(
        "active",
        Number(button.dataset.amount) === selectedAmount &&
        customAmount.value.trim() === ""
      );
    });
  }

  amountButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      customAmount.value = "";
      setAmount(Number(button.dataset.amount));
      setStatus("", "");
    });
  });

  customAmount.addEventListener("input", function () {
    var value = customAmount.value.trim();
    amountButtons.forEach(function (button) { button.classList.remove("active"); });

    if (value === "") {
      setAmount(50);
      return;
    }

    var numericValue = Number(value);
    if (Number.isFinite(numericValue)) setAmount(numericValue);
    setStatus("", "");
  });

  menuBtn.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!menuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
      mobileMenu.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    }
  });

  document.querySelectorAll(".mobile-menu a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    });
  });

  paymentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var name = nameInput.value.trim();
    var note = noteInput.value.trim();

    if (name.length < 2) {
      setStatus("Please enter a valid name or gamertag.", "error");
      nameInput.focus();
      return;
    }

    if (selectedAmount < 1 || selectedAmount > 100000) {
      setStatus("Amount must be between ₹1 and ₹1,00,000.", "error");
      return;
    }

    if (!window.Razorpay) {
      setStatus("Razorpay Checkout could not be loaded. Please refresh and try again.", "error");
      return;
    }

    payBtn.disabled = true;
    setStatus("Creating secure payment order...", "info");

    try {
      var response = await fetch("/api/create-order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount: selectedAmount, name: name, note: note})
      });

      var data = await response.json().catch(function () { return {}; });

      if (!response.ok || !data.success || !data.order || !data.order.id) {
        throw new Error(data.error || "Unable to create the payment order.");
      }

      var options = {
        key: RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "LORD ZORO",
        description: "LORD ZORO Support",
        order_id: data.order.id,
        prefill: {name: name},
        notes: {support_name: name, support_note: note || "LORD ZORO support"},
        theme: {color: "#a855f7"},
        modal: {
          ondismiss: function () {
            payBtn.disabled = false;
            setStatus("Payment window closed.", "info");
          }
        },
        handler: function (paymentResponse) {
          payBtn.disabled = false;
          var paymentId = paymentResponse.razorpay_payment_id || "Unavailable";
          setStatus("Payment successful. Payment ID: " + paymentId, "success");
          alert("Payment successful!\n\nPayment ID: " + paymentId);
        }
      };

      var razorpay = new Razorpay(options);

      razorpay.on("payment.failed", function (failureResponse) {
        payBtn.disabled = false;
        var reason = failureResponse && failureResponse.error && failureResponse.error.description
          ? failureResponse.error.description
          : "Payment failed or was cancelled.";
        setStatus(reason, "error");
      });

      setStatus("Opening Razorpay checkout...", "info");
      razorpay.open();
    } catch (error) {
      payBtn.disabled = false;
      setStatus(error && error.message ? error.message : "Something went wrong. Please try again.", "error");
    }
  });

  setAmount(50);
})();
