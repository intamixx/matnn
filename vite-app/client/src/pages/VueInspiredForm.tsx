import { useState, useRef } from "react";
import { z } from "zod";

// Styles inspired by Vue
const styles = {
  container: "min-h-screen flex items-center justify-center p-4 bg-gray-100",
  card: "w-full max-w-md shadow-lg bg-white rounded-lg",
  cardContent: "p-6",
  title: "text-2xl font-medium text-gray-800 mb-6",
  form: "space-y-6",
  optionsSection: "space-y-4",
  sectionTitle: "text-lg font-medium text-gray-700",
  checkboxContainer: "flex items-center space-x-3 space-y-0",
  checkbox: "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
  label: "text-sm font-normal cursor-pointer",
  required: "text-red-500 ml-1",
  errorText: "text-red-500 text-sm mt-2",
  fileSection: "space-y-2",
  dropZone: (isDragging: boolean, hasFile: boolean) => `
    border-2 border-dashed rounded-lg p-6 text-center transition-colors
    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
    ${hasFile ? 'bg-blue-50' : ''}
  `,
  fileUploadIcon: "h-10 w-10 text-gray-400 mb-2",
  dropzoneText: "text-gray-600 cursor-pointer",
  maxSizeText: "text-gray-400 text-sm mt-1",
  filePreview: "flex items-center justify-between bg-blue-50 p-3 rounded",
  fileIcon: "h-5 w-5 text-blue-500 mr-2",
  fileName: "text-gray-800 text-sm truncate max-w-[200px]",
  removeButton: "text-gray-500 hover:text-red-500",
  submitButton: "w-full bg-blue-500 hover:bg-blue-700 text-white font-medium p-2 rounded transition-colors",
  loadingSpinner: "animate-spin -ml-1 mr-2 h-4 w-4 text-white",
  successMessage: "mt-4 p-3 bg-green-100 text-green-700 rounded flex items-center",
  successIcon: "mr-2 h-5 w-5"
};

// Form validation schema (Vue-inspired approach)
const formValidationSchema = z.object({
  bpm: z.boolean(),
  key: z.boolean(),
  approachability: z.boolean(),
  modelType: z.enum(['discogs-effnet', 'musicnn', 'magnatagatune']),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileType: z.string().optional().nullable(),
  faid: z.string(),
  submittedAt: z.string(),
}).superRefine((data, ctx) => {
  //if (!data.fileName || data.fileName.trim() === "") {
  console.log("Hello");
  console.log(data.fileName);
  if (data.fileName = '') {
  console.log("match filename is blank");
    ctx.addIssue({
      path: ['options'],
      code: z.ZodIssueCode.custom,
      message: 'Please select a filename',
    });
  }
  if (!(data.bpm || data.key || data.approachability)) {
    ctx.addIssue({
      path: ['options'],
      code: z.ZodIssueCode.custom,
      message: 'Please select at least one option',
    });
  }
});



//.refine(data => {
//  return data.bpm || data.key || data.approachability || data.engagement;
//},
//{
//  message: "Please select at least one option",
//  path: ["options"]
//});

