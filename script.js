const productInput = document.getElementById("productInput");
const dataTypeSelect = document.getElementById("dataTypeSelect");
const fileInput = document.getElementById("fileInput");
const parseBtn = document.getElementById("parseBtn");
const sampleJsonBtn = document.getElementById("sampleJsonBtn");
const sampleXmlBtn = document.getElementById("sampleXmlBtn");
const validateBtn = document.getElementById("validateBtn");
const cleanBtn = document.getElementById("cleanBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("statusBox");
const totalProductsStat = document.getElementById("totalProductsStat");
const validProductsStat = document.getElementById("validProductsStat");
const invalidProductsStat = document.getElementById("invalidProductsStat");
const categoriesStat = document.getElementById("categoriesStat");
const averagePriceStat = document.getElementById("averagePriceStat");
const exportSizeStat = document.getElementById("exportSizeStat");
const categoryFilter = document.getElementById("categoryFilter");
const minPriceInput = document.getElementById("minPriceInput");
const maxPriceInput = document.getElementById("maxPriceInput");
const searchInput = document.getElementById("searchInput");
const validOnlyCheck = document.getElementById("validOnlyCheck");
const invalidOnlyCheck = document.getElementById("invalidOnlyCheck");
const productTableBody = document.getElementById("productTableBody");
const cleanJsonPreview = document.getElementById("cleanJsonPreview");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");

let rawProductText = "";
let productDataType = "auto";
let importedProducts = [];
let validProducts = [];
let invalidProducts = [];
let filteredProducts = [];
let cleanedProducts = [];
let validationErrors = [];

/**
 * Detects whether pasted product data appears to be JSON, XML, or unknown.
 * @param {string} text - Raw product data text.
 * @returns {string} The detected data type.
 */
function detectDataType(text) {
    const trimmedText = text.trim();

    if (!trimmedText) {
        return "unknown";
    }

    if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
        return "json";
    }

    if (trimmedText.startsWith("<")) {
        return "xml";
    }

    return "unknown";
}

/**
 * Parses product data using JSON.parse or DOMParser based on selected type.
 * @param {string} text - Raw product data text.
 * @param {string} preferredType - User-selected data type.
 * @returns {object} Parsed result object.
 */
