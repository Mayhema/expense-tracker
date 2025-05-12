import { handleFileUpload } from "../parsers/fileHandler.js";

export class FileUploader {
  constructor(fileInputId, onSuccess, onError) {
    this.fileInputId = fileInputId;
    this.onSuccess = onSuccess || this.defaultSuccess;
    this.onError = onError || this.defaultError;
    this.initialize();
  }
  
  initialize() {
    const fileInput = document.getElementById(this.fileInputId);
    if (!fileInput) {
      console.error(`File input with ID ${this.fileInputId} not found`);
      return;
    }
    
    fileInput.addEventListener("change", this.handleFileChange.bind(this));
  }
  
  handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset input so the same file can be selected again
    event.target.value = "";
    
    // Process the file
    handleFileUpload(file)
      .then(data => {
        if (this.onSuccess) this.onSuccess(data, file);
      })
      .catch(error => {
        if (this.onError) this.onError(error, file);
      });
  }
  
  defaultSuccess(data, file) {
    console.log(`File ${file.name} parsed successfully:`, data);
  }
  
  defaultError(error, file) {
    console.error(`Error processing file ${file.name}:`, error);
  }
}
