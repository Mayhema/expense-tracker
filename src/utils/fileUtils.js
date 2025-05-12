/**
 * Returns an appropriate icon based on file extension
 * @param {string} filename - The filename to check
 * @returns {string} An emoji representing the file type
 */
export function getFileIcon(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return '📊';
    case 'xml':
      return '📋';
    case 'csv':
      return '📝';
    default:
      return '📄';
  }
}
