import React, { useState, useEffect, useRef } from 'react';
import { MeasureData } from '../types';
import '../styles/components/ReorderMeasuresModal.css';

interface MeasureOrderItem {
  id: string;
  name: string;
  order: number;
  visible: boolean;
}

interface ReorderMeasuresModalProps {
  isOpen: boolean;
  onClose: () => void;
  measures: MeasureData[];
  measureSubgroup: string;
  visibleMeasureIds?: Set<string> | null; // Set of visible measure IDs from saved state (null means use default: all visible)
  onSave: (orderedMeasures: MeasureData[], visibleMeasureIds: Set<string>) => void;
}

const ReorderMeasuresModal: React.FC<ReorderMeasuresModalProps> = ({
  isOpen,
  onClose,
  measures,
  measureSubgroup,
  visibleMeasureIds = null,
  onSave
}) => {
  const [measureItems, setMeasureItems] = useState<MeasureOrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [movingRowId, setMovingRowId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const originalOrderRef = useRef<Map<string, number>>(new Map());

  // Store original state for reset
  const originalItemsRef = useRef<MeasureOrderItem[]>([]);

  useEffect(() => {
    if (isOpen && measures.length > 0) {
      // Initialize measure items with saved order and visibility state
      const items: MeasureOrderItem[] = measures.map((measure, index) => {
        const order = index + 1;
        // If visibleMeasureIds is null/undefined, default to all visible
        // If it's an empty Set, it means no measures are visible
        // If it's a Set with values, check if this measure is in it
        const isVisible = visibleMeasureIds === null || visibleMeasureIds === undefined 
          ? true 
          : visibleMeasureIds.has(measure.id);
        originalOrderRef.current.set(measure.id, order);
        return {
          id: measure.id,
          name: measure.name,
          order: order,
          visible: isVisible
        };
      });
      setMeasureItems(items);
      // Store original state when modal opens
      originalItemsRef.current = items.map(item => ({ ...item }));
      setSearchTerm(''); // Reset search when modal opens
    } else if (!isOpen) {
      // Clear original state when modal closes
      originalItemsRef.current = [];
    }
  }, [isOpen, measures, visibleMeasureIds]);

  const handleToggleVisibility = (id: string) => {
    setMeasureItems(items =>
      items.map(item => {
        if (item.id === id) {
          const newVisible = !item.visible;
          // When visibility is turned off, keep the order as is
          // When visibility is turned on, keep the order as is (don't change position)
          return { ...item, visible: newVisible };
        }
        return item;
      })
    );
  };

  // Display items in their current order (don't auto-sort)
  // Visible items maintain their order values, invisible items stay in place
  const sortedItems = [...measureItems];

  // Filter items based on search term
  const filteredItems = searchTerm.trim()
    ? sortedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedItems;

  const handleToggleAllVisibility = () => {
    const allVisible = filteredItems.every(item => item.visible);
    setMeasureItems(items =>
      items.map(item => {
        // Only toggle items that are currently visible in the filtered list
        const isInFiltered = filteredItems.some(fi => fi.id === item.id);
        if (isInFiltered) {
          return { ...item, visible: !allVisible };
        }
        return item;
      })
    );
  };

  // Calculate if all visible checkboxes are checked
  const allVisibleChecked = filteredItems.length > 0 && filteredItems.every(item => item.visible);
  const someVisibleChecked = filteredItems.some(item => item.visible);
  const isIndeterminate = someVisibleChecked && !allVisibleChecked;

  const handleOrderChange = (id: string, newOrder: string) => {
    // Don't allow order change if item is not visible
    const item = measureItems.find(item => item.id === id);
    if (!item || !item.visible) {
      return;
    }

    const orderNum = parseInt(newOrder, 10);
    
    // Allow any positive number - don't validate or clamp
    // Just update the order value, don't do any shifting or validation
    if (isNaN(orderNum) || orderNum < 1) {
      // If invalid, just don't update
      return;
    }

    // Simply update the order number - no auto-adjustment
    setMeasureItems(items =>
      items.map(item =>
        item.id === id ? { ...item, order: orderNum } : item
      )
    );
  };

  const handleSort = () => {
    setMeasureItems(items => {
      // Get visible and invisible items separately
      const visibleItems = items.filter(item => item.visible);
      
      // Sort visible items by order number in ascending order (keep original numbers)
      const sortedVisibleItems = [...visibleItems].sort((a, b) => a.order - b.order);
      
      // Reconstruct the full list: insert sorted visible items, keeping invisible items (NA) at their original positions
      const result: MeasureOrderItem[] = [];
      let visibleIndex = 0;
      
      for (let i = 0; i < items.length; i++) {
        const originalItem = items[i];
        if (originalItem.visible) {
          // Insert sorted visible item (with original order numbers)
          if (visibleIndex < sortedVisibleItems.length) {
            result.push(sortedVisibleItems[visibleIndex]);
            visibleIndex++;
          }
        } else {
          // Insert invisible item (NA) at its original position - don't move it
          result.push(originalItem);
        }
      }
      
      // Trigger animation for items that moved up
      sortedVisibleItems.forEach((item, newIndex) => {
        const oldIndex = visibleItems.findIndex(vi => vi.id === item.id);
        if (oldIndex !== -1 && newIndex < oldIndex) {
          setMovingRowId(item.id);
          setTimeout(() => {
            setMovingRowId(null);
          }, 500);
        }
      });
      
      return result;
    });
  };

  const handleUpdateOrder = () => {
    setMeasureItems(items => {
      // Get visible and invisible items separately
      const visibleItems = items.filter(item => item.visible);
      
      // Sort visible items by order number in ascending order
      const sortedVisibleItems = [...visibleItems].sort((a, b) => a.order - b.order);
      
      // Renumber visible items sequentially starting from 1, removing duplicates
      const renumberedVisibleItems = sortedVisibleItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      
      // Reconstruct the full list: insert renumbered sorted visible items, keeping invisible items (NA) at their original positions
      const result: MeasureOrderItem[] = [];
      let visibleIndex = 0;
      
      for (let i = 0; i < items.length; i++) {
        const originalItem = items[i];
        if (originalItem.visible) {
          // Insert renumbered sorted visible item
          if (visibleIndex < renumberedVisibleItems.length) {
            result.push(renumberedVisibleItems[visibleIndex]);
            visibleIndex++;
          }
        } else {
          // Insert invisible item (NA) at its original position - don't move it
          result.push(originalItem);
        }
      }
      
      // Trigger animation for items that moved up
      renumberedVisibleItems.forEach((item, newIndex) => {
        const oldIndex = visibleItems.findIndex(vi => vi.id === item.id);
        if (oldIndex !== -1 && newIndex < oldIndex) {
          setMovingRowId(item.id);
          setTimeout(() => {
            setMovingRowId(null);
          }, 500);
        }
      });
      
      return result;
    });
  };

  const handleResetOrder = () => {
    // Reset to original state: all visible and original order
    if (originalItemsRef.current.length > 0) {
      setMeasureItems(originalItemsRef.current.map(item => ({ ...item })));
    } else {
      // Fallback: reset order and make all visible
      setMeasureItems(items =>
        items.map(item => ({
          ...item,
          order: originalOrderRef.current.get(item.id) || item.order,
          visible: true
        }))
      );
    }
  };


  const handleSave = () => {
    // Preserve invisible items' positions - only sort visible items
    const visibleItems = measureItems.filter(item => item.visible);
    const invisibleItems = measureItems.filter(item => !item.visible);
    
    // Sort visible items by order
    const sortedVisibleItems = [...visibleItems].sort((a, b) => a.order - b.order);
    
    // Reconstruct the full list maintaining invisible items' positions
    const orderedMeasures: MeasureData[] = [];
    const visibleMeasureIds = new Set<string>();
    let visibleIndex = 0;
    
    // Iterate through original order and insert sorted visible items, keeping invisible items in place
    measureItems.forEach(item => {
      const measure = measures.find(m => m.id === item.id);
      if (!measure) return;
      
      if (item.visible) {
        // Insert sorted visible item
        if (visibleIndex < sortedVisibleItems.length) {
          orderedMeasures.push(measure);
          visibleMeasureIds.add(item.id);
          visibleIndex++;
        }
      } else {
        // Insert invisible item at its current position
        orderedMeasures.push(measure);
      }
    });

    onSave(orderedMeasures, visibleMeasureIds);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="reorder-measures-modal-overlay" onClick={handleCancel}>
      <div className="reorder-measures-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reorder-measures-modal-header">
          <h2 className="reorder-measures-modal-title">Reorder Measures</h2>
          <button className="reorder-measures-modal-close" onClick={handleCancel} aria-label="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="reorder-measures-modal-body">
          <div className="reorder-measures-subtitle-row">
            <p className="reorder-measures-modal-subtitle">{measureSubgroup}</p>
            <div className="reorder-measures-button-group">
            <button 
              className="reorder-measures-btn-update-order" 
              onClick={handleUpdateOrder}
            >
              Update Sequence
            </button>
            <button 
              className="reorder-measures-btn-reset-order" 
              onClick={handleResetOrder}
            >
              Reset
            </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="reorder-measures-search-wrapper">
            <svg className="reorder-measures-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="reorder-measures-search-input"
              placeholder="Search measures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="reorder-measures-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="reorder-measures-table-container">
            <table className="reorder-measures-table">
              <thead>
                <tr>
                  <th className="reorder-measures-th-order">
                    <div className="reorder-measures-th-order-wrapper">
                      <span>Order</span>
                      <button 
                        className="reorder-measures-sort-button"
                        onClick={handleSort}
                        title="Sort by order"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 6L8 2L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </th>
                  <th className="reorder-measures-th-name">Measure Name</th>
                  <th className="reorder-measures-th-visibility">
                    <label className="reorder-measures-checkbox-wrapper" style={{ justifyContent: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allVisibleChecked}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = isIndeterminate;
                          }
                        }}
                        onChange={handleToggleAllVisibility}
                        className="reorder-measures-checkbox"
                      />
                      <span className="reorder-measures-checkbox-label"></span>
                    </label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="reorder-measures-no-results">
                      No measures found matching "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`reorder-measures-row ${movingRowId === item.id ? 'reorder-measures-row-moving' : ''} ${!item.visible ? 'reorder-measures-row-hidden' : ''}`}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(item.id, el);
                      } else {
                        rowRefs.current.delete(item.id);
                      }
                    }}
                  >
                    <td className="reorder-measures-td-order">
                      {item.visible ? (
                        <input
                          type="number"
                          min="1"
                          max={measureItems.length}
                          value={item.order}
                          onChange={(e) => handleOrderChange(item.id, e.target.value)}
                          className="reorder-measures-order-input"
                        />
                      ) : (
                        <input
                          type="text"
                          value="NA"
                          readOnly
                          disabled
                          className="reorder-measures-order-input reorder-measures-order-input-disabled"
                        />
                      )}
                    </td>
                    <td className="reorder-measures-td-name">{item.name}</td>
                    <td className="reorder-measures-td-visibility">
                      <label className="reorder-measures-checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={() => handleToggleVisibility(item.id)}
                          className="reorder-measures-checkbox"
                        />
                        <span className="reorder-measures-checkbox-label"></span>
                      </label>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reorder-measures-modal-footer">
          <button className="reorder-measures-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="reorder-measures-btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderMeasuresModal;

