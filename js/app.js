/**
 * HomeKart SPA Core Application Script
 * Handles state management, local storage persistence, routing, 
 * search, filters, and rendering of all views dynamically.
 */

// Global state
const state = {
  cart: [],      // Array of { id, quantity }
  wishlist: [],  // Array of productIds
  user: null,    // { name, email, phone, addresses: [], orders: [] }
  activeCategory: 'all',
  currentHeroSlide: 0
};

// Initialize State from LocalStorage
function initStore() {
  const localCart = localStorage.getItem('homekart_cart');
  const localWishlist = localStorage.getItem('homekart_wishlist');
  const localUser = localStorage.getItem('homekart_user');

  if (localCart) state.cart = JSON.parse(localCart);
  if (localWishlist) state.wishlist = JSON.parse(localWishlist);
  
  if (localUser) {
    state.user = JSON.parse(localUser);
  } else {
    // Default guest order history if any
    state.user = null;
  }
  
  updateHeaderBadges();
}

// Sync cart to local storage
function saveCart() {
  localStorage.setItem('homekart_cart', JSON.stringify(state.cart));
  updateHeaderBadges();
}

// Sync wishlist to local storage
function saveWishlist() {
  localStorage.setItem('homekart_wishlist', JSON.stringify(state.wishlist));
  updateHeaderBadges();
}

// Sync user to local storage
function saveUser() {
  if (state.user) {
    localStorage.setItem('homekart_user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('homekart_user');
  }
  updateHeaderBadges();
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon based on type
  let icon = '';
  if (type === 'success') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slideInLeft 0.3s ease reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Update badges in header
function updateHeaderBadges() {
  const cartBadge = document.getElementById('cart-badge');
  const wishlistBadge = document.getElementById('wishlist-badge');
  const authNavBtn = document.getElementById('auth-nav-btn');

  // Count items
  const cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  cartBadge.textContent = cartCount;
  wishlistBadge.textContent = state.wishlist.length;

  // Login Button state
  if (state.user) {
    authNavBtn.textContent = `Hi, ${state.user.name.split(' ')[0]}`;
    authNavBtn.className = "nav-btn nav-btn-login";
    authNavBtn.style.backgroundColor = "var(--secondary-color)";
    authNavBtn.style.color = "var(--text-dark)";
    
    // Clicking profile will navigate to profile page
    authNavBtn.onclick = () => {
      window.location.hash = '#/profile';
    };
  } else {
    authNavBtn.textContent = "Login";
    authNavBtn.className = "nav-btn nav-btn-login";
    authNavBtn.style.backgroundColor = "#ffffff";
    authNavBtn.style.color = "var(--primary-color)";
    authNavBtn.onclick = () => {
      toggleAuthModal(true);
    };
  }
}

// ==========================================================================
// SPA Router
// ==========================================================================
function parseHash() {
  const hash = window.location.hash || '#/';
  
  // Split hash into path and query
  const parts = hash.split('?');
  const path = parts[0];
  const queryStr = parts[1] || '';
  
  // Parse query params
  const query = {};
  if (queryStr) {
    queryStr.split('&').forEach(param => {
      const [key, val] = param.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }

  // Parse path segments
  const pathSegments = path.replace(/^#\//, '').split('/');
  
  return {
    path: path,
    route: '/' + pathSegments[0],
    param: pathSegments[1] || null,
    query: query
  };
}

function router() {
  const parsed = parseHash();
  const contentDiv = document.getElementById('app-content');
  
  // Scroll to top on navigation
  window.scrollTo(0, 0);
  
  // Add class for fade-in transition
  contentDiv.classList.remove('page-fade-in');
  void contentDiv.offsetWidth; // Trigger reflow
  contentDiv.classList.add('page-fade-in');

  // Close mobile navigation drawer if open
  document.getElementById('nav-actions').classList.remove('active');

  // Route matching
  switch (parsed.route) {
    case '/':
    case '/home':
      renderHomeView(contentDiv);
      break;
    case '/products':
      renderProductsView(contentDiv, parsed.query);
      break;
    case '/product':
      if (parsed.param) {
        renderProductDetailsView(contentDiv, parsed.param);
      } else {
        window.location.hash = '#/products';
      }
      break;
    case '/cart':
      renderCartView(contentDiv);
      break;
    case '/wishlist':
      renderWishlistView(contentDiv);
      break;
    case '/checkout':
      renderCheckoutView(contentDiv);
      break;
    case '/profile':
      renderProfileView(contentDiv);
      break;
    case '/about':
      renderAboutView(contentDiv);
      break;
    case '/contact':
      renderContactView(contentDiv);
      break;
    default:
      // Page Not Found: redirect home
      window.location.hash = '#/';
  }

  // Highlight active category ribbon item
  updateCategoryRibbonSelection(parsed);
}

// Update the ribbon UI styling depending on route
function updateCategoryRibbonSelection(parsed) {
  const ribbonItems = document.querySelectorAll('.ribbon-item');
  ribbonItems.forEach(item => {
    item.classList.remove('active');
    
    const itemCat = item.getAttribute('data-category');
    if (parsed.route === '/products') {
      const activeCat = parsed.query.category || 'all';
      if (itemCat === activeCat) {
        item.querySelector('.ribbon-icon-wrapper').style.backgroundColor = 'var(--secondary-color)';
        item.querySelector('.ribbon-icon-wrapper').style.color = 'var(--text-dark)';
      } else {
        item.querySelector('.ribbon-icon-wrapper').style.backgroundColor = '';
        item.querySelector('.ribbon-icon-wrapper').style.color = '';
      }
    } else if (parsed.route === '/' || parsed.route === '/home') {
      if (itemCat === 'all') {
        item.querySelector('.ribbon-icon-wrapper').style.backgroundColor = 'var(--secondary-color)';
        item.querySelector('.ribbon-icon-wrapper').style.color = 'var(--text-dark)';
      } else {
        item.querySelector('.ribbon-icon-wrapper').style.backgroundColor = '';
        item.querySelector('.ribbon-icon-wrapper').style.color = '';
      }
    } else {
      item.querySelector('.ribbon-icon-wrapper').style.backgroundColor = '';
      item.querySelector('.ribbon-icon-wrapper').style.color = '';
    }
  });
}

// Category ribbon navigation click handler
document.getElementById('category-ribbon-container').addEventListener('click', (e) => {
  const ribbonItem = e.target.closest('.ribbon-item');
  if (!ribbonItem) return;
  
  const category = ribbonItem.getAttribute('data-category');
  if (category === 'all') {
    window.location.hash = '#/products';
  } else {
    window.location.hash = `#/products?category=${category}`;
  }
});

// Logo Home navigation
document.getElementById('header-logo').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.hash = '#/';
});

// Header Search Logic
const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('search-suggestions');

searchInput.addEventListener('input', () => {
  const value = searchInput.value.trim().toLowerCase();
  if (!value) {
    suggestionsBox.style.display = 'none';
    return;
  }

  // Filter products by search match
  const matches = window.productsData.filter(product => 
    product.name.toLowerCase().includes(value) || 
    product.category.toLowerCase().includes(value) ||
    product.tagline.toLowerCase().includes(value)
  ).slice(0, 5); // Limit 5

  if (matches.length === 0) {
    suggestionsBox.innerHTML = `
      <div class="suggestion-item" style="cursor: default; color: var(--text-muted);">
        No matching homemade items found
      </div>
    `;
  } else {
    suggestionsBox.innerHTML = matches.map(prod => `
      <div class="suggestion-item" data-id="${prod.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span>${prod.name} <small style="color:var(--text-muted)">in ${prod.category}</small></span>
      </div>
    `).join('');
  }
  suggestionsBox.style.display = 'block';
});

suggestionsBox.addEventListener('click', (e) => {
  const item = e.target.closest('.suggestion-item');
  if (!item) return;
  
  const id = item.getAttribute('data-id');
  if (id) {
    window.location.hash = `#/product/${id}`;
    searchInput.value = '';
    suggestionsBox.style.display = 'none';
  }
});

// Close suggestions on clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    suggestionsBox.style.display = 'none';
  }
});

// Search input keypress Enter
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const value = searchInput.value.trim();
    if (value) {
      window.location.hash = `#/products?search=${encodeURIComponent(value)}`;
      searchInput.value = '';
      suggestionsBox.style.display = 'none';
    }
  }
});