export default function VueInspiredForm() {
  // Reactive state (Vue-like approach)
  const [formData, setFormData] = useState({
    bpm: false,
    key: false,
    approachability: false,
    modelType: 'discogs-effnet', // Default radio selection
    fileName: null as string | null,
    fileSize: null as number | null,
    fileType: null as string | null,
    faid: "",
    submittedAt: "",
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Methods (Vue-like approach)
  const handleCheckboxChange = (field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: !formData[field as keyof typeof formData] });
  };
  
  const handleRadioChange = (value: string) => {
    setFormData({ ...formData, modelType: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum file size is 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum file size is 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    try {
      formValidationSchema.parse(formData);
      // Clear previous errors
      setErrors({});
      return true;
    } catch (error: any) {
      // Set validation errors
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage("");
    
    try {
      // Add the current timestamp
      const updatedFormData = {
        ...formData,
        submittedAt: new Date().toISOString(),
        faid: formData.faid 
      };

      // Create FormData for submission
      const formDataToSubmit = new FormData();
      
      // Add form fields to FormData
      formDataToSubmit.append("bpm", updatedFormData.bpm.toString());
      formDataToSubmit.append("key", updatedFormData.key.toString());
      formDataToSubmit.append("approachability", updatedFormData.approachability.toString());
      formDataToSubmit.append("modelType", updatedFormData.modelType);
      formDataToSubmit.append("submittedAt", updatedFormData.submittedAt);
      formDataToSubmit.append("faid", updatedFormData.faid);
      
      // Add file if it exists
      if (selectedFile) {
        formDataToSubmit.append("file", selectedFile);
        formDataToSubmit.append("fileName", selectedFile.name);
        formDataToSubmit.append("fileSize", selectedFile.size.toString());
        formDataToSubmit.append("fileType", selectedFile.type);
        
        // Update form data with file info
        updatedFormData.fileName = selectedFile.name;
        updatedFormData.fileSize = selectedFile.size;
        updatedFormData.fileType = selectedFile.type;
      }

      for (let [key, value] of formDataToSubmit.entries()) {
  	console.log(`${key}:`, value);
	}
      
      // Submit the form to external server on port 8090
      const response = await //fetch("http://localhost:8090/api/form", {
      fetch("/api/form", {
        method: "POST",
        body: formDataToSubmit,
        // Add CORS headers
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit form");
      }
      
      const result = await response.json();

      // Success! Reset form
      setSuccessMessage("Form submitted successfully!");
      
      const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const delay = async () => {
  await sleep(1000)
  console.log("First")
  await sleep(1000)
  console.log("Second")
  await sleep(1000)
  console.log("Third")
}

	delay();

      console.log("TUTTTTTTTTTTTTTTTTTTTTTTI");
      console.log(result);

      var del = delay();
      await del;

      // ✅ Redirect manually
      window.location.href = "/status/" + result.data.faid;

      
      // Reset form data
      setFormData({
        bpm: false,
        key: false,
        approachability: false,
        modelType: 'discogs-effnet',
        fileName: null,
        fileSize: null,
        fileType: null,
        submittedAt: "",
      });
      
      // Reset file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
    } catch (error: any) {
  if (error instanceof Response) {
    const errorData = await error.json();
    alert("Server error: " + JSON.stringify(errorData.errors || errorData));
  } else {
      alert(`Error submitting form: ${error.message}`);
  }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Template (Vue-like JSX structure)
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <h1 className={styles.title}>Matnn (Music Audio Tagger Neural Net)</h1>
          
          <form onSubmit={onSubmit} className={styles.form}>
            <div className={styles.optionsSection}>
              <h2 className={styles.sectionTitle}>Attributes Selection</h2>
              
              {errors.options && (
                <p className={styles.errorText}>{errors.options}</p>
              )}
              
              <div className={styles.checkboxContainer}>
                <input 
                  type="checkbox" 
                  id="bpm" 
                  checked={formData.bpm}
                  onChange={() => handleCheckboxChange('bpm')}
                  className={styles.checkbox}
                />
                <label htmlFor="bpm" className={styles.label}>
                  BPM<span className={styles.required}>*</span>
                </label>
              </div>
              
              <div className={styles.checkboxContainer}>
                <input 
                  type="checkbox" 
                  id="key" 
                  checked={formData.key}
                  onChange={() => handleCheckboxChange('key')}
                  className={styles.checkbox}
                />
                <label htmlFor="key" className={styles.label}>
                  Key
                </label>
              </div>
              
              <div className={styles.checkboxContainer}>
                <input 
                  type="checkbox" 
                  id="approachability" 
                  checked={formData.approachability}
                  onChange={() => handleCheckboxChange('approachability')}
                  className={styles.checkbox}
                />
                <label htmlFor="approachability" className={styles.label}>
                  Approachability / Engagement
                </label>
              </div>
              
              <h2 className={styles.sectionTitle + " mt-6"}>Classification Model</h2>
              
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    id="discogs-effnet" 
                    name="modelType"
                    value="discogs-effnet"
                    checked={formData.modelType === 'discogs-effnet'}
                    onChange={() => handleRadioChange('discogs-effnet')}
                    className={styles.checkbox}
                  />
                  <label htmlFor="discogs-effnet" className={styles.label}>
                    Discogs-Effnet
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    id="musicnn" 
                    name="modelType"
                    value="musicnn"
                    checked={formData.modelType === 'musicnn'}
                    onChange={() => handleRadioChange('musicnn')}
                    className={styles.checkbox}
                  />
                  <label htmlFor="musicnn" className={styles.label}>
                    Musicnn
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    id="magnatagatune" 
                    name="modelType"
                    value="magnatagatune"
                    checked={formData.modelType === 'magnatagatune'}
                    onChange={() => handleRadioChange('magnatagatune')}
                    className={styles.checkbox}
                  />
                  <label htmlFor="magnatagatune" className={styles.label}>
                    Magnatagatune
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.fileSection}>
              <h2 className={styles.sectionTitle}>File Attachment</h2>
              
              <div
                className={styles.dropZone(isDragging, !!selectedFile)}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileChange}
                  className="sr-only"
                  ref={fileInputRef}
                  aria-label="Upload file"
                />
                
                {!selectedFile ? (
                  <div className="flex flex-col items-center justify-center">
                    <svg className={styles.fileUploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <label 
                      htmlFor="fileUpload" 
                      className={styles.dropzoneText}
                    >
                      Click to add file or drag and drop
                    </label>
                    <span className={styles.maxSizeText}>
                      Max file size: 10MB
                    </span>
                  </div>
                ) : (
                  <div className={styles.filePreview}>
                    <div className="flex items-center">
                      <svg className={styles.fileIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className={styles.fileName}>
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className={styles.removeButton}
                      aria-label="Remove file"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className={styles.loadingSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  "Predict!"
                )}
              </button>
              
              {successMessage && (
                <div className={styles.successMessage}>
                  <svg className={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
