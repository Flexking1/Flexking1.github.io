// URL твоего локального FastAPI сервера
const API_URL = "http://127.0.0.1:8000/api";

// Базовая база данных товаров (хранится в localStorage, чтобы изменения не пропадали при обновлении)
let defaultProducts = [
    { id: 1, name: "Neon Matrix Skin", price: 299, color: "linear-gradient(45deg, #ff0055, #00ffcc)", specs: "Формат: PNG, 64x64, Анимированные светящиеся линии, Киберпанк" },
    { id: 2, name: "Cyber Launcher Premium", price: 599, color: "linear-gradient(45deg, #00ffcc, #0055ff)", specs: "Engine: CustomTkinter, Авто-апдейт модов, Оптимизация JVM" },
    { id: 3, name: "TinSy Tunnel Node", price: 150, color: "linear-gradient(45deg, #b000ff, #ff0055)", specs: "Протокол: VLESS, Reality, Sing-box ядро, Трафик: Безлимит" }
];

let products = JSON.parse(localStorage.getItem('shop_products')) || defaultProducts;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let cart = [];
let localOrders = JSON.parse(localStorage.getItem('orders')) || [
    { id: 1, date: '29.06.2026', time: '12:53:53', itemsCount: 1 },
    { id: 2, date: '29.06.2026', time: '10:32:05', itemsCount: 1 }
];

// Стейт временных данных для авторизации
let tempEmail = null;

// Элементы DOM
const authModal = document.getElementById('authModal');
const cartModal = document.getElementById('cartModal');
const profileBtn = document.getElementById('profileBtn');
const cartBtn = document.getElementById('cartBtn');
const closeAuth = document.getElementById('closeAuth');
const closeCart = document.getElementById('closeCart');

const emailForm = document.getElementById('emailForm');
const codeForm = document.getElementById('codeForm');
const userEmailInput = document.getElementById('userEmail');
const verifyCodeInput = document.getElementById('verifyCode');
const authModalTitle = document.getElementById('authModalTitle');

const profileDashboard = document.getElementById('profileDashboard');
const catalogSection = document.getElementById('catalog');
const catalogGrid = document.getElementById('catalogGrid');
const toCatalogLink = document.getElementById('toCatalogLink');
const dashEmail = document.getElementById('dashEmail');
const dashEmailInput = document.getElementById('dashEmailInput');
const userBadge = document.getElementById('userBadge');
const ownerMenuLi = document.getElementById('ownerMenuLi');
const logoutDashBtn = document.getElementById('logoutDashBtn');
const ordersHistoryBody = document.getElementById('ordersHistoryBody');

const addProductForm = document.getElementById('addProductForm');
const toastNotification = document.getElementById('toastNotification');

const cartItemsList = document.getElementById('cartItemsList');
const totalPriceEl = document.getElementById('totalPrice');
const cartCount = document.getElementById('cartCount');
const paySbpBtn = document.getElementById('paySbpBtn');
const sbpQrState = document.getElementById('sbpQrState');
const mockSuccessPay = document.getElementById('mockSuccessPay');

// ================= СЕКЦИЯ КАТАЛОГА И ТОВАРОВ =================

// Инициализация витрины товаров
function renderCatalog() {
    catalogGrid.innerHTML = '';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = p.id;
        
        // Кнопка удаления видна только если авторизован Owner (nikitapilman556@gmail.com)
        const deleteBtnHtml = (currentUser && currentUser.email === 'nikitapilman556@gmail.com') 
            ? `<button class="delete-item-btn" onclick="deleteProduct(${p.id})">&times;</button>` 
            : '';

        card.innerHTML = `
            ${deleteBtnHtml}
            <div class="product-img" style="background: ${p.color};"></div>
            <h3>${p.name}</h3>
            <div class="specs-text">${p.specs}</div>
            <p class="price">${p.price} ₽</p>
            <button class="buy-btn" onclick="addToCart(${p.id})">В корзину</button>
        `;
        catalogGrid.appendChild(card);
    });
}

// Удаление товара (доступно только Owner)
window.deleteProduct = (id) => {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('shop_products', JSON.stringify(products));
    renderCatalog();
    showToast("Товар успешно удален с витрины");
};

