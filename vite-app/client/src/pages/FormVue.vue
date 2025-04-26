<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-100">
    <div class="w-full max-w-md shadow-lg bg-white rounded-lg">
      <div class="p-6">
        <h1 class="text-2xl font-medium text-gray-800 mb-6">Form Submission</h1>
        
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div class="space-y-4">
            <h2 class="text-lg font-medium text-gray-700">Options Selection</h2>
            
            <div v-if="errors.options" class="text-red-500 text-sm mt-2">
              {{ errors.options }}
            </div>
            
            <div class="flex items-center space-x-3 space-y-0">
              <input 
                type="checkbox" 
                id="option1" 
                v-model="formData.option1"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label for="option1" class="text-sm font-normal cursor-pointer">
                Option 1<span class="text-red-500 ml-1">*</span>
              </label>
            </div>
            
            <div class="flex items-center space-x-3 space-y-0">
              <input 
                type="checkbox" 
                id="option2" 
                v-model="formData.option2"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label for="option2" class="text-sm font-normal cursor-pointer">
                Option 2
              </label>
            </div>
            
            <div class="flex items-center space-x-3 space-y-0">
              <input 
                type="checkbox" 
                id="option3" 
                v-model="formData.option3"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label for="option3" class="text-sm font-normal cursor-pointer">
                Option 3
              </label>
            </div>
            
            <div class="flex items-center space-x-3 space-y-0">
              <input 
                type="checkbox" 
                id="option4" 
                v-model="formData.option4"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label for="option4" class="text-sm font-normal cursor-pointer">
                Option 4
              </label>
            </div>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-lg font-medium text-gray-700">File Attachment</h2>
            
            <div
              :class="[
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500',
                selectedFile ? 'bg-blue-50' : ''
              ]"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
            >
              <input
                type="file"
                id="fileUpload"
                ref="fileInput"
                @change="handleFileChange"
                class="sr-only"
                aria-label="Upload file"
              />
              
              <div v-if="!selectedFile" class="flex flex-col items-center justify-center">
                <svg class="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <label 
                  for="fileUpload" 
                  class="text-gray-600 cursor-pointer"
                >
                  Click to add file or drag and drop
                </label>
                <span class="text-gray-400 text-sm mt-1">
                  Max file size: 10MB
                </span>
              </div>
              
              <div v-else class="flex items-center justify-between bg-blue-50 p-3 rounded">
                <div class="flex items-center">
                  <svg class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="text-gray-800 text-sm truncate max-w-[200px]">
                    {{ selectedFile.name }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="handleRemoveFile"
                  class="text-gray-500 hover:text-red-500"
                  aria-label="Remove file"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="pt-4">
            <button 
              type="submit" 
              class="w-full bg-blue-500 hover:bg-blue-700 text-white font-medium p-2 rounded transition-colors"
              :disabled="isSubmitting"
            >
              <div v-if="isSubmitting" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
              <span v-else>Submit Form</span>
            </button>
            
            <div v-if="successMessage" class="mt-4 p-3 bg-green-100 text-green-700 rounded flex items-center">
              <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ successMessage }}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { z } from 'zod';

// Form validation schema
const formValidationSchema = z.object({
  option1: z.boolean(),
  option2: z.boolean(),
  option3: z.boolean(),
  option4: z.boolean(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileType: z.string().optional().nullable(),
  submittedAt: z.string(),
}).refine(data => {
  return data.option1 || data.option2 || data.option3 || data.option4;
}, {
  message: "Please select at least one option",
  path: ["options"]
});

// Form data
const formData = reactive({
  option1: false,
  option2: false,
  option3: false,
  option4: false,
  fileName: null,
  fileSize: null,
  fileType: null,
  submittedAt: '',
});

// File handling
const fileInput = ref(null);
const selectedFile = ref(null);
const isDragging = ref(false);
const isSubmitting = ref(false);
const successMessage = ref('');
const errors = reactive({});

const handleFileChange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum file size is 10MB');
      return;
    }
    selectedFile.value = file;
  }
};

const handleFileDrop = (e) => {
  isDragging.value = false;
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum file size is 10MB');
      return;
    }
    selectedFile.value = file;
  }
};

const handleRemoveFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const validateForm = () => {
  try {
    formValidationSchema.parse(formData);
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key]);
    return true;
  } catch (error) {
    // Set validation errors
    if (error.errors) {
      error.errors.forEach(err => {
        if (err.path && err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
    }
    return false;
  }
};

const onSubmit = async () => {
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  successMessage.value = '';
  
  try {
    // Add the current timestamp
    formData.submittedAt = new Date().toISOString();
    
    // Create FormData for submission
    const formDataToSubmit = new FormData();
    
    // Add form fields to FormData
    formDataToSubmit.append("option1", formData.option1.toString());
    formDataToSubmit.append("option2", formData.option2.toString());
    formDataToSubmit.append("option3", formData.option3.toString());
    formDataToSubmit.append("option4", formData.option4.toString());
    formDataToSubmit.append("submittedAt", formData.submittedAt);
    
    // Add file if it exists
    if (selectedFile.value) {
      formDataToSubmit.append("file", selectedFile.value);
      formDataToSubmit.append("fileName", selectedFile.value.name);
      formDataToSubmit.append("fileSize", selectedFile.value.size.toString());
      formDataToSubmit.append("fileType", selectedFile.value.type);
      
      // Update form data with file info
      formData.fileName = selectedFile.value.name;
      formData.fileSize = selectedFile.value.size;
      formData.fileType = selectedFile.value.type;
    }
    
    // Submit the form
    const response = await fetch("/api/form", {
      method: "POST",
      body: formDataToSubmit,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit form");
    }
    
    const result = await response.json();
    
    // Success! Reset form
    successMessage.value = "Form submitted successfully!";
    
    // Reset form data
    formData.option1 = false;
    formData.option2 = false;
    formData.option3 = false;
    formData.option4 = false;
    formData.fileName = null;
    formData.fileSize = null;
    formData.fileType = null;
    
    // Reset file
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    
  } catch (error) {
    alert(`Error submitting form: ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>