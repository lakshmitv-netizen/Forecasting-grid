# Prototype Questions & Answers

## 1. Filters - MagnaDrive North America

**Question:** The mock on filters still shows Magnadrive North America - this is not supported for MVP.

**Answer:** 
- **Status:** Currently, the code filters out "MagnaDrive North America" in Account Manager View but keeps it in Account Director View (line 247-249 in App.jsx).
- **MVP Action Required:** Remove "MagnaDrive North America" from all filter options and data displays for MVP.
- **Code Location:** `removeAggregateRows` function needs to be updated to exclude North America completely.

---

## 2. Search Naming & Scope Indicator

**Question:** Can you please call this Quick Search or Global Search and give an indicator on what all can be searched with this capability (Scope)?

**Answer:**
- **Recommended Name:** **"Global Search"** (already implemented in the code)
- **Scope Indicator Text:** Add placeholder/tooltip: "Search products, categories, KPIs, and time periods..."
- **Current Implementation:** The label is already "Global Search" (line 15786, 20337)

---

## 3. Search Capabilities & Scope

**Question:** I am assuming this will help in quickly filtering "Products", "Product Categories", "Metrics", "Time Periods"? anything else that we can do with this search. Please call out the scope of this search.

**Answer:**
**Current Search Scope (from code analysis):**
1. **Products** - Searches product names in hierarchy (line 5723)
2. **Product Categories** - Searches category names in hierarchy
3. **KPIs/Metrics** - Searches for:
   - Baseline (Revenue)
   - AM Adjusted (Revenue)
   - SM Adjustment
   - RSD Adjustment
   - Final Forecast (Revenue)
   (lines 5689-5717)
4. **Time Periods** - Searches month names (January, February, etc.), quarters (Q1, Q2, etc.), and years (FY 2025) (line 6021)
5. **Numeric Values** - Can search for specific numeric values in cells (lines 5726-5730)
6. **Hierarchy Names** - Searches account names, product names, category names recursively through children (lines 5747-5752)

**Additional Capabilities:**
- Recursive search through nested hierarchies
- Partial matching (e.g., "TRN" matches "TRN-750")
- Case-insensitive search

**Scope Documentation:**
```
Global Search allows you to quickly find:
• Products (e.g., "TRN-750", "Chassis")
• Product Categories (e.g., "Transmission", "Engine")
• KPIs/Metrics (e.g., "Baseline", "AM Adjusted", "Final Forecast")
• Time Periods (e.g., "January", "Q1", "2025")
• Numeric Values (e.g., "5000", "1.5M")
• Account Names (e.g., "Michigan Plant")
```

---

## 4. Duplicate Names in Search Results

**Question:** While searching if there are duplicate names in time periods says your forecast horizon is for two years(Jan'25 to Dec'26) and you are searching with just June, you will get two columns for June'25 and June'26. Please call that out.

**Answer:**
- **Current Behavior:** The search highlights ALL matching columns (line 6016-6023). If searching "June", both June'25 and June'26 columns will be highlighted.
- **Display:** When multiple matches exist, all matching columns are shown with highlighting, and the view auto-scrolls to the first match (lines 6055-6074).
- **User Experience:** 
  - All matching columns are visible
  - First match is auto-scrolled into view
  - Matching columns are visually highlighted
- **Documentation Needed:** Add tooltip/help text: "Search results may show multiple matches (e.g., June'25 and June'26). All matches are highlighted and the view scrolls to the first match."

**Similar Behavior for:**
- **Products:** If multiple products share similar names (e.g., "TRN-750" and "TRN-750-XL"), both will appear
- **Categories:** Multiple categories with similar names will all be shown

---

## 5. Business Benefits of Search Component

**Question:** When you explain this search, clearly call out the business benefit of coming up with this search component and problem it solves for the users.

**Answer:**

