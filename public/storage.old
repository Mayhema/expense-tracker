export function saveFileFormatMapping(formatKey, mapping) {
  const allMappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '{}');
  allMappings[formatKey] = mapping;
  localStorage.setItem('fileFormatMappings', JSON.stringify(allMappings));
}

export function loadFileFormatMapping(formatKey) {
  const allMappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '{}');
  return allMappings[formatKey];
}