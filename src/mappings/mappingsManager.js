import { showModal } from '../ui/modalManager.js';
import { showToast } from '../ui/uiManager.js';

/**
 * Show mappings modal
 */
export function showMappingsModal() {
  console.log("Opening mappings modal...");

  const modalContent = document.createElement('div');
  modalContent.className = 'mappings-content';

  // Build the content
  modalContent.innerHTML = buildMappingsContent();

  // Create the modal
  const modal = showModal({
    title: 'Format Mappings',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: true // FIXED: Enable click outside to close
  });

  // Attach event listeners
  attachMappingsEventListeners(modalContent, modal);

  console.log("Mappings modal opened successfully");
}

/**
 * Build the mappings content HTML
 */
function buildMappingsContent() {
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

  if (mappings.length === 0) {
    return `
      <div class="empty-state">
        <p>No format mappings found.</p>
        <p class="info-text">Mappings are created automatically when you upload files with different formats.</p>
      </div>
      <div class="modal-footer">
        <button class="button secondary-btn" id="closeMappingsBtn">Close</button>
      </div>
    `;
  }

  let html = `
    <div class="mappings-list">
      <h3>Saved Format Mappings (${mappings.length})</h3>
      <p class="info-text">These mappings help automatically recognize file formats you've used before.</p>
  `;

  mappings.forEach((mapping, index) => {
    const createdDate = mapping.createdAt ? new Date(mapping.createdAt).toLocaleDateString() : 'Unknown';
    const fieldsCount = Object.keys(mapping.headerMapping || {}).length;

    html += `
      <div class="mapping-item" data-index="${index}">
        <div class="mapping-info">
          <div class="mapping-icon">🗂️</div>
          <div class="mapping-details">
            <div class="mapping-signature">${mapping.signature || 'Unknown Format'}</div>
            <div class="mapping-stats">${fieldsCount} fields mapped • Created: ${createdDate}</div>
          </div>
        </div>
        <div class="mapping-actions">
          <button class="view-mapping-btn" data-index="${index}" title="View mapping details">👁️</button>
          <button class="remove-mapping-btn" data-index="${index}" title="Remove mapping">🗑️</button>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <div class="modal-footer">
      <button class="button danger-btn" id="clearAllMappingsBtn">Clear All Mappings</button>
      <button class="button secondary-btn" id="closeMappingsBtn">Close</button>
    </div>
  `;

  return html;
}

/**
 * Attach event listeners to the mappings content
 */
function attachMappingsEventListeners(container, modal) {
  // Close button
  const closeBtn = container.querySelector('#closeMappingsBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.close();
    });
  }

  // Clear all mappings button
  const clearAllBtn = container.querySelector('#clearAllMappingsBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      handleClearAllMappings(container, modal);
    });
  }

  // Remove mapping buttons
  container.querySelectorAll('.remove-mapping-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      handleRemoveMapping(index, container, modal);
    });
  });

  // View mapping buttons
  container.querySelectorAll('.view-mapping-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      handleViewMapping(index);
    });
  });
}

/**
 * Handle removing a single mapping
 */
function handleRemoveMapping(index, container, modal) {
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");
  const mapping = mappings[index];

  if (!mapping) return;

  if (confirm(`Are you sure you want to remove this mapping?`)) {
    // Remove the mapping
    mappings.splice(index, 1);

    // Save back to localStorage
    try {
      localStorage.setItem("fileFormatMappings", JSON.stringify(mappings));
      showToast('Mapping removed successfully', 'success');

      // Refresh the modal content
      container.innerHTML = buildMappingsContent();
      attachMappingsEventListeners(container, modal);

    } catch (error) {
      console.error('Error removing mapping:', error);
      showToast('Error removing mapping', 'error');
    }
  }
}

/**
 * Handle clearing all mappings
 */
function handleClearAllMappings(container, modal) {
  if (confirm('Are you sure you want to clear ALL format mappings? This cannot be undone.')) {
    try {
      localStorage.removeItem("fileFormatMappings");
      showToast('All mappings cleared successfully', 'success');

      // Refresh the modal content
      container.innerHTML = buildMappingsContent();
      attachMappingsEventListeners(container, modal);

    } catch (error) {
      console.error('Error clearing mappings:', error);
      showToast('Error clearing mappings', 'error');
    }
  }
}

/**
 * Handle viewing mapping details
 */
function handleViewMapping(index) {
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");
  const mapping = mappings[index];

  if (!mapping) return;

  // Create a details modal
  const detailsContent = document.createElement('div');
  detailsContent.className = 'mapping-details-view';
  detailsContent.innerHTML = `
    <h4>Mapping Details</h4>
    <p><strong>Signature:</strong> ${mapping.signature || 'Unknown'}</p>
    <p><strong>Created:</strong> ${mapping.createdAt ? new Date(mapping.createdAt).toLocaleString() : 'Unknown'}</p>

    <h5>Field Mappings:</h5>
    <div class="field-mappings">
      ${Object.entries(mapping.headerMapping || {}).map(([field, column]) =>
    `<div class="field-mapping"><strong>${field}:</strong> Column "${column}"</div>`
  ).join('')}
    </div>
  `;

  showModal({
    title: 'Mapping Details',
    content: detailsContent,
    size: 'medium'
  });
}