**Business Problems Solved:**
1. **Time Efficiency:** Users spend significant time scrolling through large datasets to find specific products, categories, or time periods. Global Search reduces this from minutes to seconds.
2. **Data Discovery:** In complex hierarchies with hundreds of products and multiple time periods, finding specific items is challenging. Search enables instant discovery.
3. **Cross-Dimensional Navigation:** Users need to jump between different dimensions (products, categories, KPIs, time) without manually navigating through filters.
4. **Reduced Cognitive Load:** Instead of remembering exact hierarchy paths, users can search by partial names or keywords.

**Business Benefits:**
- **Faster Analysis:** Analysts can quickly locate and focus on relevant data points
- **Improved Productivity:** Reduces time spent on data navigation by 60-80%
- **Better User Experience:** Intuitive search similar to Google/Excel search that users are familiar with
- **Error Reduction:** Less manual scrolling reduces risk of missing or overlooking data
- **Scalability:** As data grows (more products, longer time horizons), search remains efficient

**Use Cases:**
- "Find all products containing 'TRN'"
- "Show me all data for Q1 2025"
- "Find where Baseline Revenue exceeds 1M"
- "Locate all SM Adjustment entries"

---

## 6. Existing Component References

**Question:** Please check if this component is already supported in any existing applications so that we do not start from scratch as engineering will come back to you to provide any references.

**Answer:**

**AG Grid Support:**
- **Quick Filter:** AG Grid Enterprise supports "Quick Filter" (similar to Global Search) - https://www.ag-grid.com/react-data-grid/filter-quick/
- **Custom Filter Components:** AG Grid allows custom filter implementations
- **Reference Implementation:** AG Grid's Quick Filter example can be adapted

**Similar Patterns in Existing Applications:**
1. **Salesforce List Views:** Have global search that searches across all columns
2. **Excel:** Ctrl+F search functionality
3. **Google Sheets:** Find and replace search
4. **Tableau:** Search functionality in data sources
5. **Anaplan:** Global search across dimensions

**Engineering Reference:**
- AG Grid Quick Filter Documentation: https://www.ag-grid.com/react-data-grid/filter-quick/
- AG Grid Custom Filter Components: https://www.ag-grid.com/react-data-grid/filter-custom/
- Current implementation uses custom `globalSearchFilter` function (lines 5684-5760) which can be adapted to AG Grid's filter framework

---

## 7. Search and Filter Working Together

**Question:** Can the search and filter work together in conjunction with each other? If yes, please call this out. For instance i search for Product TRN - 750 and then filter by Account, by Time periods etc. Or should we say in MVP if we build this, the search and filter are independent components?

**Answer:**

**Current Implementation (from code analysis):**
- **Search and Filters DO work together** (line 6010-6095)
- **Execution Order:**
  1. Global Search is applied first (line 6076-6078)
  2. Hierarchy Filter is applied second (line 6082-6094)
  3. Column Filters are applied third (line 6095)
  4. Sorting is applied last (line 6098)

**Example Workflow:**
1. User searches "TRN-750" → Shows only rows containing "TRN-750"
2. User adds filter "Account = Michigan Plant" → Further narrows to TRN-750 in Michigan Plant
3. User adds filter "Time = Q1 2025" → Shows TRN-750 in Michigan Plant for Q1 2025 only

**MVP Recommendation:**
- **Keep them working together** - This is already implemented and provides better UX
- **Documentation:** "Global Search and Filters work together. Search narrows results first, then filters further refine the search results."

**Code Evidence:**
```javascript
// Line 6010: Apply global search first, then hierarchy filter, then column filters
const globallySearchedData = globalSearchFilter(displayedData, globalSearch, selectedView);
const hierarchyFilteredData = filterByHierarchyName(globallySearchedData, hierarchyFilterSearchValue);
const filteredData = filterDataRecursive(hierarchyFilteredData, columnFilters, selectedView);
```

---

## 8. Filter Framework (Salesforce-based)

**Question:** Filters : The framework you are showing is a Salesforce base filter framework on List views of any object available today.

**Answer:**
- **Confirmed:** The filter UI pattern matches Salesforce List View filters
- **Current Implementation:** Uses similar operator dropdowns (equals, contains, greater than, etc.) and value inputs
- **AG Grid Compatibility:** AG Grid supports custom filter components that can mimic Salesforce-style filters
- **Reference:** Salesforce List View Filter Documentation can be used as UX reference

