// Конфигурация API
const TELEGRAM_BOT_TOKEN = '8696257846:AAFhjWlgS8FcmN00SL1seQSqoGzt3I8Sauo';
const TELEGRAM_CHAT_ID = '6954461123'; 

// База данных товаров
const products = [
    { id: 1, name: "Neon Matrix К65", price: 999999999, category: "keyboards", desc: "Механическая клавиатура, Gateron Yellow, RGB", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80" },
    { id: 2, name: "Cyber Glide X", price: 99999999, category: "mice", desc: "Беспроводная мышь, 26000 DPI, 54 грамма", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80" },
    { id: 3, name: "Overdrive Pro", price: 99999999, category: "headphones", desc: "Гарнитура со звуком 7.1 и неоновой подсветкой", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80" },
    { id: 4, name: "Grid Runner Pad", price: 99999999, category: "mousepads", desc: "Ковёр с контурной подсветкой 900x400мм", image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=400&q=80" },
    { id: 5, name: "Quantum V 27'", price: 999999999990, category: "monitors", desc: "IPS, 2K, 240Hz, Отклик 0.5мс", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80" },
    { id: 6, name: "CyberPhone Edge", price: 999999990, category: "phones", desc: "Amoled 144Hz, Геймерский чипсет, 16GB RAM", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80" },
    { id: 7, name: "Neon Tab Pro", price: 99999999, category: "tablets", desc: "Экран 12.9', Поддержка стилуса, 5G модуляция", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80" }
];

const categories = [
    { id: 'all', name: 'Все товары' },
    { id: 'keyboards', name: 'Клавиатуры' },
    { id: 'mice', name: 'Мыши' },
    { id: 'headphones', name: 'Наушники' },
    { id: 'mousepads', name: 'Коврики' },
    { id: 'monitors', name: 'Мониторы' },
    { id: 'phones', name: 'Телефоны' },
    { id: 'tablets', name: 'Планшеты' }
];

// Глобальное состояние
let currentUser = JSON.parse(localStorage.getItem('neon_user')) || null;
let cart = JSON.parse(localStorage.getItem('neon_cart')) || [];
let currentCategory = 'all';
let generatedCode = '';
let tempPhone = '';

document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderProducts();
    updateAuthUI();
    updateCartUI();
    
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderProducts(e.target.value.toLowerCase());
    });
});

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat.id}')" class="px-5 py-2 rounded-xl text-sm font-semibold tracking-wide border transition-all whitespace-nowrap ${currentCategory === cat.id ? 'bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_#a855f7]' : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-neon-purple/50'}">
            ${cat.name}
        </button>
    `).join('');
}

function setCategory(id) {
    currentCategory = id;
    renderCategories();
    renderProducts();
}

function renderProducts(searchQuery = '') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    let filtered = products;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery) || p.desc.toLowerCase().includes(searchQuery));
    }

    if(filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">Системы сканирования не обнаружили подходящего снаряжения.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <div class="product-card bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden p-4 flex flex-col justify-between">
            <div class="relative rounded-xl overflow-hidden mb-4 bg-dark-900 aspect-video">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            </div>
            <div>
                <h4 class="font-bold text-lg text-white tracking-wide mb-1">${product.name}</h4>
                <p class="text-gray-400 text-xs line-clamp-2 mb-4 h-8">${product.desc}</p>
            </div>
            <div class="flex items-center justify-between mt-auto pt-2">
                <span class="text-xl font-black text-neon-pink">${product.price.toLocaleString()} ₽</span>
                <button onclick="addToCart(${product.id})" class="bg-dark-700 hover:bg-neon-purple text-white border border-neon-purple/40 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function nextStep(step) {
    if (step === 2) {
        const phone = document.getElementById('login-phone').value;
        if(phone.length < 10) return showToast('Введите корректный номер (минимум 10 цифр)', 'error');
        tempPhone = phone;
        
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        sendTelegramCode(generatedCode, tempPhone);

        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
        updateDots(1);
    } else if (step === 3) {
        const inputCode = document.getElementById('verification-code').value;
        if(inputCode !== generatedCode) return showToast('Ошибка дешифрования: неверный код!', 'error');

        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
        updateDots(2);
    }
}

function updateDots(activeIdx) {
    const dots = document.querySelectorAll('#step-indicators .step-dot');
    dots.forEach((dot, idx) => {
        if(idx <= activeIdx) dot.className = "w-3 h-3 rounded-full bg-neon-purple";
        else dot.className = "w-3 h-3 rounded-full bg-dark-600";
    });
}

async function sendTelegramCode(code, phone) {
    const text = `⚠️ НЕ СООБЩАЙТЕ КОД НИКОМУ!!!\n\n🔐 Ваш верификационный код: ${code}\n\n📱 Номер: +${phone}\n⏰ Код действителен 5 минут\n\nNEON SHOP`;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text
            })
        });
        showToast('Код аутентификации направлен в сеть', 'info');
    } catch (e) {
        console.error("Ошибка отправки кода в TG:", e);
        showToast('Ошибка при отправке кода', 'error');
    }
}

function detectGeo() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('city-select').value = "Москва"; 
            showToast('Координаты успешно синхронизированы', 'success');
        }, () => {
            showToast('Не удалось получить координаты', 'error');
        });
    }
}

function finishLogin() {
    const selectedCity = document.getElementById('city-select').value;
    currentUser = {
        phone: tempPhone,
        city: selectedCity,
        ordersCount: 0,
        totalSpent: 0
    };
    localStorage.setItem('neon_user', JSON.stringify(currentUser));
    updateAuthUI();
    closeModal('login-modal');
    showToast('Протокол авторизации успешно завершен!', 'success');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('neon_user');
    updateAuthUI();
    closeModal('profile-modal');
    showToast('Сессия закрыта', 'info');
}

function updateAuthUI() {
    const zone = document.getElementById('auth-zone');
    if (!zone) return;
    if (currentUser) {
        zone.innerHTML = `
            <button onclick="openModal('profile-modal')" class="border border-neon-blue text-neon-blue px-4 py-2 rounded-lg font-semibold text-sm hover:bg-neon-blue/10 transition-all">
                <i class="fa-solid fa-user-astronaut mr-2"></i> Профиль
            </button>
        `;
        document.getElementById('profile-phone').innerText = '+' + currentUser.phone;
        document.getElementById('profile-city').innerHTML = `<i class="fa-solid fa-location-dot"></i> Город доставки: ${currentUser.city}`;
    } else {
        zone.innerHTML = `
            <button onclick="openModal('login-modal')" class="bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                Вход
            </button>
        `;
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    sidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('neon_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`${product.name} загружен в терминал заказа`, 'success');
}

function changeQty(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    localStorage.setItem('neon_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const countBadge = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cart-total');

    if (!container || !countBadge || !totalLabel) return;

    let total = 0;
    let itemsCount = 0;

    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        itemsCount += item.quantity;
        return `
            <div class="flex items-center justify-between bg-dark-900 p-3 rounded-xl border border-dark-700">
                <div class="flex-1 min-w-0 pr-2">
                    <h5 class="font-semibold text-sm text-white truncate">${item.name}</h5>
                    <span class="text-xs text-neon-pink font-bold">${(item.price * item.quantity).toLocaleString()} ₽</span>
                </div>
                <div class="flex items-center gap-2 bg-dark-700 px-2 py-1 rounded-lg">
                    <button onclick="changeQty(${item.id}, -1)" class="text-gray-400 hover:text-white text-xs"><i class="fa-solid fa-minus"></i></button>
                    <span class="text-sm font-bold w-4 text-center">${item.quantity}</span>
                    <button onclick="changeQty(${item.id}, 1)" class="text-gray-400 hover:text-white text-xs"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
    }).join('');

    countBadge.innerText = itemsCount;
    totalLabel.innerText = `${total.toLocaleString()} ₽`;
}

