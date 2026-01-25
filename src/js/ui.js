import { globals } from './globals.js';

const recipes = [
    { id: 'axe', name: 'فأس حجري', wood: 10, stone: 5 },
    { id: 'wall', name: 'جدار حماية', wood: 0, stone: 20 }
];

export function toggleShop() {
    const shop = document.getElementById('shop-ui');
    const overlay = document.getElementById('shop-overlay');
    globals.isShopOpen = !globals.isShopOpen; 
    if(globals.isShopOpen) {
        shop.style.display = 'block';
        overlay.style.display = 'block';
        renderShop();
    } else {
        shop.style.display = 'none';
        overlay.style.display = 'none';
    }
}

export function buyItem(id) {
    const item = recipes.find(r => r.id === id);
    if(globals.inventory.wood >= item.wood && globals.inventory.stone >= item.stone) {
        globals.inventory.wood -= item.wood;
        globals.inventory.stone -= item.stone;
        document.getElementById('wood-count').innerText = globals.inventory.wood;
        document.getElementById('stone-count').innerText = globals.inventory.stone;
        alert("تمت صناعة " + item.name);
        renderShop();
    }
}

export function renderShop() {
    const list = document.getElementById('item-list');
    list.innerHTML = ''; 
    recipes.forEach(item => {
        const canBuy = globals.inventory.wood >= item.wood && globals.inventory.stone >= item.stone;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin:10px 0;">
                <span>${item.name}</span>
                <button onclick="window.buyItem('${item.id}')" ${!canBuy ? 'disabled' : ''}>صناعة</button>
            </div>`;
    });
}