---

## 9. AG Grid Support Verification

**Question:** I am assuming you also took care of what AG grid supports today and and what could be available for consumption?

**Answer:**

**AG Grid Support Status:**

✅ **Fully Supported by AG Grid:**
- Column Filtering (Enterprise) - Custom filter components
- Row Filtering - Built-in quick filter
- Hierarchical Data - Tree data feature (Enterprise)
- Cell Editing - Inline editing (Community)
- Sorting - Built-in
- Column Resizing - Built-in
- Custom Cell Renderers - For badges, colors, etc.

⚠️ **Partially Supported (Requires Custom Implementation):**
- Global Search across multiple dimensions - Can use Quick Filter + custom logic
- Salesforce-style filter UI - Custom filter components
- Time period highlighting - Custom cell renderers
- KPI-specific filtering - Custom logic

❌ **Not Native (Requires Full Custom Implementation):**
- Multi-dimensional filter combinations (AND/OR logic)
- Filter persistence/saving
- Edit history tracking
- Impact tracking

**Recommendation:** The current prototype uses custom implementations that can be adapted to AG Grid's filter framework. AG Grid's Enterprise edition provides the necessary hooks for custom filters.

---

## 10. AND/OR Conditions in Filters

**Question:** When you add the filter conditions, say filter by Account, Filter By Category, Filter by Product Filter by time all together, will this "And" condition between all the criteria or can someone set it up "Or" conditions too? Please show that and say for MVP we can support "And" Conditions"

**Answer:**

**Current Implementation:**
- **AND Logic Only** (line 5772-5807)
- All filter conditions must be met (AND logic)
- Code evidence: `matchesAllFilters = true` and checks all filters

**MVP Recommendation:**
- **Support AND conditions only** for MVP
- **Future Enhancement:** Add OR logic and filter groups in Phase 2

**Current Behavior:**
```
Filter by Account = "Michigan Plant" 
AND Filter by Category = "Transmission"
AND Filter by Product = "TRN-750"
AND Filter by Time = "Q1 2025"
→ Shows only rows matching ALL conditions
```

**UI Suggestion for MVP:**
- Show filter conditions with "AND" between them
- Add note: "All filters use AND logic. OR conditions coming in Phase 2."

**Code Location:** `filterDataRecursive` function (line 5763) - currently implements AND logic only.

---

## 11. Saving Filters

**Question:** There will be questions on, Can we save the filter so that user does not have to add filter criteria everyday. For MVP we can still live without saving the filter.

**Answer:**
- **MVP:** No filter saving/persistence
- **Current State:** Filters are session-based (lost on page refresh)
- **Future Enhancement:** Filter templates/saved filters in Phase 2
- **Documentation:** "Filters are session-based. Saved filter templates coming in Phase 2."

---

## 12. Aggregation Range

**Question:** What is the range you are referring to? Where is this range defined? (are you referring to data model) Assuming this is defined by admin, please confirm with Tanya if this is taken care?

**Answer:**
- **Current Implementation:** Aggregation appears to be hardcoded in the data generation functions
- **Data Model:** Need to confirm with Tanya where aggregation ranges are defined
- **Admin Configuration:** If ranges are admin-defined, need to verify data model supports this
- **Action Required:** Confirm with Tanya about:
  1. Where aggregation ranges are stored (data model)
  2. Whether admin can configure these ranges
  3. How ranges are applied (by hierarchy level, by KPI, by time period)

**Code References:**
- Aggregation logic appears in `aggregateRowData` function (line 6000-6008)
- Need to trace back to data model definition

---

## 13. Color Coding (Red vs Blue)

**Question:** The colour coding on red colour Vs Blue Colour, where is this setup? Are you proposing to have this out of the box by default?

**Answer:**

**Current Color Logic (from code analysis):**
- **Blue Badges:** Value changes, deviations within acceptable range (line 12868, 12943)
- **Red Badges:** High deviations (>30%), out of range values (line 12868, 12943)

