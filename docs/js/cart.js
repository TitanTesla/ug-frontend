document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  const cartCountElement = document.getElementById("cart-count");
  const checkoutForm = document.getElementById("checkout-form");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) cartCountElement.textContent = total;
  }

  function updateCartDisplay() {
    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      cartTotalElement.textContent = "$0";
      updateCartCount();
      return;
    }

    cart.forEach((item, index) => {
      total += item.price * item.quantity;

      const itemEl = document.createElement("div");
      itemEl.className = "cart-item";

      itemEl.innerHTML = `
        <div class="image-box">
          <img src="http://localhost:3000${item.image}" alt="${item.name}" />
        </div>
        <div class="item-info">
          <p>${item.name}</p>
          <span>$${item.price}</span>
        </div>
        <p class="qty">| ${item.quantity}</p>
        <button class="remove" data-index="${index}">-</button>
      `;

      cartItemsContainer.appendChild(itemEl);
    });

    cartTotalElement.textContent = `$${total}`;
    updateCartCount();
    attachRemoveEvents();
  }

  function attachRemoveEvents() {
    const removeButtons = document.querySelectorAll(".remove");

    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.getAttribute("data-index"));
        const removedItem = cart[index];

        removedItem.quantity -= 1;

        if (removedItem.quantity <= 0) {
          cart.splice(index, 1);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));

        updateCartDisplay();
      });
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = checkoutForm.name.value.trim();
      const email = checkoutForm.email.value.trim();
      const password = checkoutForm.password.value.trim();
      const location = checkoutForm.querySelector("select")?.value;
      const gender = checkoutForm.querySelector(
        "input[name='gender']:checked"
      )?.value;
      const consent = checkoutForm.querySelector(
        "input[name='consent']:checked"
      )?.value;

      if (
        !name ||
        !email ||
        !password ||
        !location ||
        !gender ||
        !consent ||
        cart.length === 0
      ) {
        alert("All fields are required and cart must have items.");
        return;
      }

      const payload = {
        name,
        email,
        password,
        consent,
        cart,
      };

      if (consent === "Yes") {
        payload.location = location;
        payload.gender = gender;
      }

      try {
        const response = await fetch("http://localhost:3000/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          alert("Checkout successful!");
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("storage"));
          cart = [];
          updateCartDisplay();
          checkoutForm.reset();
        } else {
          alert(result.message || "Checkout failed.");
        }
      } catch (err) {
        console.error("Checkout error:", err);
        alert("Something went wrong. Try again.");
      }
    });
  }

  updateCartDisplay();
});