function parseProductData(text, preferredType) {
    const detectedType = preferredType === "auto" ? detectDataType(text) : preferredType;

    try {
        if (detectedType === "json") {
            return {
                valid: true,
                type: "json",
                products: parseJsonProducts(text)
            };
        }

        if (detectedType === "xml") {
            return {
                valid: true,
                type: "xml",
                products: parseXmlProducts(text)
            };
        }

        return {
            valid: false,
            error: "Unable to detect data type. Choose JSON or XML manually."
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * Parses product JSON from an array or an object with a products array.
 * @param {string} text - Raw JSON text.
 * @returns {Array<object>} Product records.
 */
function parseJsonProducts(text) {
    const parsedData = JSON.parse(text);

    if (Array.isArray(parsedData)) {
        return parsedData;
    }

    if (parsedData && Array.isArray(parsedData.products)) {
        return parsedData.products;
    }

    throw new Error("JSON must be an array of products or an object with a products array.");
}

/**
 * Parses XML product nodes into plain product objects.
 * @param {string} text - Raw XML text.
 * @returns {Array<object>} Product records.
 */
function parseXmlProducts(text) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");
    const parserError = xmlDoc.querySelector("parsererror");

    if (parserError) {
        throw new Error("Invalid XML. Check tags, nesting, and closing elements.");
    }

    const productNodes = Array.from(xmlDoc.querySelectorAll("product"));

    if (productNodes.length === 0) {
        throw new Error("XML must include at least one product node.");
    }

    return productNodes.map((productNode) => ({
        name: productNode.querySelector("name")?.textContent || "",
        sku: productNode.querySelector("sku")?.textContent || "",
        category: productNode.querySelector("category")?.textContent || "",
        price: productNode.querySelector("price")?.textContent || "",
        stock: productNode.querySelector("stock")?.textContent || "",
        description: productNode.querySelector("description")?.textContent || ""
    }));
}

/**
 * Normalizes one product by trimming strings and converting numeric fields.
 * @param {object} product - Raw product object.
 * @param {number} index - Product row index.
 * @returns {object} Normalized product.
 */
function normalizeProduct(product, index) {
    const normalizedProduct = {
        _rowId: index + 1,
        name: String(product.name ?? "").trim(),
        sku: String(product.sku ?? "").trim(),
        category: String(product.category ?? "").trim(),
        price: product.price === "" || product.price === null || product.price === undefined ? "" : Number(product.price),
        stock: product.stock === "" || product.stock === null || product.stock === undefined ? "" : Number(product.stock),
        description: String(product.description ?? "").trim(),
        _issues: []
    };

    return normalizedProduct;
}

/**
 * Validates one product against required product import rules.
 * @param {object} product - Normalized product object.
 * @returns {Array<string>} Validation issue list.
 */
function validateProduct(product) {
    const issues = [];

    if (!product.name) {
        issues.push("Name is required.");
    }

    if (!product.sku) {
        issues.push("SKU is required.");
    }

    if (!product.category) {
        issues.push("Category is required.");
    }

    if (product.price === "" || Number.isNaN(product.price)) {
        issues.push("Price is required and must be a valid number.");
    } else if (product.price < 0) {
        issues.push("Price must be greater than or equal to 0.");
    }

    if (product.stock !== "" && (Number.isNaN(product.stock) || product.stock < 0)) {
        issues.push("Stock must be a valid number greater than or equal to 0.");
    }

    return issues;
}

/**
 * Validates all products and separates valid and invalid rows.
 * @param {Array<object>} products - Normalized products.
 * @returns {void}
 */
function validateProducts(products) {
    validProducts = [];
    invalidProducts = [];
    validationErrors = [];

    products.forEach((product) => {
        const issues = validateProduct(product);
        product._issues = issues;

        if (issues.length > 0) {
            invalidProducts.push(product);
            validationErrors.push({
                rowId: product._rowId,
                issues
            });
        } else {
            validProducts.push(product);
        }
    });
}

/**
 * Creates clean export-ready product objects with internal data removed.
 * @param {Array<object>} products - Products to clean.
 * @returns {Array<object>} Clean product records.
 */
function cleanProductData(products) {
    return products.map((product) => {
        const cleanProduct = {
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price,
            stock: product.stock,
            description: product.description
        };

        Object.keys(cleanProduct).forEach((key) => {
            if (cleanProduct[key] === "" || cleanProduct[key] === null || cleanProduct[key] === undefined) {
                delete cleanProduct[key];
            }
        });

        return cleanProduct;
    });
}

/**
 * Renders product rows into the product table.
 * @param {Array<object>} products - Products to display.
 * @returns {void}
 */
function renderProductTable(products) {
    if (products.length === 0) {
        productTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">No products match the current view.</div>
        </td>
      </tr>
    `;
        return;
    }

    productTableBody.innerHTML = products.map((product) => {
        const isValid = product._issues.length === 0;
        const issueMarkup = isValid
            ? "None"
            : `<ul class="issue-list">${product._issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`;

        return `
      <tr class="${isValid ? "valid-row" : "invalid-row"}">
        <td><span class="status-chip ${isValid ? "valid" : "invalid"}">${isValid ? "Valid" : "Invalid"}</span></td>
        <td>${escapeHtml(product.name || "Missing")}</td>
        <td>${escapeHtml(product.sku || "Missing")}</td>
        <td>${escapeHtml(product.category || "Missing")}</td>
        <td>${product.price === "" || Number.isNaN(product.price) ? "Invalid" : formatCurrency(product.price)}</td>
        <td>${product.stock === "" ? "N/A" : escapeHtml(String(product.stock))}</td>
        <td>${issueMarkup}</td>
      </tr>
    `;
    }).join("");
}

/**
 * Renders product counts, categories, average price, and export size.
 * @returns {void}
 */
function renderStats() {
    const categories = new Set(importedProducts.map((product) => product.category).filter(Boolean));
    const pricedProducts = validProducts.filter((product) => typeof product.price === "number" && !Number.isNaN(product.price));
    const totalPrice = pricedProducts.reduce((sum, product) => sum + product.price, 0);
    const averagePrice = pricedProducts.length > 0 ? totalPrice / pricedProducts.length : 0;
    const exportText = JSON.stringify(cleanedProducts, null, 2);

    totalProductsStat.textContent = String(importedProducts.length);
    validProductsStat.textContent = String(validProducts.length);
    invalidProductsStat.textContent = String(invalidProducts.length);
    categoriesStat.textContent = String(categories.size);
    averagePriceStat.textContent = formatCurrency(averagePrice);
    exportSizeStat.textContent = formatBytes(new Blob([exportText]).size);
}

/**
 * Populates the category dropdown with unique product categories.
 * @param {Array<object>} products - Products used to build category options.
 * @returns {void}
 */
function populateCategoryFilter(products) {
    const currentValue = categoryFilter.value;
    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();

    categoryFilter.innerHTML = `<option value="">All Categories</option>`;

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    if (categories.includes(currentValue)) {
        categoryFilter.value = currentValue;
    }
}

/**
 * Applies category, price, search, and validity filters to products.
 * @returns {void}
 */
function filterProducts() {
    const selectedCategory = categoryFilter.value;
    const minPrice = minPriceInput.value === "" ? null : Number(minPriceInput.value);
    const maxPrice = maxPriceInput.value === "" ? null : Number(maxPriceInput.value);
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (validOnlyCheck.checked && invalidOnlyCheck.checked) {
        invalidOnlyCheck.checked = false;
    }

    filteredProducts = importedProducts.filter((product) => {
        const isValid = product._issues.length === 0;
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesMinPrice = minPrice === null || (!Number.isNaN(product.price) && product.price >= minPrice);
        const matchesMaxPrice = maxPrice === null || (!Number.isNaN(product.price) && product.price <= maxPrice);
        const matchesSearch = !searchTerm
            || product.name.toLowerCase().includes(searchTerm)
            || product.sku.toLowerCase().includes(searchTerm);
        const matchesValidOnly = !validOnlyCheck.checked || isValid;
        const matchesInvalidOnly = !invalidOnlyCheck.checked || !isValid;

        return matchesCategory
            && matchesMinPrice
            && matchesMaxPrice
            && matchesSearch
            && matchesValidOnly
            && matchesInvalidOnly;
    });

    renderProductTable(filteredProducts);
}

/**
 * Renders the cleaned JSON preview panel.
 * @returns {void}
 */
function renderCleanPreview() {
    cleanJsonPreview.textContent = JSON.stringify(cleanedProducts, null, 2);
}

/**
 * Handles parsing, normalization, validation, rendering, and preview generation.
 * @returns {void}
 */
function handleParseProducts() {
    rawProductText = productInput.value.trim();
    productDataType = dataTypeSelect.value;

    if (!rawProductText) {
        showStatus("Paste JSON/XML product data or import a file first.", "error");
        return;
    }

    setLoading(true);

    window.setTimeout(() => {
        const parsedResult = parseProductData(rawProductText, productDataType);

        if (!parsedResult.valid) {
            importedProducts = [];
            validProducts = [];
            invalidProducts = [];
            filteredProducts = [];
            cleanedProducts = [];
            validationErrors = [];
            renderProductTable([]);
            renderCleanPreview();
            renderStats();
            showStatus(parsedResult.error, "error");
            setLoading(false);
            return;
        }

        importedProducts = parsedResult.products.map((product, index) => normalizeProduct(product, index));
        validateProducts(importedProducts);
        filteredProducts = [...importedProducts];
        cleanedProducts = cleanProductData(validProducts);

        populateCategoryFilter(importedProducts);
        filterProducts();
        renderCleanPreview();
        renderStats();
        showStatus(`Parsed ${importedProducts.length} ${parsedResult.type.toUpperCase()} products. ${invalidProducts.length} invalid rows found.`, "success");
        setLoading(false);
    }, 150);
}

/**
 * Reads an uploaded JSON or XML file and parses it.
 * @param {Event} event - File input change event.
 * @returns {void}
 */
function handleFileImport(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const isSupportedFile = file.name.toLowerCase().endsWith(".json") || file.name.toLowerCase().endsWith(".xml");

    if (!isSupportedFile) {
        showStatus("Please import a .json or .xml file.", "error");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        productInput.value = String(reader.result || "");
        showStatus(`Imported ${file.name}. Parsing product data now.`, "info");
        handleParseProducts();
    });

    reader.addEventListener("error", () => {
        showStatus("File could not be read. Try another file.", "error");
    });

    reader.readAsText(file);
}

/**
 * Loads realistic sample JSON with valid and invalid products.
 * @returns {void}
 */
function loadSampleJson() {
    productInput.value = JSON.stringify({
        products: [
            {
                name: "Wireless Mouse",
                sku: "WM-1001",
                category: "Accessories",
                price: 1800,
                stock: 35,
                description: "Ergonomic wireless mouse"
            },
            {
                name: "Mechanical Keyboard",
                sku: "KB-2201",
                category: "Accessories",
                price: 6500,
                stock: 12,
                description: "RGB mechanical keyboard"
            },
            {
                name: "USB-C Hub",
                sku: "HUB-7740",
                category: "Adapters",
                price: 3200,
                stock: 20
            },
            {
                name: "",
                sku: "BAD-001",
                category: "Invalid",
                price: -500,
                stock: 5
            }
        ]
    }, null, 2);

    dataTypeSelect.value = "json";
    handleParseProducts();
}

/**
 * Loads realistic sample XML with valid and invalid products.
 * @returns {void}
 */
function loadSampleXml() {
    productInput.value = `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <product>
    <name>Wireless Mouse</name>
    <sku>WM-1001</sku>
    <category>Accessories</category>
    <price>1800</price>
    <stock>35</stock>
    <description>Ergonomic wireless mouse</description>
  </product>
  <product>
    <name>Mechanical Keyboard</name>
    <sku>KB-2201</sku>
    <category>Accessories</category>
    <price>6500</price>
    <stock>12</stock>
    <description>RGB mechanical keyboard</description>
  </product>
  <product>
    <name>USB-C Hub</name>
    <sku>HUB-7740</sku>
    <category>Adapters</category>
    <price>3200</price>
    <stock>20</stock>
  </product>
  <product>
    <name></name>
    <sku>BAD-001</sku>
    <category>Invalid</category>
    <price>-500</price>
    <stock>5</stock>
  </product>
</products>`;

    dataTypeSelect.value = "xml";
    handleParseProducts();
}

/**
 * Copies cleaned JSON to the clipboard.
 * @returns {void}
 */
function copyCleanJson() {
    const cleanJson = JSON.stringify(cleanedProducts, null, 2);

    if (cleanedProducts.length === 0) {
        showStatus("No clean products available to copy.", "error");
        return;
    }

    navigator.clipboard.writeText(cleanJson)
        .then(() => {
            showStatus("Clean JSON copied to clipboard.", "success");
        })
        .catch(() => {
            showStatus("Clipboard copy failed. Check browser permissions.", "error");
        });
}

/**
 * Downloads cleaned product data as clean-products.json.
 * @returns {void}
 */
function downloadCleanJson() {
    if (cleanedProducts.length === 0) {
        showStatus("No clean products available to download.", "error");
        return;
    }

    const cleanJson = JSON.stringify(cleanedProducts, null, 2);
    const blob = new Blob([cleanJson], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = "clean-products.json";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);

    showStatus("Downloaded clean-products.json.", "success");
}

/**
 * Formats numeric prices as currency.
 * @param {number} value - Price value.
 * @returns {string} Formatted currency value.
 */
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(value || 0);
}

/**
 * Converts bytes to a readable file size string.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Readable file size.
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB"];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const safeUnitIndex = Math.min(unitIndex, units.length - 1);
    const value = bytes / Math.pow(1024, safeUnitIndex);

    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[safeUnitIndex]}`;
}

/**
 * Escapes plain text before inserting it into trusted generated HTML.
 * @param {string} str - Text to escape.
 * @returns {string} Escaped text.
 */
function escapeHtml(str) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    };

    return String(str).replace(/[&<>"']/g, (character) => replacements[character]);
}

/**
 * Shows a status message with a visual status type.
 * @param {string} message - Status message.
 * @param {string} type - Status type.
 * @returns {void}
 */
function showStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = `status-box ${type || ""}`.trim();
}

/**
 * Disables or enables the parse button while work is running.
 * @param {boolean} isLoading - Loading state.
 * @returns {void}
 */
function setLoading(isLoading) {
    parseBtn.disabled = isLoading;
    parseBtn.textContent = isLoading ? "Parsing..." : "Parse Products";
}

/**
 * Resets app state, controls, table, preview, stats, file input, and status.
 * @returns {void}
 */
function handleClear() {
    rawProductText = "";
    productDataType = "auto";
    importedProducts = [];
    validProducts = [];
    invalidProducts = [];
    filteredProducts = [];
    cleanedProducts = [];
    validationErrors = [];

    productInput.value = "";
    dataTypeSelect.value = "auto";
    fileInput.value = "";
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    minPriceInput.value = "";
    maxPriceInput.value = "";
    searchInput.value = "";
    validOnlyCheck.checked = false;
    invalidOnlyCheck.checked = false;

    renderProductTable([]);
    renderCleanPreview();
    renderStats();
    showStatus("Waiting for product data.", "info");
}

parseBtn.addEventListener("click", handleParseProducts);
sampleJsonBtn.addEventListener("click", loadSampleJson);
sampleXmlBtn.addEventListener("click", loadSampleXml);
validateBtn.addEventListener("click", () => {
    if (importedProducts.length === 0) {
        showStatus("Parse product data before validating.", "error");
        return;
    }

    validateProducts(importedProducts);
    cleanedProducts = cleanProductData(validProducts);
    filterProducts();
    renderCleanPreview();
    renderStats();
    showStatus(`Validation complete. ${validProducts.length} valid and ${invalidProducts.length} invalid products found.`, "success");
});
cleanBtn.addEventListener("click", () => {
    if (validProducts.length === 0) {
        showStatus("No valid products available to clean.", "error");
        return;
    }

    cleanedProducts = cleanProductData(validProducts);
    renderCleanPreview();
    renderStats();
    showStatus("Clean data generated from valid products only.", "success");
});
copyJsonBtn.addEventListener("click", copyCleanJson);
downloadJsonBtn.addEventListener("click", downloadCleanJson);
clearBtn.addEventListener("click", handleClear);
fileInput.addEventListener("change", handleFileImport);
categoryFilter.addEventListener("change", filterProducts);
minPriceInput.addEventListener("input", filterProducts);
maxPriceInput.addEventListener("input", filterProducts);
searchInput.addEventListener("input", filterProducts);
validOnlyCheck.addEventListener("change", filterProducts);
invalidOnlyCheck.addEventListener("change", filterProducts);

renderStats();