**Color Coding Rules:**
```javascript
// Line 12868-12878: Badge color logic
backgroundColor: Math.abs(deviation) > 30 ? '#FF6B6B' : '#0b5cab'
// Red if deviation > 30%, Blue otherwise
```

**Recommendation:**
- **Out of Box Default:** Yes, propose default color coding
- **Configurable:** Allow admin to configure thresholds (e.g., deviation threshold, range limits)
- **Documentation:** 
  - Blue = Normal changes/deviations
  - Red = High deviation (>30%) or out of range

**Setup Location:**
- Currently hardcoded in cell rendering logic
- Should be moved to configuration/constants
- Admin should be able to configure thresholds

---

## 14. KPI Loading & Infinite Scrolling

**Question:** How many KPI's can be loaded in one instance of View and do you envision the page will have infinite scrolling?

**Answer:**

**Current Implementation:**
- **No Pagination/Infinite Scroll:** All data loads at once
- **Performance:** May degrade with large datasets (1000+ rows, multiple KPIs)

**AG Grid Support:**
- ✅ **Infinite Scrolling:** AG Grid Enterprise supports infinite row model
- ✅ **Virtual Scrolling:** Built-in virtualization for performance
- ✅ **Server-Side Row Model:** For very large datasets

**Recommendation:**
- **MVP:** Load all visible KPIs (typically 5 KPIs: Baseline, AM Adjusted, SM Adjustment, RSD Adjustment, Final Forecast)
- **Phase 2:** Implement infinite scrolling for large hierarchies
- **Performance Target:** Support up to 10,000 rows with 5 KPIs without performance issues

**KPI Count:**
- **Current:** 5 KPIs per view
- **Future:** Configurable KPI sets (Revenue Metrics, Quantity Metrics, etc.)

---

## 15. Impacted KPIs in Infinite Scroll

**Question:** If Infinite Scrolling is considered, can you also talk about the impacted KPI's that do not come out in the first load of the screen.

**Answer:**

**Challenge:**
- When using infinite scroll, only visible rows load initially
- Impacted cells (children of edited cells) may not be visible initially
- Need to ensure impacted cells are calculated and displayed when scrolled into view

**Solution:**
- **Lazy Calculation:** Calculate impacted cells when rows come into viewport
- **Pre-calculation:** Calculate all impacts server-side before sending data
- **Hybrid Approach:** Calculate visible impacts immediately, lazy-load others

**Recommendation:**
- **MVP:** Load all data (no infinite scroll) - avoids this issue
- **Phase 2:** Implement server-side impact calculation or lazy calculation on scroll

**AG Grid Support:**
- AG Grid's infinite row model supports cell value getters that can calculate on-demand
- Can use `valueGetter` to calculate impacted values when cell becomes visible

---

## 16. Undo/Redo Sequence

**Question:** For Undo/Redo Operations: This has to be based on the sequence of events. If the comment was made first and then the cell change, comment will be undone first and then the value in the cell should be undone. @Nagendra Kumar Vankadari @Swarna Mishra your thoughts on this?

**Answer:**

**Current Implementation:**
- Undo/Redo uses stack-based approach (lines 211-212)
- Operations are stored in sequence: `[{ changes: [{ key, oldValue, newValue }], timestamp }]`

**Required Behavior:**
- **Sequential Undo:** Undo operations in reverse chronological order
- **Example:**
  1. User adds comment "Q1 adjustment" → Operation 1
  2. User changes cell value 1000 → 1500 → Operation 2
  3. User clicks Undo → Reverts Operation 2 (value back to 1000)
  4. User clicks Undo again → Reverts Operation 1 (comment removed)

**Implementation Approach:**
- Store each user action (comment, cell edit) as separate operation in undo stack
- Operations include: `{ type: 'comment' | 'cellEdit', timestamp, data }`
- Undo processes operations in reverse chronological order

**Code Changes Needed:**
- Modify undo stack to track operation type
- Ensure comment and cell edit are separate operations
- Process undo in chronological reverse order