// Search Icon Click
document.getElementById('search-btn').addEventListener('click', () => {
  const value = searchInput.value.trim();
  if (value) {
    window.location.hash = `#/products?search=${encodeURIComponent(value)}`;
    searchInput.value = '';
    suggestionsBox.style.display = 'none';
  }
});

// Hamburger menu toggle for mobile
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav-actions').classList.toggle('active');
});

// ==========================================================================
// E-Commerce Core Cart/Wishlist actions helper
// ==========================================================================
function addToCart(productId, quantity = 1, silent = false) {
  const existing = state.cart.find(item => item.id === productId);
  const product = window.productsData.find(p => p.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ id: productId, quantity: quantity });
  }

  saveCart();
  if (!silent && product) {
    showToast(`Added ${product.name} to Cart!`);
  }
  // Refresh current view if necessary (for details page or listing button swaps)
  router();
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(item => item.id !== productId);
    showToast("Item removed from Cart");
  }

  saveCart();
  router();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  showToast("Item removed from Cart");
  router();
}

function toggleWishlist(productId) {
  const index = state.wishlist.indexOf(productId);
  const product = window.productsData.find(p => p.id === productId);

  if (index >= 0) {
    state.wishlist.splice(index, 1);
    if (product) showToast(`Removed ${product.name} from Wishlist`);
  } else {
    state.wishlist.push(productId);
    if (product) showToast(`Added ${product.name} to Wishlist`);
  }

  saveWishlist();
  router();
}

// ==========================================================================
// VIEW RENDERERS
// ==========================================================================

/* --------------------------------------------------------------------------
   1. Home View
   -------------------------------------------------------------------------- */
