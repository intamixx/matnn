import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formValidationSchema, type InsertFormSubmission } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CloudUpload,
  Upload,
  X,
  Check,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FormPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<InsertFormSubmission>({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      option1: false,
      option2: false,
      option3: false,
      option4: false,
      fileName: null,
      fileSize: null,
      fileType: null,
      submittedAt: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertFormSubmission) => {
      const formData = new FormData();
      
      // Add form fields to FormData
      formData.append("option1", data.option1.toString());
      formData.append("option2", data.option2.toString());
      formData.append("option3", data.option3.toString());
      formData.append("option4", data.option4.toString());
      formData.append("submittedAt", data.submittedAt);
      
      // Add file if it exists
      if (selectedFile) {
        formData.append("file", selectedFile);
        formData.append("fileName", selectedFile.name);
        formData.append("fileSize", selectedFile.size.toString());
        formData.append("fileType", selectedFile.type);
      }
      
      const response = await fetch("/api/form", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit form");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Form submitted successfully!",
        description: "Thank you for your submission.",
        variant: "default",
      });
      
      // Reset form and file
      form.reset();
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error submitting form",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFormSubmission) => {
    // Add the current timestamp
    data.submittedAt = new Date().toISOString();
    
    // Add file metadata if a file is selected
    if (selectedFile) {
      data.fileName = selectedFile.name;
      data.fileSize = selectedFile.size;
      data.fileType = selectedFile.type;
    }
    
    submitMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      
      // Update file input value to match
      if (fileInputRef.current) {
        // This doesn't actually work due to security reasons, but we're setting the file manually above
        // fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6">
          <h1 className="text-2xl font-medium text-gray-800 mb-6">Form Submission</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-700">Options Selection</h2>
                
                <FormField
                  control={form.control}
                  name="option1"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="option1"
                        />
                      </FormControl>
                      <FormLabel htmlFor="option1" className="text-sm font-normal cursor-pointer">
                        Option 1<span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="option2"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="option2"
                        />
                      </FormControl>
                      <FormLabel htmlFor="option2" className="text-sm font-normal cursor-pointer">
                        Option 2
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="option3"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="option3"
                        />
                      </FormControl>
                      <FormLabel htmlFor="option3" className="text-sm font-normal cursor-pointer">
                        Option 3
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="option4"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="option4"
                        />
                      </FormControl>
                      <FormLabel htmlFor="option4" className="text-sm font-normal cursor-pointer">
                        Option 4
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                {form.formState.errors.options && (
                  <p className="text-red-500 text-sm mt-2">
                    {form.formState.errors.options.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-gray-700">File Attachment</h2>
                
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging ? "border-primary bg-blue-50" : "border-gray-300 hover:border-primary",
                    selectedFile ? "bg-blue-50" : ""
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                      <CloudUpload className="h-10 w-10 text-gray-400 mb-2" />
                      <label 
                        htmlFor="fileUpload" 
                        className="text-gray-600 cursor-pointer"
                      >
                        Click to add file or drag and drop
                      </label>
                      <span className="text-gray-400 text-sm mt-1">
                        Max file size: 10MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-primary mr-2" />
                        <span className="text-gray-800 text-sm truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-gray-500 hover:text-red-500"
                        aria-label="Remove file"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-blue-700 text-white font-medium transition-colors"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Form"
                  )}
                </Button>
                
                {submitMutation.isSuccess && (
                  <div className="mt-4 p-3 bg-green-100 text-green-700 rounded flex items-center">
                    <Check className="mr-2 h-5 w-5" />
                    <span>Form submitted successfully!</span>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
