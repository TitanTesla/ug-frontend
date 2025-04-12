document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = 'https://ug-backend-wkk1.onrender.com';
  const searchInput = document.querySelector('#search-form input[type="search"]');
  const cartCountElement = document.getElementById("cart-count");
  const sections = {
    Unisex: document.querySelector("#unisex-collection-header + .product-grid"),
    Men: document.querySelector("#Men-grooming-header + .product-grid"),
    Women: document.querySelector("#Women-beauty + .product-grid"),
  };

  let allProducts = [];

  async function fetchProducts() {
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  function showToast(message) {
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #222;
      color: white;
      padding: 8px 16px;
      border-radius: 5px;
      opacity: 0.9;
      z-index: 9999;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function renderFilteredProducts(products) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Update cart count
    cartCountElement.textContent = cart.reduce((sum, p) => sum + p.quantity, 0);

    // Clear sections
    Object.values(sections).forEach(grid => grid.innerHTML = "");

    products.forEach(item => {
      const product = document.createElement("div");
      product.className = "product";

      product.innerHTML = `
        <div class="product-image" style="background-image: url('${BASE_URL}${item.image}'); background-size: cover;"></div>        <h3>${item.name}</h3>
        <p>$${item.price}</p>
        <p class="availability">Availability: ${item.quantity}</p>
        <button>Add to cart</button>
      `;

      const section = sections[item.category] || sections.Unisex;
      section.appendChild(product);

      const button = product.querySelector("button");
      const availabilityText = product.querySelector(".availability");

      const inCart = cart.find(p => p.name === item.name)?.quantity || 0;
      let availableQty = item.quantity - inCart;
      availabilityText.textContent = `Availability: ${availableQty}`;

      if (availableQty <= 0) {
        button.disabled = true;
        button.classList.add("disabled-button");
      }

      button.addEventListener("click", () => {
        if (availableQty <= 0) return;

        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItem = cart.find(p => p.name === item.name);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            id: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
            category: item.category // ✅ new
          });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("storage"));
        showToast(`${item.name} added to cart`);
      });
    });
  }

  function applyLiveSearch() {
    const query = searchInput.value.toLowerCase();
    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(query)
    );
    renderFilteredProducts(filtered);
  }

  window.addEventListener("storage", () => renderFilteredProducts(allProducts));

  (async () => {
    allProducts = await fetchProducts();
    renderFilteredProducts(allProducts);
    searchInput.addEventListener("input", applyLiveSearch);
  })();
});
