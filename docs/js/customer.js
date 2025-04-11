// === DOM References ===
const searchInput = document.querySelector('#search-form input[type="search"]');
const sortForm = document.getElementById("sort-form");
const sortBy = document.getElementById("Filter");
const cartCountElement = document.getElementById("cart-count");
const productElements = document.querySelectorAll(".product");

// === Load Local Storage Data ===
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// === Update Cart Count in Header ===
let cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
cartCountElement.textContent = cartCount;

// === Loop through Products ===
productElements.forEach((product) => {
  const addButton = product.querySelector("button");
  const name = product.querySelector("h3").textContent;
  const price = parseFloat(product.querySelector("p:first-of-type").textContent.replace("$", ""));
  const availabilityText = product.querySelector("p:nth-of-type(2)");

  // Add to Cart
  addButton.addEventListener("click", () => {
    let availability = parseInt(availabilityText.textContent.split(": ")[1]);

    if (availability > 0) {
      availability--;
      availabilityText.textContent = `Availability: ${availability}`;
      cartCount++;
      cartCountElement.textContent = cartCount;

      const existing = cart.find(item => item.name === name);

      // Extract background image style
      const bgImage = product.querySelector(".product-image").style.backgroundImage;
      const image = bgImage.replace('url("', "").replace('")', "");

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ name, price, quantity: 1, image });
      }

      localStorage.setItem("cart", JSON.stringify(cart));

      if (availability === 0) {
        addButton.disabled = true;
        addButton.classList.add("disabled-button");
      }
    }
  });
});

// === Redirect to cart.html when cart icon is clicked ===
document.getElementById("cart-icon").addEventListener("click", () => {
  window.location.href = "cart.html";
});

// === Helper: Extract Sort Value from DOM ===
function getSortValue(product, type) {
  const value = product.querySelector(type === "price" ? "p:first-of-type" : "p:nth-of-type(2)");
  return parseFloat(value.textContent.replace(/[^0-9]/g, ""));
}

// === Sort Products by Selected Option ===
function sortProducts(order = "ascending") {
  const type = sortBy.value;
  const containers = document.querySelectorAll(".product-grid");

  containers.forEach((grid) => {
    const products = Array.from(grid.children);

    products.sort((a, b) => {
      const valA = getSortValue(a, type);
      const valB = getSortValue(b, type);
      return order === "ascending" ? valA - valB : valB - valA;
    });

    // Reorder in DOM
    products.forEach((p) => grid.appendChild(p));
  });
}

// === Sort Form Event Listener ===
sortForm.addEventListener("change", () => {
  const sortOrder = document.getElementById("ascending").checked ? "ascending" : "descending";
  sortProducts(sortOrder);
});