function renderHomeView(container) {
  const featured = window.productsData.filter(p => p.isFeatured).slice(0, 4);
  const sweets = window.productsData.filter(p => p.category === 'sweets').slice(0, 4);
  const pickles = window.productsData.filter(p => p.category === 'pickles').slice(0, 4);

  let html = `
    <!-- Hero Slider -->
    <div class="container">
      <div class="hero-slider-wrapper">
        <div class="hero-slider" id="hero-slider">
          <!-- Slide 1 -->
          <div class="slide" style="background-image: url('assets/hero_banner.png');">
            <div class="slide-content">
              <h2>Traditional Handcrafted Indian Delicacies</h2>
              <p>Authentic pickles, hand-rolled ghee sweets, and stone-ground spices made with love by local home cooks.</p>
              <a href="#/products" class="slide-btn">Explore Range</a>
            </div>
          </div>
          <!-- Slide 2 -->
          <div class="slide" style="background-image: url('https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=1200');">
            <div class="slide-content">
              <h2>Stone-Ground Aromatic Spices</h2>
              <p>Handpicked whole spices slowly dry-cooked and stone-ground to preserve deep flavors and oils.</p>
              <a href="#/products?category=spices" class="slide-btn">Shop Spices</a>
            </div>
          </div>
          <!-- Slide 3 -->
          <div class="slide" style="background-image: url('https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=1200');">
            <div class="slide-content">
              <h2>Grandmother's Ghee Sweets</h2>
              <p>Prepared in small batches using A2 organic cow ghee and natural unrefined sugar (bura).</p>
              <a href="#/products?category=sweets" class="slide-btn">Indulge Now</a>
            </div>
          </div>
        </div>
        
        <!-- Controls -->
        <button class="slider-control prev" id="slider-prev">&lt;</button>
        <button class="slider-control next" id="slider-next">&gt;</button>
        
        <!-- Dots -->
        <div class="slider-dots" id="slider-dots">
          <div class="dot active" data-index="0"></div>
          <div class="dot" data-index="1"></div>
          <div class="dot" data-index="2"></div>
        </div>
      </div>
    </div>

    <!-- Feature highlights ribbon -->
    <div class="container section-wrapper">
      <div class="features-strip">
        <div class="feature-box">
          <div class="feature-icon">👵</div>
          <div class="feature-text">
            <h4>Traditional Recipes</h4>
            <p>Generation-old family culinary secrets</p>
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🍃</div>
          <div class="feature-text">
            <h4>100% Preservative Free</h4>
            <p>Zero artificial color, chemical or starch</p>
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🏺</div>
          <div class="feature-text">
            <h4>Small-Batch Fresh</h4>
            <p>Made fresh to order in home kitchens</p>
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🚚</div>
          <div class="feature-text">
            <h4>Fast Doorstep Shipping</h4>
            <p>Secure double-sealed shipping pan-India</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Products Section -->
    <div class="container section-wrapper">
      <div class="section-header">
        <div class="section-title-box">
          <h2>Featured Delicacies</h2>
          <p>Handpicked, high-rated customer favorites</p>
        </div>
        <a href="#/products" class="section-action">View All &rarr;</a>
      </div>
      <div class="products-grid">
        ${featured.map(prod => getProductCardHtml(prod)).join('')}
      </div>
    </div>

    <!-- Banner Promotion split -->
    <div class="container section-wrapper" style="margin: 48px auto;">
      <div class="story-block">
        <div class="story-text">
          <h3>The HomeKart Story</h3>
          <p>HomeKart is born out of a desire to connect talented local home cooks, mothers, and grandmothers with food lovers looking for pure, authentic delicacies. Standard commercial products often rely on massive factory machinery, cheap oils, and synthetic chemical shelf-extenders.</p>
          <p>We work directly with certified home kitchens. Every jar of pickle is cured under natural sunbeams, every spice is slow-roasted and ground, and every laddu is rolled by hand. When you buy from HomeKart, you buy a piece of culinary heritage and support a home cook's livelihood.</p>
          <a href="#/about" class="slide-btn" style="display:inline-block; margin-top: 10px;">Our Journey</a>
        </div>
        <div class="story-img-wrapper">
          <img src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600" alt="Homemade Sweets Preparation">
        </div>
      </div>
    </div>

    <!-- Sweet Delights section -->
    <div class="container section-wrapper">
      <div class="section-header">
        <div class="section-title-box">
          <h2>Pure Ghee Sweets & Ladoos</h2>
          <p>Authentic taste prepared with premium cardamoms and dry fruits</p>
        </div>
        <a href="#/products?category=sweets" class="section-action">View All &rarr;</a>
      </div>
      <div class="products-grid">
        ${sweets.map(prod => getProductCardHtml(prod)).join('')}
      </div>
    </div>

    <!-- Traditional Pickles section -->
    <div class="container section-wrapper">
      <div class="section-header">
        <div class="section-title-box">
          <h2>Sun-Cured Achar (Pickles)</h2>
          <p>Spicy, sour, and oil-free variants matured naturally in glass jars</p>
        </div>
        <a href="#/products?category=pickles" class="section-action">View All &rarr;</a>
      </div>
      <div class="products-grid">
        ${pickles.map(prod => getProductCardHtml(prod)).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
  
  // Initialize slider JS interactions
  initSlider();
}

function getProductCardHtml(product) {
  const isWishlisted = state.wishlist.includes(product.id);
  const cartItem = state.cart.find(item => item.id === product.id);
  
  return `
    <div class="product-card" data-product-id="${product.id}">
      <span class="discount-badge">${product.discount}% OFF</span>
      
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.preventDefault(); toggleWishlist('${product.id}')" aria-label="Toggle Wishlist">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      <a href="#/product/${product.id}" class="card-img-wrapper">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>

      <div class="card-body">
        <span class="card-category">${product.category}</span>
        <a href="#/product/${product.id}"><h3 class="card-title">${product.name}</h3></a>
        <div class="card-weight">${product.weight}</div>
        
        <div class="rating-row">
          <span class="star-rating">
            ${product.rating}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </span>
          <span class="reviews-count">(${product.reviewsCount})</span>
        </div>

        <div class="card-price-row">
          <span class="current-price">₹${product.price}</span>
          <span class="original-price">₹${product.originalPrice}</span>
          <span class="discount-pct">${product.discount}% off</span>
        </div>

        ${cartItem ? 
          `<button class="card-btn in-cart" onclick="event.preventDefault(); window.location.hash = '#/cart'">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
             Go to Cart
           </button>` : 
          `<button class="card-btn" onclick="event.preventDefault(); addToCart('${product.id}')">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
             Add to Cart
           </button>`
        }
      </div>
    </div>
  `;
}

// Hero Slider Functions
function initSlider() {
  const slider = document.getElementById('hero-slider');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const dots = document.querySelectorAll('.dot');
  
  if (!slider) return;
  
  let slideInterval = setInterval(nextSlide, 5000);
  
  function updateSlider() {
    slider.style.transform = `translateX(-${state.currentHeroSlide * 33.333}%)`;
    dots.forEach((dot, idx) => {
      if (idx === state.currentHeroSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  function nextSlide() {
    state.currentHeroSlide = (state.currentHeroSlide + 1) % 3;
    updateSlider();
  }
  
  function prevSlide() {
    state.currentHeroSlide = (state.currentHeroSlide - 1 + 3) % 3;
    updateSlider();
  }
  
  prevBtn.onclick = () => {
    clearInterval(slideInterval);
    prevSlide();
    slideInterval = setInterval(nextSlide, 5000);
  };
  
  nextBtn.onclick = () => {
    clearInterval(slideInterval);
    nextSlide();
    slideInterval = setInterval(nextSlide, 5000);
  };
  
  dots.forEach(dot => {
    dot.onclick = () => {
      clearInterval(slideInterval);
      state.currentHeroSlide = parseInt(dot.getAttribute('data-index'));
      updateSlider();
      slideInterval = setInterval(nextSlide, 5000);
    };
  });
}

/* --------------------------------------------------------------------------
   2. Products Listing View
   -------------------------------------------------------------------------- */
function renderProductsView(container, query) {
  // Query parameters
  const selectedCat = query.category || 'all';
  const searchQuery = query.search || '';
  
  // Filter products initially based on category/search
  let filteredProducts = [...window.productsData];
  
  if (selectedCat !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCat);
  }
  if (searchQuery) {
    const term = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term) || 
      p.tagline.toLowerCase().includes(term)
    );
  }

  // Generate category count statistics
  const catStats = { all: window.productsData.length };
  window.productsData.forEach(p => {
    catStats[p.category] = (catStats[p.category] || 0) + 1;
  });

  // Filter state trackers for sidebar
  let currentPriceMax = 500;
  let selectedRatings = [];
  let minDiscount = 0;
  let activeSort = 'popularity';

  function filterAndSortProducts() {
    let result = [...filteredProducts];
    
    // Price filter
    result = result.filter(p => p.price <= currentPriceMax);
    
    // Rating filters
    if (selectedRatings.length > 0) {
      result = result.filter(p => {
        const floorRating = Math.floor(p.rating);
        return selectedRatings.includes(floorRating);
      });
    }

    // Discount filter
    if (minDiscount > 0) {
      result = result.filter(p => p.discount >= minDiscount);
    }

    // Sort order
    if (activeSort === 'popularity') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (activeSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'discount_desc') {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }

  function renderGrid() {
    const list = filterAndSortProducts();
    const countElement = document.getElementById('matching-products-count');
    const gridContainer = document.getElementById('products-listing-grid');
    
    if (countElement) countElement.textContent = list.length;
    
    if (list.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-products-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h3>No Homemade Delicacies Match Your Filters</h3>
          <p>Try clearing your price, rating, or category filters to explore other items.</p>
          <button class="empty-reset-btn" id="empty-reset-btn">Clear All Filters</button>
        </div>
      `;
      const btn = document.getElementById('empty-reset-btn');
      if (btn) {
        btn.onclick = () => {
          resetAllFilters();
        };
      }
    } else {
      gridContainer.innerHTML = list.map(prod => getProductCardHtml(prod)).join('');
    }
  }

  function resetAllFilters() {
    currentPriceMax = 500;
    selectedRatings = [];
    minDiscount = 0;
    activeSort = 'popularity';
    
    // Reset Sidebar UI values
    const priceSlider = document.getElementById('price-slider');
    const priceMaxVal = document.getElementById('price-max-val');
    const ratingCheckboxes = document.querySelectorAll('.rating-filter-checkbox');
    const discountCheckboxes = document.querySelectorAll('.discount-filter-radio');
    const sortSelect = document.getElementById('sorting-select');

    if (priceSlider) priceSlider.value = 500;
    if (priceMaxVal) priceMaxVal.textContent = '₹500';
    ratingCheckboxes.forEach(cb => cb.checked = false);
    discountCheckboxes.forEach(rb => rb.checked = rb.value === '0');
    if (sortSelect) sortSelect.value = 'popularity';

    renderGrid();
  }

  let sidebarHtml = `
    <div class="container products-listing-layout">
      <!-- Sidebar Filters Panel -->
      <aside class="filters-sidebar">
        <div class="filters-header">
          <h3>Filters</h3>
          <button class="clear-filters-btn" id="clear-filters-btn">Clear All</button>
        </div>

        <!-- Category list filter -->
        <div class="filter-section">
          <h4 class="filter-title">Categories</h4>
          <div class="filter-options">
            <a href="#/products" class="filter-checkbox-label ${selectedCat === 'all' ? 'active' : ''}" style="justify-content:space-between; ${selectedCat === 'all' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>All Delicacies</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.all})</span>
            </a>
            <a href="#/products?category=pickles" class="filter-checkbox-label" style="justify-content:space-between; ${selectedCat === 'pickles' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>Pickles</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.pickles || 0})</span>
            </a>
            <a href="#/products?category=sweets" class="filter-checkbox-label" style="justify-content:space-between; ${selectedCat === 'sweets' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>Sweets</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.sweets || 0})</span>
            </a>
            <a href="#/products?category=spices" class="filter-checkbox-label" style="justify-content:space-between; ${selectedCat === 'spices' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>Spices</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.spices || 0})</span>
            </a>
            <a href="#/products?category=snacks" class="filter-checkbox-label" style="justify-content:space-between; ${selectedCat === 'snacks' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>Snacks</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.snacks || 0})</span>
            </a>
            <a href="#/products?category=healthy" class="filter-checkbox-label" style="justify-content:space-between; ${selectedCat === 'healthy' ? 'color:var(--primary-color);font-weight:700;' : ''}">
              <span>Healthy Food</span>
              <span style="color:var(--text-light);font-size:0.8rem">(${catStats.healthy || 0})</span>
            </a>
          </div>
        </div>

        <!-- Price Range Filter -->
        <div class="filter-section">
          <h4 class="filter-title">Price Range</h4>
          <div class="price-slider-container">
            <input type="range" id="price-slider" min="50" max="500" step="10" value="500">
            <div class="price-range-values">
              <span>₹50</span>
              <span id="price-max-val" style="color:var(--primary-color); font-weight:700;">₹500</span>
            </div>
          </div>
        </div>

        <!-- Ratings Filter -->
        <div class="filter-section">
          <h4 class="filter-title">Customer Ratings</h4>
          <div class="filter-options">
            <label class="filter-checkbox-label">
              <input type="checkbox" class="rating-filter-checkbox" data-stars="4">
              <span>4 ★ & above</span>
            </label>
            <label class="filter-checkbox-label">
              <input type="checkbox" class="rating-filter-checkbox" data-stars="3">
              <span>3 ★ & above</span>
            </label>
          </div>
        </div>

        <!-- Discounts Filter -->
        <div class="filter-section">
          <h4 class="filter-title">Discounts</h4>
          <div class="filter-options">
            <label class="filter-checkbox-label">
              <input type="radio" name="discount" class="discount-filter-radio" value="0" checked>
              <span>Any Discount</span>
            </label>
            <label class="filter-checkbox-label">
              <input type="radio" name="discount" class="discount-filter-radio" value="10">
              <span>10% and above</span>
            </label>
            <label class="filter-checkbox-label">
              <input type="radio" name="discount" class="discount-filter-radio" value="20">
              <span>20% and above</span>
            </label>
          </div>
        </div>
      </aside>

      <!-- Main Products Grid Panel -->
      <section class="products-panel">
        <div class="products-panel-header">
          <div class="results-count">
            ${searchQuery ? `Search Results for "<span>${searchQuery}</span>"` : `Showing products in "<span>${selectedCat}</span>"`}
            (<span id="matching-products-count">${filteredProducts.length}</span> items)
          </div>
          
          <!-- Sorting drop down -->
          <div class="sorting-wrapper">
            <label for="sorting-select">Sort By</label>
            <select id="sorting-select" class="sorting-select">
              <option value="popularity">Popularity (Rating)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount_desc">Better Discount</option>
            </select>
          </div>
        </div>

        <div class="products-grid" id="products-listing-grid">
          <!-- Rendered items inject here -->
        </div>
      </section>
    </div>
  `;

  container.innerHTML = sidebarHtml;
  
  // Render the actual listing
  renderGrid();

  // Attach Sidebar Event Listeners
  const priceSlider = document.getElementById('price-slider');
  const priceMaxVal = document.getElementById('price-max-val');
  priceSlider.addEventListener('input', (e) => {
    currentPriceMax = parseInt(e.target.value);
    priceMaxVal.textContent = `₹${currentPriceMax}`;
    renderGrid();
  });

  const ratingCheckboxes = document.querySelectorAll('.rating-filter-checkbox');
  ratingCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      selectedRatings = [];
      ratingCheckboxes.forEach(box => {
        if (box.checked) {
          const stars = parseInt(box.getAttribute('data-stars'));
          // Include rating stars (e.g. 4 means include 4.x)
          selectedRatings.push(stars);
          if (stars === 4) selectedRatings.push(5); // If 4 is selected, we naturally show 5 as well
        }
      });
      renderGrid();
    });
  });

  const discountRadioButtons = document.querySelectorAll('.discount-filter-radio');
  discountRadioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      minDiscount = parseInt(e.target.value);
      renderGrid();
    });
  });

  const sortSelect = document.getElementById('sorting-select');
  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderGrid();
  });

  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    resetAllFilters();
  });
}

