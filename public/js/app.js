// Phone Store - Main JavaScript Application

// Format price to VND
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

// Initialize app
async function initApp() {
    await loadUserInfo();
    await loadCartBadge();
    setupSearch();
}

// Load user info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        const userArea = document.getElementById('userArea');
        const mobileUserArea = document.getElementById('mobileUserArea');

        if (data.user) {
            const roleLabel = data.user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng';
            const adminLink = data.user.role === 'admin'
                ? '<a href="/admin" class="user-dropdown-item"><i class="bi bi-speedometer2"></i> Trang quản trị</a>'
                : '';

            const userHtml = `
                <div class="user-dropdown">
                    <button class="btn-login user-dropdown-btn">
                        <i class="bi bi-person-circle"></i>
                        ${data.user.full_name}
                        <i class="bi bi-chevron-down" style="font-size:0.65rem"></i>
                    </button>
                    <div class="user-dropdown-menu">
                        <div class="user-dropdown-header">
                            <div class="user-avatar"><i class="bi bi-person-fill"></i></div>
                            <div>
                                <div class="user-name">${data.user.full_name}</div>
                                <div class="user-role">${roleLabel}</div>
                            </div>
                        </div>
                        <div class="user-dropdown-divider"></div>
                        ${adminLink}
                        <a href="/orders" class="user-dropdown-item"><i class="bi bi-bag-check"></i> Đơn hàng của tôi</a>
                        <a href="/profile" class="user-dropdown-item"><i class="bi bi-gear"></i> Cài đặt tài khoản</a>
                        <div class="user-dropdown-divider"></div>
                        <a href="javascript:void(0)" class="user-dropdown-item user-dropdown-logout" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Đăng xuất</a>
                    </div>
                </div>`;

            const mobileUserHtml = `
                <div class="mobile-nav-user">
                    <div class="user-avatar"><i class="bi bi-person-fill"></i></div>
                    <div>
                        <div style="font-weight:700;font-size:0.875rem">${data.user.full_name}</div>
                        <div style="font-size:0.72rem;color:var(--gray)">${roleLabel}</div>
                    </div>
                </div>
                ${data.user.role === 'admin' ? '<a href="/admin" class="mobile-nav-item"><i class="bi bi-speedometer2"></i> Trang quản trị</a>' : ''}
                <a href="/orders" class="mobile-nav-item"><i class="bi bi-bag-check"></i> Đơn hàng của tôi</a>
                <a href="/profile" class="mobile-nav-item"><i class="bi bi-gear"></i> Cài đặt tài khoản</a>
                <a href="javascript:void(0)" class="mobile-nav-item" style="color:#EF4444" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Đăng xuất</a>`;

            if (userArea) userArea.innerHTML = userHtml;
            if (mobileUserArea) mobileUserArea.innerHTML = mobileUserHtml;

            // Setup dropdown
            setupUserDropdown();
        } else {
            const guestHtml = '<a href="/login" class="btn-login"><i class="bi bi-person"></i> Đăng nhập</a>';
            const mobileGuestHtml = '<a href="/login" class="mobile-nav-item" style="color:var(--primary);font-weight:700"><i class="bi bi-person"></i> Đăng nhập</a>';

            if (userArea) userArea.innerHTML = guestHtml;
            if (mobileUserArea) mobileUserArea.innerHTML = mobileGuestHtml;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load cart badge
async function loadCartBadge() {
    try {
        const response = await fetch('/api/cart-count');
        const data = await response.json();

        const badge = document.getElementById('cartBadge');
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading cart count:', error);
    }
}

// Add to cart
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, qty: quantity })
        });

        const data = await response.json();

        if (data.error) {
            if (data.error.includes('đăng nhập')) {
                if (confirm('Bạn cần đăng nhập để thêm vào giỏ hàng. Đăng nhập ngay?')) {
                    window.location.href = '/login';
                }
            } else {
                alert(data.error);
            }
        } else {
            alert('Đã thêm vào giỏ hàng!');
            loadCartBadge();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Đã xảy ra lỗi khi thêm vào giỏ hàng!');
    }
}

// Search
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggest = document.getElementById('searchSuggest');
    let searchTimer;

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            const q = this.value.trim();
            if (q.length < 2) {
                if (searchSuggest) searchSuggest.style.display = 'none';
                return;
            }

            searchTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                    const data = await response.json();

                    if (data.length === 0) {
                        if (searchSuggest) searchSuggest.style.display = 'none';
                        return;
                    }

                    let html = '';
                    data.forEach(item => {
                        html += `
                            <a href="/product/${item.id}" class="suggest-item">
                                <img src="/assets/images/products/${item.thumbnail || ''}" onerror="this.style.display='none'" class="suggest-img">
                                <div class="suggest-info">
                                    <div class="suggest-name">${item.name}</div>
                                    <div class="suggest-price">${formatPrice(item.price)}đ</div>
                                </div>
                            </a>`;
                    });
                    html += `
                        <div class="suggest-footer">
                            <a href="/products?q=${encodeURIComponent(q)}" class="suggest-all">
                                <i class="bi bi-search"></i> Xem tất cả kết quả cho "${q}"
                            </a>
                        </div>`;

                    if (searchSuggest) {
                        searchSuggest.innerHTML = html;
                        searchSuggest.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });

        // Hide suggest on click outside
        document.addEventListener('click', function (e) {
            if (!searchInput.contains(e.target) && (!searchSuggest || !searchSuggest.contains(e.target))) {
                if (searchSuggest) searchSuggest.style.display = 'none';
            }
        });
    }
}

// Logout
async function logout() {
    if (!confirm('Đăng xuất?')) return;
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        window.location.href = '/login';
    }
}

// User dropdown
function setupUserDropdown() {
    const userBtn = document.querySelector('.user-dropdown-btn');
    const userMenu = document.querySelector('.user-dropdown-menu');

    if (userBtn && userMenu) {
        userBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });

        document.addEventListener('click', function () {
            userMenu.classList.remove('show');
        });
    }
}

// Mobile menu
function openMobileMenu() {
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('mobileOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// Go search
function goSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) window.location = '/products?q=' + encodeURIComponent(q);
}

function goMobileSearch() {
    const q = document.getElementById('mobileSearchInput').value.trim();
    if (q) window.location = '/products?q=' + encodeURIComponent(q);
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use
window.initApp = initApp;
window.loadUserInfo = loadUserInfo;
window.loadCartBadge = loadCartBadge;
window.addToCart = addToCart;
window.formatPrice = formatPrice;
window.goSearch = goSearch;
window.goMobileSearch = goMobileSearch;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.logout = logout;
