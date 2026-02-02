# POS Template Builder: User Documentation

The POS Template Builder (the "Designer") is a powerful 5-step orchestrator designed to help Platform Admins create, customize, and deploy industry-specific menu blueprints across the Nodal POS ecosystem.

---

## 🚀 Getting Started

To launch the designer:
1. Navigate to **Platform** -> **Templates** in the Sidebar.
2. Select an existing blueprint and click **Launch Designer**, or click **Create Template** to start from scratch.

---

## 🧩 Phase 1: Brand Foundation

In this step, you define the core identity of the blueprint.

### Using the Industry Gallery
Don't start from zero! Click **Browse Industry Gallery** to view pre-vetted templates (Café, Fast Food, Retail). Applying a gallery template will automatically populate categories, items, and modifier groups.

### Using the Import Wizard
If you have an existing menu in a spreadsheet:
1. Click **Import from Spreadsheet**.
2. Upload your CSV file.
3. **Map Columns**: Match your CSV headers (e.g., "Product Name") to the system requirements ("Name").
4. **Verify**: The system will flag invalid prices or missing SKUs.
5. Click **Complete Import** to ingest hundreds of items in seconds.

---

## 📁 Phase 2: Category Management

Organize your menu for the terminal UI.
- **Add Categories**: Create logical groupings (e.g., "Hot Drinks", "Breakfast").
- **Visual Coding**: Use preset colors or enter **Custom Hex Codes** for precise branding.
- **Sorting**: Use the visible Up/Down controls to set the terminal display order.
- **Inline Renaming**: Click any category name to rename it instantly.

---

## 🍔 Phase 3: Menu Item Editor

Refine individual products.
- **Basic Info**: Update names, descriptions, and SKUs.
- **Pricing**: Set the base price for the item.
- **Category Linking**: Move items between categories easily.

---

## ⚙️ Phase 4: Customizations (Modifier Groups)

This is where you build complex product logic.

### Creating Modifier Groups
Modifier groups (e.g., "Milk Options", "Add-ons") can be linked to multiple items.
- **Selection Rules**: Set `Min` and `Max` selections. (Tip: Set `Min: 1` to make the group required).
- **Price Adjustments**: Individual options can add to or subtract from the base price.

### Nested Modifiers (Advanced)
You can link an option to *another* modifier group. 
*Example: Selecting the "Meal Deal" option can trigger a "Select Side" modifier group.*

---

## 📢 Phase 5: Review & Publish

Before deploying to live stores, perform a final check.

### POS Simulation
Click the **Simulate** button at any time. This opens a "Visual Preview Mode" where you can interact with your menu exactly as a cashier would. Test your modifier rules and pricing logic here.

### Deployment
Once satisfied, use the **Publish Manager** to:
1. Review the final configuration logic.
2. Click **Publish** to create a new version and prepare it for store deployment.

---

> [!TIP]
> **Safety First**: Use the **Undo/Redo** buttons in the header if you make a mistake. The designer keeps track of your last 20 changes.

> [!IMPORTANT]
> **Validation**: The system will automatically check for common errors (e.g., items without categories) before allowing a publish.