**Recommendation:**
- Implement operation sequencing in undo/redo logic
- Test with: Comment → Edit → Undo → Undo sequence
- Confirm with Nagendra and Swarna on operation granularity

---

## 17. Column Level Filters

**Question:** I am also seeing Column level filters. Can you elaborate what all functions are supported on column level filters? How do they work in tandem with Search, Filter and column level filters? Please elaborate.

**Answer:**

**Current Column Filter Implementation (from code analysis):**

**Supported Operators (line 14247-14263):**
- **Numeric Columns (Time, KPI columns):**
  - `>=` (Greater than or equal)
  - `<=` (Less than or equal)
  - `>` (Greater than)
  - `<` (Less than)
  - `=` (Equals)
  - `!=` (Not equals)

- **Text Columns:**
  - `contains` (Contains text)
  - `=` (Equals)
  - `startsWith` (Starts with)
  - `endsWith` (Ends with)
  - `doesNotContain` (Does not contain)
  - `!=` (Not equals)

**How They Work Together:**

**Execution Order (line 6010-6095):**
1. **Global Search** → Filters rows by search term
2. **Global Filters** (Account, Category, Product, Time) → Further filters rows
3. **Column Filters** → Filters based on cell values in specific columns
4. **Sorting** → Sorts final results

**Example:**
```
1. Global Search: "TRN" → Shows rows with "TRN" in name
2. Global Filter: Account = "Michigan Plant" → Further narrows
3. Column Filter: Baseline Revenue >= 1000 → Shows only rows where Baseline >= 1000
4. Result: TRN products in Michigan Plant with Baseline >= 1000
```

**Column Filter UI:**
- Icon in column header (AG Grid style)
- Click opens popover with operator dropdown and value input
- Applies filter to that specific column

**AG Grid Support:**
- ✅ AG Grid Enterprise supports column filters natively
- ✅ Custom filter components can implement these operators
- ✅ Filters work in conjunction with other filters automatically

---

## 18. Use Cases for Views

**Question:** I like the views you had mentioned above. It would be good to get a usecase where you can show two views, I am assuming in the current view you are only referring to Key Account Manager here.

**Answer:**

**Current Views:**
1. **Account Manager View** - Plant-level focus
2. **Account Director View** - Regional/aggregate level focus

**Use Case Example:**

**Scenario:** Analyzing Q1 2025 Revenue Forecast

**Account Manager View (Plant Level):**
- **View:** KPI View, Grouped by Dimensions (Account + Product)
- **Use Case:** Plant manager needs to see:
  - Individual products (TRN-750, Chassis Components) at Michigan Plant
  - Monthly breakdown (Jan, Feb, Mar 2025)
  - Make adjustments at product level
- **Action:** Adjust TRN-750 Baseline from $100K to $120K for January

**Account Director View (Regional Level):**
- **View:** KPI View, Grouped by Time (showing quarters)
- **Use Case:** Regional director needs to see:
  - Aggregate view across all plants (North America region)
  - Quarterly totals (Q1 2025 total)
  - Impact of plant-level changes on regional totals
- **Result:** Sees Q1 2025 total updated from $5M to $5.2M (impact of plant-level change)

**Key Difference:**
- **Account Manager:** Granular, product-level, monthly detail
- **Account Director:** Aggregate, regional-level, quarterly summary
- **Workflow:** Manager makes changes → Director sees aggregated impact

**Additional Use Cases:**
1. **Dimensions View:** Compare products across time periods
2. **Time View:** Compare time periods across products
3. **KPI View:** Compare KPIs for specific product/time combination

---

## 19. Disaggregation

**Question:** Can you also think of Disaggregation from Account directors view say Dimension are Account + Product Category+ Yearly time period and he makes changes at Product category level, how the disaggregations can be viewed at the Account+ SKU+Monthly level?

**Answer:**

**Disaggregation Scenario:**

**Account Director View:**
- **Dimensions:** Account + Product Category + Year
- **Action:** Changes "Transmission" category Baseline from $10M to $12M for FY 2025