/**
 * Save headers and format mapping for future use
 */
export function saveHeadersAndFormat(signature, headerMapping, fileName = null, headerRowIndex = 0, dataRowIndex = 1, currency = 'USD') {
  try {
    console.log('CRITICAL: Saving format mapping:', { signature, headerMapping, fileName });

    const mappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '[]');

    // CRITICAL FIX: Don't overwrite existing mapping, just update lastUsed
    const existingIndex = mappings.findIndex(m => m.signature === signature);

    const mappingData = {
      signature,
      mapping: headerMapping,
      fileName: fileName || (existingIndex !== -1 ? mappings[existingIndex].fileName : 'Unknown'),
      headerRowIndex,
      dataRowIndex,
      currency,
      created: existingIndex !== -1 ? mappings[existingIndex].created : new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing mapping but keep original fileName and created date
      mappings[existingIndex] = {
        ...mappings[existingIndex],
        ...mappingData,
        fileName: mappings[existingIndex].fileName, // Keep original fileName
        created: mappings[existingIndex].created    // Keep original created date
      };
      console.log('CRITICAL: Updated existing mapping at index', existingIndex);
    } else {
      // Add new mapping
      mappings.push(mappingData);
      console.log('CRITICAL: Added new mapping, total mappings:', mappings.length);
    }

    localStorage.setItem('fileFormatMappings', JSON.stringify(mappings));
    console.log('CRITICAL: Saved format mappings to localStorage');

  } catch (error) {
    console.error('CRITICAL ERROR: Failed to save format mapping:', error);
  }
}

/**
 * Get all saved mappings
 */
export function getMappings() {
  try {
    const mappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '[]');
    console.log('CRITICAL: Retrieved mappings:', mappings.length);
    return mappings;
  } catch (error) {
    console.error('CRITICAL ERROR: Failed to retrieve mappings:', error);
    return [];
  }
}

/**
 * FIXED: Find mapping by signature with structure-based fallback matching
 */
export function findMappingBySignature(signature) {
  try {
    const mappings = getMappings();
    console.log('CRITICAL: Searching for signature:', signature, 'in', mappings.length, 'mappings');

    // Log all signatures for debugging
    mappings.forEach((mapping, index) => {
      console.log(`CRITICAL: Mapping ${index}: signature="${mapping.signature}", fileName="${mapping.fileName}"`);
    });

    // First try exact signature match
    let found = mappings.find(m => m.signature === signature);

    if (found) {
      console.log('CRITICAL: Found EXACT mapping for signature:', signature);
      // Update last used timestamp
      found.lastUsed = new Date().toISOString();
      localStorage.setItem('fileFormatMappings', JSON.stringify(mappings));
      return found;
    }

    // CRITICAL FIX: If no exact match, try structure-based matching
    console.log('CRITICAL: No exact match found, attempting structure-based matching...');

    // Find mappings with similar structure patterns
    const candidateMappings = mappings.filter(mapping => {
      // Check if signatures share similar structure patterns
      const currentSigParts = signature.split('_');
      const mappingSigParts = mapping.signature.split('_');

      // Both should be structure-based signatures or convert old ones
      if (currentSigParts[0] === 'struct' || mappingSigParts[0] === 'struct') {
        console.log(`CRITICAL: Comparing structure signatures: current=${signature}, stored=${mapping.signature}`);
        return true; // Include for detailed comparison
      }

      return false;
    });

    if (candidateMappings.length > 0) {
      console.log(`CRITICAL: Found ${candidateMappings.length} candidate mappings for structure comparison`);

      // For now, we'll show the first candidate but later we can implement
      // a confirmation dialog asking the user if they want to use this mapping
      const candidate = candidateMappings[0];
      console.log('CRITICAL: Using candidate mapping from file:', candidate.fileName);

      // Update last used timestamp
      candidate.lastUsed = new Date().toISOString();
      localStorage.setItem('fileFormatMappings', JSON.stringify(mappings));

      return candidate;
    }

    console.log('CRITICAL: No mapping found for signature:', signature);
    return null;

  } catch (error) {
    console.error('CRITICAL ERROR: Failed to find mapping:', error);
    return null;
  }
}

/**
 * FIXED: Check if two signatures represent similar file structures
 * @param {string} sig1 - First signature
 * @param {string} sig2 - Second signature
 * @returns {boolean} True if structures are similar
 */
function areStructuresSimilar(sig1, sig2) {
  try {
    // Extract structure info from signatures
    // This is a simplified comparison - could be enhanced

    if (sig1 === sig2) return true;

    // If both are structure-based signatures, they might be similar
    const sig1Parts = sig1.split('_');
    const sig2Parts = sig2.split('_');

    if (sig1Parts[0] === 'struct' && sig2Parts[0] === 'struct') {
      // For now, consider all structure-based signatures as potentially similar
      // Later we can decode the structure data and compare column counts, patterns, etc.
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error comparing structures:', error);
    return false;
  }
}