/* --------------------------------------------------------------------------
   3. Product Details View
   -------------------------------------------------------------------------- */
function renderProductDetailsView(container, productId) {
  const product = window.productsData.find(p => p.id === productId);
  if (!product) {
    container.innerHTML = `
      <div class="container" style="text-align:center; padding: 48px;">
        <h2>Delicacy Not Found</h2>
        <a href="#/products" class="slide-btn">Back to products</a>
      </div>
    `;
    return;
  }

  // Recommendations of similar products
  const related = window.productsData
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const isWishlisted = state.wishlist.includes(product.id);
  const cartItem = state.cart.find(item => item.id === product.id);

  let html = `
    <div class="container">
      
      <!-- Breadcrumb -->
      <div style="margin-bottom: 16px; font-size: 0.85rem; color:var(--text-muted);">
        <a href="#/" style="hover:underline">Home</a> &gt; 
        <a href="#/products?category=${product.category}" style="hover:underline">${product.category}</a> &gt; 
        <span style="color:var(--text-dark); font-weight:600;">${product.name}</span>
      </div>

      <!-- Main details card -->
      <div class="product-details-layout">
        
        <!-- Left: Image Section -->
        <div class="details-image-area">
          <div class="main-image-viewport" id="main-viewport">
            <img src="${product.image}" id="details-main-img" alt="${product.name}">
            <span class="discount-badge" style="font-size: 0.9rem; padding: 6px 12px;">${product.discount}% OFF</span>
          </div>
          
          <!-- Small dummy thumbnails showcasing multiple angles -->
          <div class="image-thumbnails">
            <div class="thumbnail-box active" data-src="${product.image}">
              <img src="${product.image}" alt="Angle 1">
            </div>
            <div class="thumbnail-box" data-src="https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600">
              <img src="https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600" alt="Angle 2">
            </div>
            <div class="thumbnail-box" data-src="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=600">
              <img src="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=600" alt="Angle 3">
            </div>
          </div>

          <!-- Checkout buttons -->
          <div class="details-actions-row">
            ${cartItem ? 
              `<button class="action-btn-large btn-add-to-cart" onclick="window.location.hash='#/cart'">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                 Go to Cart
               </button>` :
              `<button class="action-btn-large btn-add-to-cart" id="details-add-cart-btn">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                 Add to Cart
               </button>`
            }
            <button class="action-btn-large btn-buy-now" id="details-buy-now-btn">Buy Now</button>
          </div>
        </div>

        <!-- Right: Info Section -->
        <div class="details-info-area">
          <span class="details-breadcrumb">${product.category}</span>
          <h2 class="details-title">${product.name}</h2>
          <p class="details-tagline">${product.tagline}</p>
          
          <div class="details-rating-row">
            <span class="star-rating" style="font-size: 0.9rem; padding: 4px 10px;">
              ${product.rating}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </span>
            <span class="reviews-count" style="font-size: 0.85rem;">${product.reviewsCount} Ratings & 48 Reviews</span>
            <button onclick="toggleWishlist('${product.id}')" style="margin-left:auto; display:flex; align-items:center; gap:6px; color:${isWishlisted ? 'var(--accent-color)' : 'var(--text-muted)'}; font-weight:600; font-size:0.85rem">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          <div class="details-price-card">
            <div class="price-card-label">Special Homemade Offer Price</div>
            <div class="price-card-numbers">
              <span class="current">₹${product.price}</span>
              <span class="original">₹${product.originalPrice}</span>
              <span class="discount">${product.discount}% OFF</span>
            </div>
            <div style="font-size:0.75rem; color:var(--primary-color); font-weight:600; margin-top: 6px;">Inclusive of all local cooking taxes</div>
          </div>

          <!-- Weight specs -->
          <div class="details-weight-selection">
            <h4 class="weight-label">Net Weight / Pack Size</h4>
            <div class="weight-badge-active">${product.weight}</div>
          </div>

          <!-- Quantity selector in details -->
          <div style="display:flex; align-items:center; gap:16px; margin-bottom: 24px;">
            <span style="font-weight:600; font-size:0.9rem;">Select Quantity:</span>
            <div class="qty-counter">
              <button class="qty-btn" id="details-qty-dec">-</button>
              <div class="qty-val" id="details-qty-val">1</div>
              <button class="qty-btn" id="details-qty-inc">+</button>
            </div>
          </div>

          <!-- Specifications Tabs -->
          <div class="details-tabs">
            <div class="tabs-nav">
              <button class="tab-btn active" data-tab="desc">Description</button>
              <button class="tab-btn" data-tab="ingredients">Ingredients & Benefits</button>
              <button class="tab-btn" data-tab="nutritional">Nutrition Facts</button>
            </div>
            
            <div class="tab-content">
              <div class="tab-content-panel active" id="tab-panel-desc">
                <p>${product.description}</p>
                <p style="margin-top:10px; font-weight:600; color:var(--primary-color);">👨‍🍳 Freshly prepared in home kitchens under strict hygienic conditions. No industrial processing.</p>
              </div>
              <div class="tab-content-panel" id="tab-panel-ingredients">
                <p><strong>Ingredients:</strong> ${product.ingredients}</p>
                <p style="margin-top:10px;"><strong>Key Health Benefits:</strong> ${product.benefits}</p>
              </div>
              <div class="tab-content-panel" id="tab-panel-nutritional">
                <table class="nutritional-table">
                  <thead>
                    <tr>
                      <th>Nutrient</th>
                      <th>Value per ${product.weight}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(product.nutritionalInfo).map(([name, val]) => `
                      <tr>
                        <td><strong>${name}</strong></td>
                        <td>${val}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Related Products Section -->
      ${related.length > 0 ? `
        <div class="section-wrapper" style="margin-top: 48px;">
          <div class="section-header">
            <div class="section-title-box">
              <h2>You May Also Like</h2>
              <p>Other traditional recipes in ${product.category}</p>
            </div>
          </div>
          <div class="products-grid">
            ${related.map(prod => getProductCardHtml(prod)).join('')}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  container.innerHTML = html;

  // Interactivity scripts
  let chosenQty = 1;
  const qtyVal = document.getElementById('details-qty-val');
  const qtyDec = document.getElementById('details-qty-dec');
  const qtyInc = document.getElementById('details-qty-inc');
  
  if (qtyDec && qtyInc) {
    qtyDec.onclick = () => {
      if (chosenQty > 1) {
        chosenQty--;
        qtyVal.textContent = chosenQty;
      }
    };
    qtyInc.onclick = () => {
      chosenQty++;
      qtyVal.textContent = chosenQty;
    };
  }

  // Add to cart buttons
  const addCartBtn = document.getElementById('details-add-cart-btn');
  if (addCartBtn) {
    addCartBtn.onclick = () => {
      addToCart(product.id, chosenQty);
    };
  }

  // Buy now buttons
  const buyNowBtn = document.getElementById('details-buy-now-btn');
  buyNowBtn.onclick = () => {
    addToCart(product.id, chosenQty, true); // add silently
    window.location.hash = '#/checkout';
  };

  // Thumbnail swaps main image viewport
  const thumbnails = document.querySelectorAll('.thumbnail-box');
  const mainImg = document.getElementById('details-main-img');
  thumbnails.forEach(thumb => {
    thumb.onclick = () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = thumb.getAttribute('data-src');
    };
  });

  // Details tab logic
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.onclick = () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      document.getElementById(`tab-panel-${targetTab}`).classList.add('active');
    };
  });

  // Premium pan image zoom effect listener
  const viewport = document.getElementById('main-viewport');
  if (viewport && mainImg) {
    viewport.addEventListener('mousemove', (e) => {
      const rect = viewport.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    });
    viewport.addEventListener('mouseleave', () => {
      mainImg.style.transformOrigin = 'center center';
    });
  }
}

/* --------------------------------------------------------------------------
   4. Cart View
   -------------------------------------------------------------------------- */
function renderCartView(container) {
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-cart-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h2>Your HomeKart Cart is Empty</h2>
          <p>Explore traditional pickles, hand-rolled ghee sweets, and freshly roasted cumin spices in our kitchen store!</p>
          <a href="#/products" class="slide-btn">Explore Delicacies</a>
        </div>
      </div>
    `;
    return;
  }

  // Calculate pricing breakdown
  let subtotalPrice = 0;
  let subtotalOriginal = 0;
  
  const cartItemsHtml = state.cart.map(item => {
    const product = window.productsData.find(p => p.id === item.id);
    if (!product) return '';

    subtotalPrice += (product.price * item.quantity);
    subtotalOriginal += (product.originalPrice * item.quantity);

    const isWishlisted = state.wishlist.includes(product.id);

    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="cart-item-info">
          <h3 class="cart-item-name"><a href="#/product/${product.id}">${product.name}</a></h3>
          <span class="cart-item-weight">Pack Size: ${product.weight}</span>
          <div class="cart-item-price-row">
            <span class="price">₹${product.price}</span>
            <span class="original">₹${product.originalPrice}</span>
            <span class="discount">${product.discount}% Off</span>
          </div>
          
          <div class="cart-qty-row">
            <!-- Qty counters -->
            <div class="qty-counter">
              <button class="qty-btn" onclick="updateCartQuantity('${product.id}', -1)">-</button>
              <div class="qty-val">${item.quantity}</div>
              <button class="qty-btn" onclick="updateCartQuantity('${product.id}', 1)">+</button>
            </div>
            
            <div class="cart-item-actions">
              <button class="cart-action-btn" onclick="removeFromCart('${product.id}')">REMOVE</button>
              <button class="cart-action-btn cart-action-wishlist" onclick="toggleWishlist('${product.id}'); removeFromCart('${product.id}')">
                ${isWishlisted ? 'IN WISHLIST' : 'MOVE TO WISHLIST'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const totalDiscount = subtotalOriginal - subtotalPrice;
  const deliveryCharge = subtotalPrice >= 500 ? 0 : 40;
  const finalTotal = subtotalPrice + deliveryCharge;

  let html = `
    <div class="container">
      <div class="cart-layout">
        
        <!-- Left: Cart Items List -->
        <div class="cart-items-panel">
          <div class="cart-title-row">
            <h2>My Cart (${state.cart.length} item${state.cart.length > 1 ? 's' : ''})</h2>
            <span style="font-weight:600; color:var(--text-muted);">Delhi-NCR Delivery Address (Simulated)</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:20px;">
            ${cartItemsHtml}
          </div>
        </div>

        <!-- Right: Pricing Sidebar Summary -->
        <div class="price-summary-sidebar">
          <div class="summary-card">
            <h3>Price Details</h3>
            
            <div class="summary-row">
              <span>Price (${state.cart.length} item${state.cart.length > 1 ? 's' : ''})</span>
              <span>₹${subtotalOriginal}</span>
            </div>
            <div class="summary-row savings">
              <span>Discount Savings</span>
              <span>- ₹${totalDiscount}</span>
            </div>
            <div class="summary-row">
              <span>Delivery Charges</span>
              <span style="color:${deliveryCharge === 0 ? '#2e7d32' : 'inherit'}; font-weight:${deliveryCharge === 0 ? '600' : 'normal'};">
                ${deliveryCharge === 0 ? 'FREE' : '₹40'}
              </span>
            </div>

            <div class="summary-total">
              <span>Total Amount</span>
              <span>₹${finalTotal}</span>
            </div>

            <p style="color:#2e7d32; font-size:0.85rem; font-weight:700; text-align:center; margin-bottom: 16px;">
              🎉 You will save ₹${totalDiscount} on this order!
            </p>

            <button class="checkout-btn" onclick="window.location.hash = '#/checkout'">
              Place Order
            </button>
          </div>
          
          <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:8px; padding:0 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Safe and Secure Payments. 100% Authentic Homemade Guarantee.</span>
          </div>
        </div>

      </div>
    </div>
  `;

  container.innerHTML = html;
}

/* --------------------------------------------------------------------------
   5. Wishlist View
   -------------------------------------------------------------------------- */
function renderWishlistView(container) {
  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-cart-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <h2>Your Wishlist is Empty</h2>
          <p>Tap on the heart icon on cards to save your favorite homemade spices, side-dish pickles, and traditional laddoos!</p>
          <a href="#/products" class="slide-btn">Find Favorites</a>
        </div>
      </div>
    `;
    return;
  }

  const wishlistProducts = window.productsData.filter(p => state.wishlist.includes(p.id));

  let html = `
    <div class="container">
      <div class="section-header">
        <div class="section-title-box">
          <h2>My Wishlist (${state.wishlist.length} item${state.wishlist.length > 1 ? 's' : ''})</h2>
          <p>Saved homemade delicacies</p>
        </div>
      </div>
      
      <div class="products-grid">
        ${wishlistProducts.map(prod => getWishlistProductCardHtml(prod)).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function getWishlistProductCardHtml(product) {
  const cartItem = state.cart.find(item => item.id === product.id);

  return `
    <div class="product-card" data-product-id="${product.id}">
      <span class="discount-badge">${product.discount}% OFF</span>
      
      <!-- Delete icon button -->
      <button class="wishlist-btn active" onclick="event.preventDefault(); toggleWishlist('${product.id}')" aria-label="Remove from Wishlist">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <a href="#/product/${product.id}" class="card-img-wrapper">
        <img src="${product.image}" alt="${product.name}">
      </a>

      <div class="card-body">
        <span class="card-category">${product.category}</span>
        <a href="#/product/${product.id}"><h3 class="card-title">${product.name}</h3></a>
        <div class="card-weight">${product.weight}</div>
        
        <div class="rating-row">
          <span class="star-rating">
            ${product.rating}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </span>
          <span class="reviews-count">(${product.reviewsCount})</span>
        </div>

        <div class="card-price-row">
          <span class="current-price">₹${product.price}</span>
          <span class="original-price">₹${product.originalPrice}</span>
          <span class="discount-pct">${product.discount}% off</span>
        </div>

        ${cartItem ? 
          `<button class="card-btn in-cart" onclick="event.preventDefault(); window.location.hash = '#/cart'">
             Go to Cart
           </button>` : 
          `<button class="card-btn" onclick="event.preventDefault(); addToCart('${product.id}')">
             Add to Cart
           </button>`
        }
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   6. Checkout View
   -------------------------------------------------------------------------- */
function renderCheckoutView(container) {
  if (state.cart.length === 0) {
    window.location.hash = '#/cart';
    return;
  }

  // Calculate prices
  let subtotal = 0;
  state.cart.forEach(item => {
    const prod = window.productsData.find(p => p.id === item.id);
    if (prod) subtotal += (prod.price * item.quantity);
  });
  const delivery = subtotal >= 500 ? 0 : 40;
  const total = subtotal + delivery;

  // Prefill address if logged in
  const addressDefault = state.user?.addresses?.[0] || {
    name: state.user?.name || '',
    phone: state.user?.phone || '',
    street: '',
    pincode: '',
    city: '',
    state: ''
  };

  let html = `
    <div class="container">
      <div class="checkout-layout">
        
        <!-- Left: Address & Payment Columns -->
        <div>
          <!-- Step 1: Delivery Address Form -->
          <div class="checkout-section">
            <h3 class="checkout-step-title">
              <span class="checkout-step-num">1</span>
              Delivery Address Details
            </h3>
            
            <form id="checkout-address-form">
              <div class="form-grid">
                <div class="form-group">
                  <label for="address-name">Recipient Name *</label>
                  <input type="text" id="address-name" required value="${addressDefault.name}" placeholder="John Doe">
                </div>
                <div class="form-group">
                  <label for="address-phone">Mobile Number *</label>
                  <input type="tel" id="address-phone" required pattern="[0-9]{10}" value="${addressDefault.phone}" placeholder="10-digit number">
                </div>
                <div class="form-group form-field-full">
                  <label for="address-street">Flat, House No., Street Address *</label>
                  <input type="text" id="address-street" required value="${addressDefault.street}" placeholder="Flat 402, Green Meadows Apartment">
                </div>
                <div class="form-group">
                  <label for="address-pincode">Pincode (6 digits) *</label>
                  <input type="text" id="address-pincode" required pattern="[0-9]{6}" value="${addressDefault.pincode}" placeholder="110001">
                </div>
                <div class="form-group">
                  <label for="address-city">City *</label>
                  <input type="text" id="address-city" required value="${addressDefault.city}" placeholder="New Delhi">
                </div>
                <div class="form-group form-field-full">
                  <label for="address-state">State *</label>
                  <select id="address-state" required>
                    <option value="">-- Choose State --</option>
                    <option value="Delhi" ${addressDefault.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
                    <option value="Maharashtra" ${addressDefault.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                    <option value="Karnataka" ${addressDefault.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                    <option value="Uttar Pradesh" ${addressDefault.state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
                    <option value="Haryana" ${addressDefault.state === 'Haryana' ? 'selected' : ''}>Haryana</option>
                    <option value="Other">Other States</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <!-- Step 2: Payment Method Section -->
          <div class="checkout-section">
            <h3 class="checkout-step-title">
              <span class="checkout-step-num">2</span>
              Choose Payment Mode
            </h3>
            
            <div class="payment-options-list">
              <!-- UPI Payment -->
              <label class="payment-option-card">
                <input type="radio" name="payment_mode" value="upi" checked>
                <div class="payment-card-info">
                  <h4>UPI Payments (GPay / PhonePe / Paytm)</h4>
                  <p>Pay instantly using dynamic QR Code scan</p>
                  
                  <div class="upi-qr-mock" id="upi-qr-box">
                    <!-- Confirmed QR code image -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="2" y="2" width="6" height="6"></rect>
                      <rect x="2" y="16" width="6" height="6"></rect>
                      <rect x="16" y="2" width="6" height="6"></rect>
                      <rect x="5" y="5" width="0.1" height="0.1" fill="currentColor"></rect>
                      <rect x="5" y="19" width="0.1" height="0.1" fill="currentColor"></rect>
                      <rect x="19" y="5" width="0.1" height="0.1" fill="currentColor"></rect>
                      <path d="M12 2h2v4h-2V2zm0 8h2v2h-2v-2zm0 4h2v2h-2v-2zm10 2h-4v2h4v-2zm-6 4h4v2h-4v-2zm-6 0h2v2h-2v-2zm16-4v2h-2v-2h2zm-2-6h2v4h-2V8zm-6 2h4v2h-4v-2zm6 2h-2v2h2v-2z"></path>
                    </svg>
                    <span style="font-size:0.75rem; color:var(--text-muted);">Scan QR during simulated confirmation step</span>
                  </div>
                </div>
              </label>

              <!-- Debit / Credit card -->
              <label class="payment-option-card">
                <input type="radio" name="payment_mode" value="card">
                <div class="payment-card-info" style="width:100%;">
                  <h4>Credit / Debit / ATM Card</h4>
                  <p>Visa, MasterCard, RuPay, Maestro accepted</p>
                  
                  <div class="card-details-mock-form" id="card-form-box" style="display:none;">
                    <div class="form-group form-field-full">
                      <input type="text" placeholder="Card Number (16-digits)" pattern="[0-9]{16}" class="card-mock-input" id="card-no">
                    </div>
                    <div class="form-group">
                      <input type="text" placeholder="MM/YY" pattern="(0[1-9]|1[0-2])\/[0-9]{2}" class="card-mock-input" id="card-expiry">
                    </div>
                    <div class="form-group">
                      <input type="password" placeholder="CVV" pattern="[0-9]{3}" class="card-mock-input" id="card-cvv">
                    </div>
                  </div>
                </div>
              </label>

              <!-- Cash On Delivery -->
              <label class="payment-option-card">
                <input type="radio" name="payment_mode" value="cod">
                <div class="payment-card-info">
                  <h4>Cash On Delivery (COD)</h4>
                  <p>Pay cash or UPI at your door during delivery (+₹15 COD processing fee)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary Sidebar -->
        <div class="price-summary-sidebar">
          <!-- Small Items Summary Panel -->
          <div class="summary-card">
            <h3>Items in Order</h3>
            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 20px; max-height: 200px; overflow-y:auto; padding-right:4px;">
              ${state.cart.map(item => {
                const prod = window.productsData.find(p => p.id === item.id);
                if (!prod) return '';
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                    <div>
                      <strong style="color:var(--text-dark);">${prod.name}</strong>
                      <div style="color:var(--text-muted); font-size:0.75rem;">${prod.weight} x ${item.quantity}</div>
                    </div>
                    <strong>₹${prod.price * item.quantity}</strong>
                  </div>
                `;
              }).join('')}
            </div>

            <h3>Total Payable</h3>
            <div class="summary-row">
              <span>Items Total</span>
              <span>₹${subtotal}</span>
            </div>
            <div class="summary-row" id="cod-fee-row" style="display:none;">
              <span>COD Processing Fee</span>
              <span>₹15</span>
            </div>
            <div class="summary-row">
              <span>Shipping Fee</span>
              <span>${delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
            <div class="summary-total" style="margin-bottom:20px;">
              <span>Final Amount</span>
              <span id="payable-final-amount">₹${total}</span>
            </div>

            <button class="checkout-btn" id="confirm-order-btn" style="background-color:var(--primary-color); color:#ffffff;">
              Confirm Order
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  container.innerHTML = html;

  // Interactions inside checkout page
  const paymentRadios = document.getElementsByName('payment_mode');
  const upiQrBox = document.getElementById('upi-qr-box');
  const cardFormBox = document.getElementById('card-form-box');
  const codFeeRow = document.getElementById('cod-fee-row');
  const payableAmtText = document.getElementById('payable-final-amount');
  
  const cardInputs = document.querySelectorAll('.card-mock-input');

  function calculatePayableAmount() {
    let modeVal = 'upi';
    paymentRadios.forEach(r => {
      if (r.checked) modeVal = r.value;
    });

    let extraCodFee = modeVal === 'cod' ? 15 : 0;
    
    // Toggle boxes visual
    if (modeVal === 'upi') {
      upiQrBox.style.display = 'flex';
      cardFormBox.style.display = 'none';
      codFeeRow.style.display = 'none';
      cardInputs.forEach(i => i.removeAttribute('required'));
    } else if (modeVal === 'card') {
      upiQrBox.style.display = 'none';
      cardFormBox.style.display = 'grid';
      codFeeRow.style.display = 'none';
      cardInputs.forEach(i => i.setAttribute('required', 'true'));
    } else {
      upiQrBox.style.display = 'none';
      cardFormBox.style.display = 'none';
      codFeeRow.style.display = 'flex';
      cardInputs.forEach(i => i.removeAttribute('required'));
    }

    payableAmtText.textContent = `₹${total + extraCodFee}`;
  }

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', calculatePayableAmount);
  });

  // Confirm order submission
  const confirmBtn = document.getElementById('confirm-order-btn');
  confirmBtn.onclick = () => {
    // 1. Validate address form
    const addrForm = document.getElementById('checkout-address-form');
    if (!addrForm.reportValidity()) {
      showToast("Please fill all required delivery address fields", "error");
      return;
    }

    // 2. Validate card details if chosen
    let selectedMode = 'upi';
    paymentRadios.forEach(r => {
      if (r.checked) selectedMode = r.value;
    });

    if (selectedMode === 'card') {
      const cNo = document.getElementById('card-no').value.trim();
      const cExp = document.getElementById('card-expiry').value.trim();
      const cCvv = document.getElementById('card-cvv').value.trim();

      if (cNo.length !== 16 || !cExp.includes('/') || cCvv.length !== 3) {
        showToast("Please enter valid card details for simulation", "error");
        return;
      }
    }

    // Save shipping address simulation
    const finalAddress = {
      name: document.getElementById('address-name').value.trim(),
      phone: document.getElementById('address-phone').value.trim(),
      street: document.getElementById('address-street').value.trim(),
      pincode: document.getElementById('address-pincode').value.trim(),
      city: document.getElementById('address-city').value.trim(),
      state: document.getElementById('address-state').value
    };

    // Simulate payment loading spinner
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" style="width:20px;height:20px;margin-right:8px;animation:rotate 2s linear infinite;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" style="stroke-dasharray:90,150;stroke-dashoffset:0;animation:dash 1.5s ease-in-out infinite;"></circle>
      </svg>
      Processing Payment...
    `;

    // Add inline keyframe animation style for spinner if missing
    if (!document.getElementById('spinner-keyframes-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'spinner-keyframes-style';
      styleEl.textContent = `
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        @keyframes dash {
          0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }
      `;
      document.head.appendChild(styleEl);
    }

    setTimeout(() => {
      // Complete order
      const orderId = 'HK' + Math.floor(100000 + Math.random() * 900000);
      const orderDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      
      const orderItems = state.cart.map(item => {
        const prod = window.productsData.find(p => p.id === item.id);
        return {
          id: item.id,
          name: prod ? prod.name : 'Homemade Item',
          price: prod ? prod.price : 0,
          quantity: item.quantity,
          weight: prod ? prod.weight : ''
        };
      });

      const orderTotal = total + (selectedMode === 'cod' ? 15 : 0);

      const newOrder = {
        orderId: orderId,
        date: orderDate,
        items: orderItems,
        total: orderTotal,
        address: finalAddress,
        paymentMode: selectedMode.toUpperCase(),
        status: 'Preparing in Kitchen'
      };

      // Add to user orders
      if (!state.user) {
        // Create a temporary guest user profile to hold order history
        state.user = {
          name: finalAddress.name,
          email: 'guest@homekart.com',
          phone: finalAddress.phone,
          addresses: [finalAddress],
          orders: []
        };
      }
      
      if (!state.user.addresses) state.user.addresses = [];
      // Push address if new
      if (!state.user.addresses.some(a => a.street === finalAddress.street)) {
        state.user.addresses.push(finalAddress);
      }

      state.user.orders.unshift(newOrder);
      saveUser();

      // Clear Cart
      state.cart = [];
      saveCart();

      // Navigate to success
      renderOrderSuccessView(container, newOrder);
    }, 2500);
  };
}

function renderOrderSuccessView(container, order) {
  let html = `
    <div class="container">
      <div class="order-success-screen">
        <div class="success-icon-badge">✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Your order has been sent to our home kitchen cooks. Preparing fresh batches starts immediately.</p>
        
        <div class="success-details-card">
          <div class="success-detail-row">
            <span>Order ID</span>
            <span><strong>${order.orderId}</strong></span>
          </div>
          <div class="success-detail-row">
            <span>Payment Mode</span>
            <span><strong>${order.paymentMode}</strong></span>
          </div>
          <div class="success-detail-row">
            <span>Delivery Address</span>
            <span><strong>${order.address.name}, ${order.address.city}</strong></span>
          </div>
          <div class="success-detail-row">
            <span>Estimated Delivery</span>
            <span style="color:var(--primary-color); font-weight:700;">3-5 Days (Naturally Aged/Packed)</span>
          </div>
          <div class="success-detail-row">
            <span>Amount Paid</span>
            <span><strong>₹${order.total}</strong></span>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:16px;">
          <a href="#/profile" class="slide-btn" style="background-color:var(--primary-color); color:#white; font-size:0.85rem;">Track Order</a>
          <a href="#/products" class="slide-btn" style="font-size:0.85rem;">Shop More</a>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

/* --------------------------------------------------------------------------
   7. Profile View
   -------------------------------------------------------------------------- */
function renderProfileView(container) {
  if (!state.user) {
    container.innerHTML = `
      <div class="container" style="text-align:center; padding:60px 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-light); margin-bottom:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <h2>Please Login to View Profile</h2>
        <p>Log in or sign up to view your past orders, delivery addresses, and personalized culinary lists.</p>
        <button class="empty-reset-btn" style="margin-top:16px;" onclick="toggleAuthModal(true)">Login / Sign Up</button>
      </div>
    `;
    return;
  }

  const orders = state.user.orders || [];

  let ordersListHtml = `
    <div style="text-align:center; padding:32px 0; color:var(--text-muted);">
      <p>No orders placed yet. Start ordering delicious homemade foods!</p>
      <a href="#/products" class="clear-filters-btn" style="margin-top:10px; display:inline-block; font-size:0.9rem;">Shop Kitchen products</a>
    </div>
  `;

  if (orders.length > 0) {
    ordersListHtml = orders.map(order => `
      <div class="order-history-card">
        <div class="order-history-header">
          <div>Order ID: <span>#${order.orderId}</span></div>
          <div>Placed on: <span>${order.date}</span></div>
        </div>
        <div class="order-history-body">
          ${order.items.map(item => `
            <div class="order-product-item">
              <div>
                <strong>${item.name}</strong>
                <span class="order-product-meta">(${item.weight})</span>
              </div>
              <div>Qty: ${item.quantity} <span style="margin-left:12px; font-weight:600;">₹${item.price * item.quantity}</span></div>
            </div>
          `).join('')}
        </div>
        <div class="order-history-footer">
          <div class="order-history-status">
            <span class="status-indicator"></span>
            Status: ${order.status}
          </div>
          <div>Total Payable: <strong>₹${order.total}</strong></div>
        </div>
      </div>
    `).join('');
  }

  let html = `
    <div class="container">
      <div class="profile-layout">
        
        <!-- Sidebar Navigation -->
        <aside class="profile-sidebar">
          <div class="profile-avatar-row">
            <div class="avatar-circle">
              ${state.user.name.split(' ').map(n=>n[0]).join('').toUpperCase()}
            </div>
            <div class="avatar-text">
              <h4>${state.user.name}</h4>
              <p>HomeCook Associate</p>
            </div>
          </div>

          <div class="profile-menu">
            <a href="#/profile" class="profile-menu-item active">My Orders</a>
            <a href="#/wishlist" class="profile-menu-item">My Wishlist</a>
            <a href="#/cart" class="profile-menu-item">My Cart</a>
            <button class="profile-menu-item" id="profile-logout-btn" style="color:var(--accent-color); margin-top:20px; text-align:left; border-top:1px solid var(--border-color); padding-top:16px;">Logout Account</button>
          </div>
        </aside>

        <!-- Main Profile Content panel -->
        <section class="profile-content-panel">
          <h3 class="profile-section-title">Order History</h3>
          <div class="orders-list">
            ${ordersListHtml}
          </div>
        </section>

      </div>
    </div>
  `;

  container.innerHTML = html;

  // Logout trigger
  document.getElementById('profile-logout-btn').onclick = () => {
    state.user = null;
    saveUser();
    showToast("Logged out successfully");
    window.location.hash = '#/';
  };
}

/* --------------------------------------------------------------------------
   8. About Us View
   -------------------------------------------------------------------------- */
function renderAboutView(container) {
  container.innerHTML = `
    <div class="container">
      
      <div class="about-hero">
        <h2>About HomeKart</h2>
        <p>Connecting generation-old kitchen secrets with modern homes. HomeKart is a dedicated platform celebrating pure homemade pickles, sweets, stone-ground spices, and healthy grain mixtures.</p>
      </div>

      <div class="about-values-grid">
        <div class="value-card">
          <div class="value-card-icon">👵</div>
          <h3>Traditional Recipes</h3>
          <p>None of our food is formulated in industrial labs. Recipes are legacy formulas inherited from mothers, grandmothers, and family journals, containing authentic local ingredients.</p>
        </div>
        <div class="value-card">
          <div class="value-card-icon">🧪</div>
          <h3>100% Chemical-Free</h3>
          <p>We completely ban artificial coloring agents, chemical shelf-preservatives, thickening agents, or synthetic powders. Our food is preserved naturally using oil, salt, and sun-drying.</p>
        </div>
        <div class="value-card">
          <div class="value-card-icon">👩‍🍳</div>
          <h3>Women Empowerment</h3>
          <p>HomeKart supports self-employed home cooks and rural women cooperative groups. By choosing HomeKart, you are fostering independent household incomes and local craft livelihoods.</p>
        </div>
      </div>

      <div class="story-block" style="margin-top: 48px;">
        <div class="story-text">
          <h3>The Pure Ghee & Sunlight Curing Process</h3>
          <p>In modern factories, high-speed steel cutters generate friction heat that scorches natural spice oils, ruining flavor profiles. Pickles are chemically treated to speed up fermentation from 15 days to 2 hours.</p>
          <p>At HomeKart, our partners do it slowly. Mustard seeds and cumin are stone-ground in small rotation mills to retain temperature. Mango and lemon pickles are matured inside glass containers on open rooftops under steady sunshine. Cards of besan and coconut ladoo are individually rolled by hand while still warm.</p>
          <a href="#/products" class="slide-btn" style="display:inline-block; margin-top:10px;">Taste the Difference</a>
        </div>
        <div class="story-img-wrapper">
          <img src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600" alt="Indian Spices Preparation">
        </div>
      </div>

    </div>
  `;
}

/* --------------------------------------------------------------------------
   9. Contact Us View
   -------------------------------------------------------------------------- */
function renderContactView(container) {
  container.innerHTML = `
    <div class="container">
      <div class="contact-layout">
        
        <!-- Left panel info -->
        <div class="contact-info-panel">
          <div>
            <h3>Connect With Us</h3>
            <p>Have questions about a home cook partner, bulk wedding sweets orders, or dietary specifications? Send a note!</p>
          </div>
          
          <div class="contact-details-list">
            <div class="contact-detail-item">
              <span class="contact-detail-icon">📍</span>
              <div class="contact-detail-text">
                <h4>HomeKart Central Kitchen Hub</h4>
                <p>C-42, Sector 62, Noida, Uttar Pradesh, 201301</p>
              </div>
            </div>
            <div class="contact-detail-item">
              <span class="contact-detail-icon">📞</span>
              <div class="contact-detail-text">
                <h4>Phone Support</h4>
                <p>+91 98765 43210 (10 AM - 6 PM)</p>
              </div>
            </div>
            <div class="contact-detail-item">
              <span class="contact-detail-icon">✉️</span>
              <div class="contact-detail-text">
                <h4>Email Inbox</h4>
                <p>support@homekart.com</p>
              </div>
            </div>
          </div>
          
          <div>
            <div style="font-size:0.8rem; color:var(--primary-light); margin-bottom: 16px; line-height: 1.5;">
              Interested in listing your homemade delicacies? Email <strong>cook@homekart.com</strong> with FSSAI details.
            </div>
            <div class="contact-social-icons">
              <a href="#" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Right panel form -->
        <div class="contact-form-panel">
          <h3>Write to Our Cook Care Team</h3>
          <p>We usually respond to household queries within 24 hours.</p>
          
          <form id="contact-us-form">
            <div class="form-group" style="margin-bottom: 16px;">
              <label for="contact-name">Your Full Name *</label>
              <input type="text" id="contact-name" required placeholder="John Doe">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label for="contact-email">Email Address *</label>
              <input type="email" id="contact-email" required placeholder="john@example.com">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label for="contact-subject">Query Subject</label>
              <input type="text" id="contact-subject" placeholder="e.g. Bulk sweets order, pickle ingredients">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label for="contact-message">Write Message *</label>
              <textarea id="contact-message" required rows="4" placeholder="How can our grandmother cooks help you?"></textarea>
            </div>
            <button type="submit" class="contact-form-btn">Send Message</button>
          </form>
        </div>

      </div>

      <!-- Google Maps Placeholder -->
      <div class="contact-map-section">
        <h4 style="font-family: var(--font-headings); font-size: 1.2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 16px;">Our Location Map</h4>
        <div class="contact-map-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; color: var(--primary-color);">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style="font-weight: 600; color: var(--text-dark); margin-bottom: 4px;">HomeKart Noida Office Hub</span>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Interactive Google Map simulation load successful</span>
        </div>
      </div>

    </div>
  `;

  // Attach submit listener
  const contactForm = document.getElementById('contact-us-form');
  contactForm.onsubmit = (e) => {
    e.preventDefault();
    
    // Simulate API delivery
    const btn = contactForm.querySelector('button');
    btn.disabled = true;
    btn.textContent = "Sending...";

    setTimeout(() => {
      showToast("Thank you! Message delivered successfully.");
      contactForm.reset();
      btn.disabled = false;
      btn.textContent = "Send Message";
    }, 1200);
  };
}

// ==========================================================================
// Authentication Modal (Login / Sign Up) logic
// ==========================================================================
function toggleAuthModal(show = true) {
  const modal = document.getElementById('auth-modal');
  if (show) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

// Auth UI helper links and tabs
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabSignupBtn = document.getElementById('tab-signup-btn');
const loginPanel = document.getElementById('modal-login-panel');
const signupPanel = document.getElementById('modal-signup-panel');

function switchAuthTab(target = 'login') {
  if (target === 'login') {
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    loginPanel.classList.add('active');
    signupPanel.classList.remove('active');
  } else {
    tabLoginBtn.classList.remove('active');
    tabSignupBtn.classList.add('active');
    loginPanel.classList.remove('active');
    signupPanel.classList.add('active');
  }
}

tabLoginBtn.onclick = () => switchAuthTab('login');
tabSignupBtn.onclick = () => switchAuthTab('signup');
document.getElementById('switch-to-signup').onclick = () => switchAuthTab('signup');
document.getElementById('switch-to-login').onclick = () => switchAuthTab('login');
document.getElementById('auth-modal-close').onclick = () => toggleAuthModal(false);

// Close modal on click overlay
document.getElementById('auth-modal').onclick = (e) => {
  if (e.target.id === 'auth-modal') {
    toggleAuthModal(false);
  }
};

// Form login submission
document.getElementById('login-form').onsubmit = (e) => {
  e.preventDefault();
  
  const emailVal = document.getElementById('login-email').value.trim();
  
  // Create simulated user
  state.user = {
    name: "Rohan Sharma",
    email: emailVal.includes('@') ? emailVal : "rohan.sharma@example.com",
    phone: !isNaN(emailVal) && emailVal.length === 10 ? emailVal : "9876543210",
    addresses: [
      {
        name: "Rohan Sharma",
        phone: "9876543210",
        street: "B-501, Royal Palms Sector 4",
        pincode: "400065",
        city: "Mumbai",
        state: "Maharashtra"
      }
    ],
    orders: [
      {
        orderId: "HK765293",
        date: "Jul 10, 2026",
        items: [
          { name: "Dadi's Special Traditional Mango Pickle", price: 180, quantity: 1, weight: "500g" },
          { name: "Shahi Desi Ghee Besan Ladoo", price: 299, quantity: 2, weight: "500g" }
        ],
        total: 778,
        address: { name: "Rohan Sharma", phone: "9876543210", street: "B-501, Royal Palms Sector 4", pincode: "400065", city: "Mumbai", state: "Maharashtra" },
        paymentMode: "UPI",
        status: "Delivered"
      }
    ]
  };

  saveUser();
  toggleAuthModal(false);
  showToast(`Welcome back, ${state.user.name}!`);
  router(); // refresh current view (updates header buttons / login panels)
};

// Form signup submission
document.getElementById('signup-form').onsubmit = (e) => {
  e.preventDefault();

  const nameVal = document.getElementById('signup-name').value.trim();
  const emailVal = document.getElementById('signup-email').value.trim();
  const phoneVal = document.getElementById('signup-phone').value.trim();

  state.user = {
    name: nameVal,
    email: emailVal,
    phone: phoneVal,
    addresses: [],
    orders: []
  };

  saveUser();
  toggleAuthModal(false);
  showToast(`Registration Successful! Welcome ${state.user.name}`);
  router();
};

// Newsletter Footer subscription submit
document.getElementById('newsletter-form').onsubmit = (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  showToast(`Subscribed ${email} to recipes newsletter!`);
  e.target.reset();
};

// ==========================================================================
// Initialization triggers
// ==========================================================================
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  initStore();
  router();
});
