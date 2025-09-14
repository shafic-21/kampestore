# Complete Listing Lifecycle Flow

## Phase 1: Fresh Editor Session
**URL**: `/editor/[baseSkuId]` (no query params)

- **Editor State**:
  - `listingId`: null
  - Upload button: ENABLED
  - Design work: Pure creation mode

- **Actions Available**:
  - Upload design file
  - Position/resize design on canvas
  - Select product colors (up to 5)
  - Set featured color
  - Set customer price (e.g., 45,000 UGX)

- **On "Continue" Click**:
  - Calculate profit: `profit = customerPrice - baseCost`
  - Calculate profit percentage: `profitPercent = profit / baseCost`
  - Create listing with current product as master (at array[0])
  - Generate unique `listingId` - uuid
  - Navigate to `/editor/listing?id=listingId`

---

## Phase 2: Listing Creation (Transition Point)
**Action**: Click "Continue" in fresh editor

- **Data Created**:
  ```
  Master Product (array[0]):
  - baseSkuId: "comfort-tee"
  - baseCost: 37,500 UGX
  - price: 45,000 UGX (user set)
  - profit: 7,500 UGX
  - profitPercent: 0.2 (20%)
  - placement: normalized coordinates
  - selectedColors: ["red"]
  - featuredColorId: "red"
  - isIndividuallyEdited: false
  ```

- **Listing Store State**:
  - `listingId`: "lst_1234567_abc"
  - `products`: [masterProduct]
  - `corePlacement`: normalized from master
  - `masterProfitPercentage`: 0.2
  - `designFileId`: "file_xxx"

---

## Phase 3: LISTING Page (Product Selection)
**URL**: `/editor/listing?id=listingId`

- **Display**:
  - Listing sidebar showing master product
  - Preview cards of available products with design
  - Each card shows design at inherited placement

- **Adding Products to Listing**:
  - Click "+" on preview card
  - New product inherits:
    ```
    Inherited Price = newBaseCost * (1 + masterProfitPercent)
    Example:
    - Tank Top baseCost: 30,000 UGX
    - Inherited price: 30,000 * 1.2 = 36,000 UGX
    ```
  - Product added with:
    - Same design file
    - Same normalized placement
    - Just featured color initially (user adds more colors later)
    - `isIndividuallyEdited`: false

- **Listing Products Array**:
  ```
  [0]: Comfort Tee (master) - 45,000 UGX
  [1]: Tank Top - 36,000 UGX (inherited)
  [2]: Hoodie - 60,000 UGX (inherited from 50,000 base)
  ```

---

## Phase 4: Edit Individual Product
**URL**: `/editor/[baseSkuId]?listingId=lst_xxx`

- **Editor State on Load**:
  - Upload button: DISABLED (can't change design)
  - Load product with inherited placement
  - Load inherited price

- **Editable Elements**:
  - Design placement (position/size/rotation)
  - Customer price
  - Color variants
  - Featured color

- **Non-Editable**:
  - Design file (locked to listing)
  - Base cost (product property)

- **On Save**:
  - Update listing store:
    ```
    products[1] = {
      ...tankTop,
      price: 38,000, // Custom price
      placement: { ... }, // Custom placement
      selectedColors: ["red", "blue", "green"], // Added colors
      featuredColorId: "blue", // Changed featured
      isIndividuallyEdited: true // NOW MARKED AS EDITED
    }
    ```

---

## Phase 5: Return to STYLES
**URL**: `/styles?listingId=lst_xxx`

- **Listing Sidebar Shows**:
  ```
  [Master] Comfort Tee - 45,000 UGX
  [Edited] Tank Top - 38,000 UGX (custom)
  [Inherit] Hoodie - 60,000 UGX (inherited)
  ```

- **Behavior After Individual Edits**:
  - Tank Top keeps custom settings (price, placement, colors)
  - Hoodie still uses inherited settings
  - Master changes don't affect individually edited products

---

## Phase 6: Edit Master Product
**URL**: `/editor/[baseSkuId]?listingId=lst_xxx`

- **Special Behavior**:
  - Can edit price, placement, colors
  - When price changes:
    ```
    New price: 50,000 UGX
    New profit: 12,500 UGX
    New profitPercent: 0.33 (33%)
    ```

- **Impact on Other Products**:
  - Tank Top: NO CHANGE (individually edited)
  - Hoodie: Price updates to 50,000 * 1.33 = 66,500 UGX
  - Only non-edited products inherit new percentage

---

## Pricing Inheritance Rules

### Initial Addition
```
Master: Price = 45,000, Cost = 37,500
Profit = 7,500, Percentage = 20%

New Product: Cost = 30,000
Inherited Price = 30,000 * 1.2 = 36,000
```

### After Individual Edit
```
Product becomes independent:
- Custom price disconnected from master
- isIndividuallyEdited = true
- Won't update when master changes
```

### Master Updates
```
If Master price → 50,000:
- New percentage = 33%
- Non-edited products: Update to cost * 1.33
- Edited products: Keep custom price
```

---

## Key State Indicators

### Fresh Editor
- URL: `/editor/[baseSkuId]`
- No `listingId` param
- Upload enabled
- No products array

### Editing in Listing
- URL: `/editor/[baseSkuId]?listingId=lst_xxx`
- Has `listingId` param
- Upload disabled
- Products array exists

### Product Status
- **Master**: Always at products[0]
- **Inherited**: isIndividuallyEdited = false
- **Customized**: isIndividuallyEdited = true

---

## Deletion Rules

- **Master Product**: Cannot be deleted
- **Other Products**: Can be removed from listing
- **Empty Listing**: Not possible (always has master)

---

## Design Consistency

- **All products**: Use same design file
- **No design changes**: After listing created
- **Only placement varies**: Per product print areas
- **Upload blocked**: When `listingId` present

---

## Maximum Limits

- **Products per listing**: 15 maximum
- **Colors per product**: 5 maximum
- **Master products**: Always exactly 1 (at index 0)