async function checkoutOrder() {
    if (cart.length === 0) return showToast('Корзина пуста!', 'error');
    if (!currentUser) {
        toggleCart();
        openModal('login-modal');
        return showToast('Для совершения транзакции требуется авторизация', 'info');
    }

    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const orderId = Math.floor(1000 + Math.random() * 9000); 
    const clientPhone = currentUser.phone;
    const clientCity = currentUser.city;

    // Главный текст заказа для твоего канала/чата
    const orderText = `📦 НОВЫЙ КИБЕР-ЗАКАЗ #${orderId}\n\n👤 Клиент: +${clientPhone}\n📍 Город: ${clientCity}\n\n🛒 Состав:\n${cart.map(i => `• ${i.name} (x${i.quantity})`).join('\n')}\n\n💰 Итого: ${total} ₽`;

    // Сообщения по твоему ТЗ
    const msgSent = `Ваш заказ был отправлен на почту ${clientCity} с номером ${orderId}, для дальнейшей информации напишите @Neyzov с вашим номером заказа`;
    const msgCancel = `Ваш заказ был отменён, данного предмета нету на наших складах, попробуйте заказать через 2-3 дня`;

    // Безопасное кодирование текста для ссылок Telegram t.me
    const encodedSent = encodeURIComponent(msgSent);
    const encodedCancel = encodeURIComponent(msgCancel);

    // Ссылки ведут прямо на диалог с аккаунтом @Neyzov и подставляют нужный текст
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { 
                    text: "🟢 Отправлен", 
                    url: `https://t.me/Neyzov?text=${encodedSent}` 
                },
                { 
                    text: "🔴 Отмена", 
                    url: `https://t.me/Neyzov?text=${encodedCancel}` 
                }
            ]
        ]
    };

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: orderText,
                reply_markup: inlineKeyboard 
            })
        });

        const result = await response.json();
        
        if (!result.ok) {
            console.error("Ошибка Telegram API:", result.description);
            showToast('Ошибка Telegram: ' + result.description, 'error');
            return; 
        }
        
        currentUser.ordersCount += 1;
        currentUser.totalSpent += total;
        localStorage.setItem('neon_user', JSON.stringify(currentUser));
        
        cart = [];
        localStorage.removeItem('neon_cart');
        updateCartUI();
        toggleCart();
        updateAuthUI();
        
        showToast('Заказ успешно зафиксирован!', 'success');
    } catch(e) {
        console.error("Ошибка сети при отправке заказа:", e);
        showToast('Ошибка маршрутизации заказа', 'error');
    }
}

function showToast(text, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    
    const colors = {
        success: 'border-green-500 bg-green-950/80 text-green-200',
        error: 'border-red-500 bg-red-950/80 text-red-200',
        info: 'border-neon-blue bg-dark-800/90 text-blue-200'
    };

    toast.className = `border-l-4 p-4 rounded-r-xl glass-panel shadow-lg flex items-center gap-3 transition-all duration-300 transform translate-x-12 opacity-0 ${colors[type]}`;
    toast.innerHTML = `<i class="fa-solid ${type==='success'?'fa-circle-check':type==='error'?'fa-circle-exclamation':'fa-microchip'}"></i> <span class="text-sm font-semibold">${text}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-x-12', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => { toast.remove(); }, 300);
    }, 3500);
}
