// AI Chatbox functionality
(function() {
    let chatOpen = false;
    let isLoading = false;

    window.toggleChatbox = function() {
        chatOpen = !chatOpen;
        const chatWindow = document.getElementById('chatWindow');
        const chatIcon = document.getElementById('chatIcon');
        const notification = document.getElementById('chatNotification');

        if (chatOpen) {
            chatWindow.classList.add('active');
            chatIcon.className = 'bi bi-x-lg';
            notification.style.display = 'none';
        } else {
            chatWindow.classList.remove('active');
            chatIcon.className = 'bi bi-chat-dots';
        }
    };

    window.handleChatKeypress = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    window.askQuestion = function(question) {
        document.getElementById('chatInput').value = question;
        sendMessage();
    };

    window.sendMessage = async function() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message || isLoading) return;

        isLoading = true;

        addMessage(message, 'user');
        input.value = '';
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat/consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            hideTypingIndicator();

            if (data.error) {
                addMessage(data.error, 'bot');
            } else {
                addMessageWithProducts(data);
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại!', 'bot');
        }

        isLoading = false;
    };

    function addMessage(text, type) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-' + type + '-message';
        messageDiv.innerHTML = '<div class="ai-message-content"><p>' + text.replace(/\n/g, '<br>') + '</p></div><div class="ai-message-time">' + time + '</div>';

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    function addMessageWithProducts(data) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        let productsHtml = '';

        if (data.products && data.products.length > 0) {
            productsHtml = '<div class="ai-product-recommendation"><div class="ai-product-header">📱 Gợi ý cho bạn:</div>';

            data.products.forEach(product => {
                const discount = product.discount_percent > 0 ? '<span class="ai-product-discount">-' + product.discount_percent + '%</span>' : '';
                const oldPriceHtml = product.old_price ? '<span class="ai-product-old-price">' + formatPrice(product.old_price) + 'đ</span>' : '';
                const specsHtml = (product.ram || product.storage) ? '<div class="ai-product-specs">' + [product.ram, product.storage].filter(Boolean).join(' / ') + '</div>' : '';
                const imgPlaceholder = '<div class="ai-product-img-placeholder">📱</div>';

                productsHtml += '<a href="/product/' + product.id + '" class="ai-product-card">' +
                    imgPlaceholder +
                    '<div class="ai-product-info">' +
                    '<div class="ai-product-name">' + product.name + '</div>' +
                    '<div class="ai-product-price">' + formatPrice(product.price) + 'đ ' + oldPriceHtml + ' ' + discount + '</div>' +
                    specsHtml +
                    '</div></a>';
            });

            productsHtml += '<a href="/products" class="ai-see-more">Xem thêm sản phẩm khác →</a></div>';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-bot-message';
        const responseText = data.response ? '<p>' + data.response.replace(/\n/g, '<br>') + '</p>' : '';
        messageDiv.innerHTML = '<div class="ai-message-content">' + responseText + productsHtml + '</div><div class="ai-message-time">' + time + '</div>';

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    function showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message ai-bot-message';
        loadingDiv.id = 'typingIndicator';
        loadingDiv.innerHTML = '<div class="ai-message-content"><div class="ai-typing-indicator"><span></span><span></span><span></span></div></div><div class="ai-message-time">' + time + '</div>';

        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    // Initialize when chatbox HTML is loaded
    window.initChatbox = function() {
        const chatToggle = document.getElementById('chatToggle');
        if (chatToggle) {
            chatToggle.addEventListener('click', window.toggleChatbox);
        }

        const closeBtn = document.getElementById('aiCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', window.toggleChatbox);
        }

        const sendBtn = document.getElementById('aiSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', window.sendMessage);
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', window.handleChatKeypress);
        }

        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            const question = btn.getAttribute('data-question');
            if (question) {
                btn.addEventListener('click', () => window.askQuestion(question));
            }
        });
    };
})();
