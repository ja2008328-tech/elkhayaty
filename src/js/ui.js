import { globals } from "./globals.js";

export function updateHUD() {
  const stats = globals.playerStats;
  const inventory = globals.inventory;

  // تحديث شريط الصحة
  updateStatBar("health-bar", stats.health);

  // تحديث شريط الطاقة
  updateStatBar("energy-bar", stats.energy);

  // تحديث شريط الجوع
  updateStatBar("hunger-bar", stats.hunger);

  // تحديث شريط العطش
  updateStatBar("thirst-bar", stats.thirst);

  // تحديث درجة الحرارة
  updateTemperature(stats.temperature);

  // تحديث الخبرة
  updateXP(stats.xp);

  // تحديث المخزون
  updateInventoryDisplay(inventory);
}

function updateStatBar(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.width = `${value}%`;

    // تغيير اللون بناءً على القيمة
    if (value < 20) {
      element.style.backgroundColor = "#ff4444";
    } else if (value < 50) {
      element.style.backgroundColor = "#ffaa00";
    } else {
      element.style.backgroundColor = "#44ff44";
    }
  }
}

function updateTemperature(value) {
  const tempElement = document.getElementById("temperature-value");
  if (tempElement) {
    tempElement.textContent = `${Math.round(value)}°C`;

    // تغيير اللون بناءً على درجة الحرارة
    if (value < 30) {
      tempElement.style.color = "#4dabf7"; // أزرق بارد
    } else if (value < 70) {
      tempElement.style.color = "#ffd43b"; // أصفر معتدل
    } else {
      tempElement.style.color = "#ff6b6b"; // أحمر حار
    }
  }
}

function updateXP(value) {
  const xpElement = document.getElementById("xp-value");
  if (xpElement) {
    xpElement.textContent = `XP: ${Math.round(value)}`;
  }
}

function updateInventoryDisplay(inventory) {
  // تحديث أرقام المخزون
  for (const [key, value] of Object.entries(inventory)) {
    const element = document.getElementById(`inv-${key}`);
    if (element) {
      element.textContent = value;

      // إظهار/إخفاء العنصر بناءً على الكمية
      if (value > 0) {
        element.parentElement.style.display = "flex";
      } else {
        element.parentElement.style.display = "none";
      }
    }
  }

  // تحديث الـ Hotbar
  updateHotbar();
}

function updateHotbar() {
  const hotbarElements = document.querySelectorAll(".hotbar-slot");

  hotbarElements.forEach((slot, index) => {
    const item = globals.hotbar[index];

    // مسح المحتوى السابق
    slot.innerHTML = "";

    if (item) {
      // إنشاء أيقونة العنصر
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.textContent = getItemIcon(item);

      // إنشاء عداد الكمية
      const count = document.createElement("div");
      count.className = "item-count";
      count.textContent = item.count || 1;

      slot.appendChild(icon);
      slot.appendChild(count);

      // إضافة تأثير التحديد
      if (index === globals.currentSlot) {
        slot.classList.add("selected");
      } else {
        slot.classList.remove("selected");
      }
    } else {
      slot.classList.remove("selected");
    }
  });
}

function getItemIcon(itemType) {
  // تحديد الأيقونة بناءً على نوع العنصر
  switch (itemType) {
    case "wood":
      return "🪵";
    case "stone":
      return "🪨";
    case "flint":
      return "🔥";
    case "limestone":
      return "🏔️";
    case "desert_stone":
      return "🏜️";
    case "cactus":
      return "🌵";
    case "straw":
      return "🌾";
    case "stick":
      return "🥢";
    case "red_berry":
      return "🍓";
    case "yellow_berry":
      return "🍋";
    case "blue_berry":
      return "🫐";
    case "lilac_berry":
      return "🍇";
    case "apple":
      return "🍎";
    case "pomegranate":
      return "🍑";
    case "carrot":
      return "🥕";
    case "honey":
      return "🍯";
    case "butter":
      return "🧈";
    case "dried_milk":
      return "🥛";
    case "dates":
      return "🌴";
    default:
      return "📦";
  }
}

export function updateInteractionUI() {
  // سيتم تنفيذها من main.js
}