// Добавление нового товара из панели Owner
addProductForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('prodName').value.trim();
    const price = parseInt(document.getElementById('prodPrice').value);
    const specs = document.getElementById('prodSpecs').value.trim();
    const color = document.getElementById('prodColor').value;

    if (name && price && specs) {
        const newProd = {
            id: Date.now(),
            name: name,
            price: price,
            specs: specs,
            color: color
        };
        products.push(newProd);
        localStorage.setItem('shop_products', JSON.stringify(products));
        renderCatalog();
        addProductForm.reset();
        showToast("Товар успешно опубликован на сайте!");
    }
};

// Добавление товара в корзину
window.addToCart = (id) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
        cart.push(prod);
        cartCount.textContent = cart.length;
        showToast(`Добавлено в корзину: ${prod.name}`);
    }
};

// ================= АВТОРИЗАЦИЯ И РАБОТА С СЕРВЕРОМ =================

// ШАГ 1: Запрос кода у FastAPI сервера
emailForm.onsubmit = async (e) => {
    e.preventDefault();
    tempEmail = userEmailInput.value.trim();
    
    if (tempEmail) {
        try {
            showToast("Отправка кода авторизации на почту...");
            
            const response = await fetch(`${API_URL}/send-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: tempEmail })
            });

            const result = await response.json();

            if (response.ok) {
                emailForm.classList.add('hidden');
                codeForm.classList.remove('hidden');
                authModalTitle.textContent = 'Введите код из письма';
                showToast(`Код отправлен на почту ${tempEmail}`);
            } else {
                alert(`Ошибка сервера: ${result.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert("Не удалось связаться с сервером. Убедись, что твой server.py запущен!");
        }
    }
};

// ШАГ 2: Проверка введенного кода сервером
codeForm.onsubmit = async (e) => {
    e.preventDefault();
    const typedCode = verifyCodeInput.value.trim();
    
    if (typedCode) {
        try {
            const response = await fetch(`${API_URL}/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: tempEmail, code: typedCode })
            });

            const result = await response.json();

            if (response.ok) {
                currentUser = { email: tempEmail };
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                initUser();
                authModal.style.display = 'none';
                
                // Возвращаем форму входа в исходное состояние для будущих сессий
                emailForm.classList.remove('hidden');
                codeForm.classList.add('hidden');
                verifyCodeInput.value = '';
                userEmailInput.value = '';
                authModalTitle.textContent = 'Вход в систему';

                // Сразу открываем ЛК
                catalogSection.classList.add('hidden');
                profileDashboard.classList.remove('hidden');
                showToast("Вы успешно вошли в систему!");
            } else {
                alert(result.detail || "Введен неверный код!");
            }
        } catch (error) {
            console.error(error);
            alert("Ошибка при проверке кода на сервере.");
        }
    }
};

// Синхронизация интерфейса в зависимости от того, вошел ли юзер и какая у него почта
function initUser() {
    if (currentUser) {
        profileBtn.textContent = 'Профиль';
        dashEmail.textContent = currentUser.email;
        dashEmailInput.value = currentUser.email;
        
        // Проверка на Owner-права
        if (currentUser.email === 'nikitapilman556@gmail.com') {
            userBadge.textContent = 'Owner';
            userBadge.className = 'user-badge owner';
            ownerMenuLi.classList.remove('hidden'); // Показываем админку
        } else {
            userBadge.textContent = 'Cyber-User';
            userBadge.className = 'user-badge';
            ownerMenuLi.classList.add('hidden'); // Скрываем админку
        }
        renderOrders();
    } else {
        profileBtn.textContent = 'Войти';
        profileDashboard.classList.add('hidden');
        catalogSection.classList.remove('hidden');
        ownerMenuLi.classList.add('hidden');
    }
    renderCatalog();
}

// ================= ЛИЧНЫЙ КАБИНЕТ И ВКЛАДКИ (ЯНДЕКС МАРКЕТ СТАЙЛ) =================

// Переключение вкладок в левом сайдбаре
document.querySelectorAll('.profile-menu .menu-link').forEach(btn => {
    btn.onclick = (e) => {
        // Снимаем класс active со всех ссылок меню
        document.querySelectorAll('.profile-menu .menu-link').forEach(l => l.classList.remove('active'));
        // Скрываем весь контент вкладок
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
        
        // Подсвечиваем текущую кнопку и открываем её таб
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        const targetTabId = targetBtn.getAttribute('data-target');
        document.getElementById(targetTabId).classList.remove('hidden');

        // Если выбрана вкладка "Адреса доставки", собираем/перерисовываем Яндекс Карту
        if (targetTabId === 'addresses-tab') {
            setTimeout(initMap, 200);
        }
    };
});

// Рендер истории заказов
function renderOrders() {
    ordersHistoryBody.innerHTML = '';
    localOrders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="status-success">Выполнен</td>
            <td>${order.date}<br><span class="time-text">${order.time}</span></td>
            <td>${order.itemsCount} х <span class="arrow-pink">&gt;</span></td>
        `;
        ordersHistoryBody.appendChild(tr);
    });
}

// ================= ИНТЕГРАЦИЯ ЯНДЕКС КАРТЫ =================
let myMap = null;
function initMap() {
    // Если объект карты уже создан, корректно его удаляем, чтобы переинициализировать без багов
    if (myMap) {
        myMap.destroy();
    }
    
    // Создаем карту с центром на Москве
    myMap = new ymaps.Map("map", {
        center: [55.755826, 37.617633],
        zoom: 11
    });

    // Набор точек отделений Почты России
    const postOffices = [
        { coords: [55.757937, 37.611111], text: "Почта России №101000 (Главпочтамт, ул. Мясницкая, 26)" },
        { coords: [55.741544, 37.624510], text: "Отделение Почты 115035 (Пятницкая ул., 2/8с1)" },
        { coords: [55.765432, 37.594321], text: "Отделение Почты 123001 (Б. Козихинский пер., 22)" }
    ];

    // Добавление кастомных неоновых меток на карту
    postOffices.forEach(office => {
        const placemark = new ymarks.Placemark(office.coords, {
            balloonContent: `<strong>💥 NEON PICKUP POINT</strong><br>${office.text}`
        }, {
            preset: 'islands#pinkDotIcon'
        });
        myMap.geoObjects.add(placemark);
    });
}

// ================= КОРЗИНА И ОПЛАТА =================

function renderCart() {
    cartItemsList.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p style="color:#aaa; text-align:center;">Корзина пуста</p>';
        paySbpBtn.classList.add('hidden');
        totalPriceEl.textContent = 0;
        return;
    }
    
    cart.forEach(item => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `<span>${item.name}</span><span>${item.price} ₽</span>`;
        cartItemsList.appendChild(div);
    });
    
    totalPriceEl.textContent = total;
    paySbpBtn.classList.remove('hidden');
}

paySbpBtn.onclick = () => sbpQrState.classList.remove('hidden');

// Мокаем успешное подтверждение транзакции по QR коду
mockSuccessPay.onclick = () => {
    const now = new Date();
    localOrders.unshift({
        id: Date.now(),
        date: now.toLocaleDateString('ru-RU'),
        time: now.toLocaleTimeString('ru-RU'),
        itemsCount: cart.length
    });
    localStorage.setItem('orders', JSON.stringify(localOrders));
    
    showToast("Оплата по СБП прошла успешно!");
    cart = [];
    cartCount.textContent = 0;
    cartModal.style.display = 'none';
    sbpQrState.classList.add('hidden');
    
    if (currentUser) renderOrders();
};

// ================= НАВИГАЦИЯ И ВСПОМОГАТЕЛЬНЫЕ ОКНА =================

profileBtn.onclick = () => {
    if (currentUser) {
        catalogSection.classList.add('hidden');
        profileDashboard.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        authModal.style.display = 'block';
    }
};

toCatalogLink.onclick = (e) => {
    e.preventDefault();
    profileDashboard.classList.add('hidden');
    catalogSection.classList.remove('hidden');
};

logoutDashBtn.onclick = () => {
    currentUser = null;
    localStorage.removeItem('user');
    initUser();
    showToast("Вы вышли из аккаунта");
};

closeAuth.onclick = () => {
    authModal.style.display = 'none';
    emailForm.classList.remove('hidden');
    codeForm.classList.add('hidden');
};

closeCart.onclick = () => { 
    cartModal.style.display = 'none'; 
    sbpQrState.classList.add('hidden'); 
};

cartBtn.onclick = () => { 
    cartModal.style.display = 'block'; 
    renderCart(); 
};

// Логика кастомных всплывающих уведомлений (Тостов)
function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => toastNotification.classList.add('hidden'), 5000);
}

// Первый запуск приложения при загрузке страницы
initUser();
