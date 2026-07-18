(function () {
  "use strict";

  const STORAGE_KEY = "movingChecklistData";

  const DEFAULT_DATA = [
    {
      id: "month",
      title: "1ヶ月前まで",
      items: [
        "引っ越し業者の選定・見積もり依頼",
        "新居の賃貸契約・初期費用の準備",
        "現住居の解約連絡（管理会社・大家）",
        "駐車場の解約・契約",
        "子どもの転校・転園手続きの確認",
        "粗大ゴミ回収の予約",
        "不用品・家具家電の処分方法を決める",
      ],
    },
    {
      id: "twoweeks",
      title: "2週間前まで",
      items: [
        "荷造り開始（普段使わないものから）",
        "梱包資材（段ボール・ガムテープ）の準備",
        "インターネット回線の移転・新規契約",
        "転出届の準備（役所へ提出）",
        "国民健康保険・年金の手続き確認",
      ],
    },
    {
      id: "week",
      title: "1週間前まで",
      items: [
        "郵便物の転送届（郵便局）",
        "電気・ガス・水道の停止と開始の手続き",
        "荷造りの仕上げ",
        "引っ越し業者への最終確認（日時・搬出入経路）",
        "新居の掃除・採寸の最終チェック",
      ],
    },
    {
      id: "dayBefore",
      title: "前日まで",
      items: [
        "冷蔵庫の中身を整理・霜取り",
        "洗濯機の水抜き",
        "貴重品・重要書類をまとめる",
        "スマホ・充電器などすぐ使うものをまとめる",
      ],
    },
    {
      id: "moveDay",
      title: "当日",
      items: [
        "荷物の搬出立ち会い",
        "旧居の掃除・忘れ物確認",
        "鍵の返却",
        "新居での荷物搬入立ち会い",
        "ライフライン（電気・ガス・水道）の開通確認",
      ],
    },
    {
      id: "after",
      title: "引っ越し後の手続き",
      items: [
        "転入届の提出（役所）",
        "マイナンバーカードの住所変更",
        "運転免許証の住所変更",
        "銀行・クレジットカードの住所変更",
        "各種保険・勤務先への住所変更連絡",
        "荷解き・段ボールの処分",
      ],
    },
  ];

  let nextId = 1;
  function generateId() {
    return "item-" + Date.now() + "-" + nextId++;
  }

  function buildDefaultData() {
    return DEFAULT_DATA.map((category) => ({
      id: category.id,
      title: category.title,
      items: category.items.map((text) => ({
        id: generateId(),
        text,
        checked: false,
      })),
    }));
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore corrupt data, fall back to defaults
    }
    return buildDefaultData();
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  let data = loadData();
  const collapsedState = {};

  const categoriesEl = document.getElementById("categories");
  const categoryTemplate = document.getElementById("categoryTemplate");
  const itemTemplate = document.getElementById("itemTemplate");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const resetBtn = document.getElementById("resetBtn");

  function updateProgress() {
    let total = 0;
    let done = 0;
    data.forEach((category) => {
      category.items.forEach((item) => {
        total++;
        if (item.checked) done++;
      });
    });
    const pct = total ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressText.textContent = `${done} / ${total} 完了`;
  }

  function updateCategoryCount(categoryEl, category) {
    const countEl = categoryEl.querySelector(".category-count");
    const done = category.items.filter((i) => i.checked).length;
    countEl.textContent = `${done} / ${category.items.length}`;
  }

  function render() {
    categoriesEl.innerHTML = "";
    data.forEach((category) => {
      const categoryFrag = categoryTemplate.content.cloneNode(true);
      const categoryEl = categoryFrag.querySelector(".category");
      const titleEl = categoryFrag.querySelector(".category-title");
      const listEl = categoryFrag.querySelector(".item-list");
      const headerBtn = categoryFrag.querySelector(".category-header");
      const form = categoryFrag.querySelector(".add-item-form");
      const input = categoryFrag.querySelector(".add-item-input");

      titleEl.textContent = category.title;

      if (collapsedState[category.id]) {
        categoryEl.classList.add("collapsed");
      }

      headerBtn.addEventListener("click", () => {
        collapsedState[category.id] = !collapsedState[category.id];
        categoryEl.classList.toggle("collapsed", collapsedState[category.id]);
      });

      category.items.forEach((item) => {
        const itemFrag = itemTemplate.content.cloneNode(true);
        const li = itemFrag.querySelector(".item");
        const checkbox = itemFrag.querySelector(".item-checkbox");
        const textEl = itemFrag.querySelector(".item-text");
        const deleteBtn = itemFrag.querySelector(".item-delete");

        checkbox.checked = item.checked;
        textEl.textContent = item.text;

        checkbox.addEventListener("change", () => {
          item.checked = checkbox.checked;
          saveData();
          updateProgress();
          updateCategoryCount(categoryEl, category);
        });

        deleteBtn.addEventListener("click", () => {
          category.items = category.items.filter((i) => i.id !== item.id);
          saveData();
          li.remove();
          updateProgress();
          updateCategoryCount(categoryEl, category);
        });

        listEl.appendChild(itemFrag);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        category.items.push({ id: generateId(), text, checked: false });
        saveData();
        input.value = "";
        render();
      });

      updateCategoryCount(categoryEl, category);
      categoriesEl.appendChild(categoryFrag);
    });

    updateProgress();
  }

  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "チェック状態と追加した項目をすべて初期化します。よろしいですか？"
    );
    if (!confirmed) return;
    data = buildDefaultData();
    saveData();
    render();
  });

  render();
})();
