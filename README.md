# Product Data Importer

A browser-based business/developer tool for importing JSON/XML product
data, validating required fields, filtering products, cleaning records,
and exporting clean JSON.

## Live Links

- GitHub Repository: [fazal305/product-data-importer](https://github.com/fazal305/product-data-importer)
- Live Demo: [https://fazal305.github.io/product-data-importer/](https://fazal305.github.io/product-data-importer/)

## Overview

Product Data Importer helps developers, store owners, students, and testers work with real-world product import data directly in the browser. Users can paste or upload JSON/XML product records, validate required fields, identify invalid rows, filter the dataset, and export a clean JSON file.

The project is built as a no-build, framework-free portfolio tool that demonstrates file handling, JSON parsing, XML parsing, validation logic, table rendering, filtering workflows, and export features.

## Features

- Paste JSON or XML product data
- Import `.json` and `.xml` files
- Auto-detect JSON or XML input
- Manually select JSON or XML parsing mode
- Parse product arrays or `{ "products": [] }` JSON objects
- Parse XML files with multiple `<product>` nodes
- Validate required product fields
- Highlight invalid product rows
- Display validation issues per product
- Filter products by category
- Filter products by minimum and maximum price
- Search products by name or SKU
- Show valid products only
- Show invalid products only
- Clean valid product records for export
- Remove internal validation metadata from exports
- Preview clean JSON
- Copy clean JSON to clipboard
- Download clean JSON as `clean-products.json`
- Display import and export statistics
- Reset the full workspace with one clear action
- Responsive cyberpunk developer tool interface

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- JSON.parse
- JSON.stringify
- DOMParser
- FileReader API
- Blob API
- Clipboard API

## Learning Outcomes

- Build a browser-based data import workflow without build tools
- Parse and validate structured JSON product data
- Parse XML product data with DOMParser
- Normalize messy product records before validation
- Use loops and array methods for validation, filtering, and cleaning
- Render dynamic product tables safely
- Highlight invalid rows with clear issue messages
- Generate clean JSON exports with JSON.stringify
- Use FileReader for local file imports
- Use Blob and URL.createObjectURL for browser downloads
- Use the Clipboard API for copy workflows
- Design a responsive developer-focused interface

## Folder Structure

```text
product-data-importer/
  index.html
  styles.css
  script.js
  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/product-data-importer.git
cd product-data-importer
start index.html
You can also open index.html directly in any modern browser.
How To Use
Open index.html in a browser.
Paste JSON or XML product data into the input textarea.
Choose Auto Detect, JSON, or XML from the data type selector.
Click Parse Products.
Review the validation status, stats, and product table.
Use the category, price, search, and validity filters to narrow results.
Click Clean Data to generate export-ready product records.
Review the Clean JSON Preview panel.
Click Copy Clean JSON to copy the cleaned output.
Click Download Clean JSON to save clean-products.json.
Use Clear to reset the workspace.
Sample Product Data
JSON example:
{
"products": [
{
"name": "Wireless Mouse",
"sku": "WM-1001",
"category": "Accessories",
"price": 1800,
"stock": 35
}
]
}
XML example:
<products>
<product>
<name>Wireless Mouse</name>
<sku>WM-1001</sku>
<category>Accessories</category>
<price>1800</price>
<stock>35</stock>
</product>
</products>
