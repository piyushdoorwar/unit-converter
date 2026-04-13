const categorySelect = document.getElementById("category");
const precisionSelect = document.getElementById("precision");
const valueInput = document.getElementById("value-input");
const fromUnitSelect = document.getElementById("from-unit");
const toUnitSelect = document.getElementById("to-unit");
const swapButton = document.getElementById("swap-units");
const copyButton = document.getElementById("copy-result");
const resultNode = document.getElementById("result");
const resultMetaNode = document.getElementById("result-meta");
const allResultsNode = document.getElementById("all-results");
const errorNode = document.getElementById("error");
const resizer = document.getElementById("resizer");
const workspace = document.querySelector(".workspace");
const leftPanel = document.querySelector(".panel");

let isResizing = false;

function getCurrentCategory() {
  return UNIT_CATEGORIES[categorySelect.value];
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function populateCategories() {
  Object.keys(UNIT_CATEGORIES).forEach((key) => {
    const category = UNIT_CATEGORIES[key];
    categorySelect.append(createOption(key, category.label));
  });

  categorySelect.value = DEFAULT_CATEGORY;
}

function populateUnits() {
  const category = getCurrentCategory();
  const unitEntries = Object.entries(category.units);

  fromUnitSelect.innerHTML = "";
  toUnitSelect.innerHTML = "";

  unitEntries.forEach(([unitKey, unit]) => {
    const text = `${unit.label} (${unitKey})`;
    fromUnitSelect.append(createOption(unitKey, text));
    toUnitSelect.append(createOption(unitKey, text));
  });

  if (unitEntries.length > 1) {
    fromUnitSelect.value = unitEntries[0][0];
    toUnitSelect.value = unitEntries[1][0];
  }
}

function showError(message) {
  errorNode.textContent = message;
  errorNode.style.display = message ? "block" : "none";
}

function createAllResultsMarkup(results, precision, category, sourceUnit) {
  return results
    .filter((entry) => entry.unitKey !== sourceUnit)
    .map((entry) => {
      const unit = category.units[entry.unitKey];
      const displayValue = roundToPrecision(entry.value, precision);

      return `
        <article class="result-row">
          <div class="result-row-unit">${unit.label}</div>
          <div class="result-row-key">${entry.unitKey}</div>
          <div class="result-row-value">${displayValue}</div>
        </article>
      `;
    })
    .join("");
}

function convertAndRender() {
  const validation = parseNumericInput(valueInput.value);
  const precision = Number(precisionSelect.value);
  const categoryKey = categorySelect.value;
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const category = UNIT_CATEGORIES[categoryKey];

  if (!validation.valid) {
    showError(validation.error);
    resultNode.textContent = "-";
    resultMetaNode.textContent = "";
    allResultsNode.innerHTML = '<p class="empty-state">Enter a valid number to view conversions.</p>';
    return;
  }

  showError("");

  const result = convertValue(categoryKey, validation.value, fromUnit, toUnit);
  resultNode.textContent = roundToPrecision(result, precision);
  resultMetaNode.textContent = `${validation.value} ${fromUnit} = ${roundToPrecision(result, precision)} ${toUnit}`;

  const allResults = convertToAllUnits(categoryKey, validation.value, fromUnit);
  allResultsNode.innerHTML = createAllResultsMarkup(allResults, precision, category, fromUnit);
}

function swapUnits() {
  const fromValue = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = fromValue;
  convertAndRender();
}

async function copyResult() {
  if (resultNode.textContent === "-") {
    return;
  }

  try {
    await navigator.clipboard.writeText(resultMetaNode.textContent || resultNode.textContent);
    copyButton.classList.add("copied");
    setTimeout(() => copyButton.classList.remove("copied"), 1200);
  } catch (error) {
    copyButton.classList.remove("copied");
  }
}

function initializeResize() {
  resizer.addEventListener("mousedown", () => {
    isResizing = true;
    resizer.classList.add("resizing");
  });

  document.addEventListener("mousemove", (event) => {
    if (!isResizing || window.innerWidth < 1024) {
      return;
    }

    const workspaceRect = workspace.getBoundingClientRect();
    const minWidth = 280;
    const maxWidth = workspaceRect.width - minWidth;
    const proposedLeft = event.clientX - workspaceRect.left;
    const boundedLeft = Math.max(minWidth, Math.min(proposedLeft, maxWidth));

    leftPanel.style.flex = "0 0 auto";
    leftPanel.style.width = `${boundedLeft}px`;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    resizer.classList.remove("resizing");
  });
}

function bindEvents() {
  categorySelect.addEventListener("change", () => {
    populateUnits();
    convertAndRender();
  });

  [precisionSelect, fromUnitSelect, toUnitSelect].forEach((node) => {
    node.addEventListener("change", convertAndRender);
  });

  valueInput.addEventListener("input", convertAndRender);
  swapButton.addEventListener("click", swapUnits);
  copyButton.addEventListener("click", copyResult);
}

function init() {
  populateCategories();
  populateUnits();
  bindEvents();
  initializeResize();

  valueInput.value = "100";
  convertAndRender();
}

init();