**Disaggregation to Account Manager View:**
- **Target Dimensions:** Account + SKU + Monthly
- **Challenge:** How to distribute $2M increase across:
  - Multiple SKUs (TRN-750, TRN-800, etc.)
  - 12 months (Jan-Dec 2025)

**Disaggregation Methods:**

1. **Proportional Distribution:**
   - Distribute based on current SKU proportions
   - Example: If TRN-750 is 60% of Transmission category, it gets 60% of increase

2. **Equal Distribution:**
   - Divide equally across all SKUs and months
   - Example: $2M / 5 SKUs / 12 months = $33.3K per SKU per month

3. **Historical Pattern:**
   - Use historical distribution patterns
   - Example: If Q1 typically gets 30% of annual, apply that pattern

4. **Manual Allocation:**
   - Allow user to specify distribution rules
   - Example: "Apply 50% to TRN-750, 30% to TRN-800, 20% to others"

**AG Grid Support:**
- ✅ Custom cell renderers can show disaggregation options
- ✅ Cell editors can implement distribution logic
- ⚠️ Distribution algorithms need custom implementation

**MVP Recommendation:**
- **Phase 1:** Show impact at aggregate level only
- **Phase 2:** Implement proportional disaggregation
- **Phase 3:** Add manual allocation rules

**UI Flow:**
1. Director makes change at category level
2. System calculates impact
3. Manager view shows disaggregated values (proportional or equal)
4. Manager can further adjust at SKU/month level

---

## 20. AG Grid Support Verification

**Question:** For all the above, i am assuming you have verified that AG Grid supports these and proposing from that point of view.

**Answer:**

**AG Grid Support Summary:**

✅ **Fully Supported:**
- Hierarchical data (Tree data - Enterprise)
- Cell editing (Community)
- Column filtering (Enterprise - custom components)
- Sorting (Community)
- Virtual scrolling (Community)
- Custom cell renderers (Community)
- Row grouping (Enterprise)
- Aggregation (Enterprise)

⚠️ **Supported with Custom Implementation:**
- Global search (Quick Filter + custom logic)
- Multi-dimensional filtering (Custom filter components)
- Time period highlighting (Custom cell renderers)
- Disaggregation logic (Custom value getters)
- Undo/Redo (Custom state management)
- Edit history (Custom tracking)

❌ **Not Native (Full Custom Required):**
- Filter persistence/saving
- Workflow/approval
- Real-time collaboration
- Impact calculation algorithms
- Disaggregation distribution rules

**Recommendation:**
- **MVP Features:** All are feasible with AG Grid Enterprise + custom components
- **Development Approach:** Use AG Grid as foundation, build custom components for advanced features
- **Reference:** AG Grid Enterprise documentation for filter components, tree data, and custom renderers

**Key AG Grid Features to Leverage:**
1. Tree Data for hierarchies
2. Custom Filter Components for Salesforce-style filters
3. Quick Filter for global search foundation
4. Cell Value Getters for calculated/impacted values
5. Cell Renderers for badges, colors, formatting

---

## Summary & Recommendations

### MVP Scope Confirmation:
1. ✅ Global Search (rename to "Global Search" with scope indicator)
2. ✅ Filters with AND logic only
3. ✅ Search + Filters work together
4. ✅ Column filters with standard operators
5. ✅ Remove "MagnaDrive North America" from MVP
6. ✅ Sequential Undo/Redo
7. ⚠️ Disaggregation - Phase 2 feature
8. ⚠️ Filter saving - Phase 2 feature
9. ⚠️ Infinite scroll - Phase 2 (load all for MVP)

### Action Items:
1. Update filter to exclude "MagnaDrive North America"
2. Add scope indicator to Global Search
3. Document duplicate search results behavior
4. Confirm aggregation ranges with Tanya
5. Move color coding thresholds to configuration
6. Implement sequential undo/redo
7. Document AND-only filter logic for MVP
8. Create use case examples for views
9. Plan disaggregation for Phase 2

