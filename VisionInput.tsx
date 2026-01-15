import React, { useState, useRef } from 'react';
import { Upload, Camera, Scan, Loader2, CheckCircle, X } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface VisionInputProps {
  theme: any;
  onTasksExtracted: (tasks: string[]) => void;
}

export function VisionInput({ theme, onTasksExtracted }: VisionInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const geminiService = GeminiService.getInstance();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsProcessing(true);
    setShowResults(false);

    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);
      
      // Extract text using Gemini Vision
      const extractedText = await geminiService.extractTextFromImage(base64);
      
      // Parse tasks from extracted text
      const tasks = parseTasksFromText(extractedText);
      
      setExtractedTasks(tasks);
      setShowResults(true);
      
      if (tasks.length > 0) {
        onTasksExtracted(tasks);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const parseTasksFromText = (text: string): string[] => {
    // Simple task parsing - look for bullet points, numbers, or lines with action words
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const tasks: string[] = [];
    
    const actionWords = ['call', 'email', 'meet', 'review', 'complete', 'finish', 'start', 'send', 'create', 'update'];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check for bullet points or numbered lists
      if (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const task = trimmed.replace(/^[-*•]\s+|^\d+\.\s+/, '');
        if (task.length > 3) tasks.push(task);
      }
      // Check for action words
      else if (actionWords.some(word => trimmed.toLowerCase().includes(word))) {
        tasks.push(trimmed);
      }
      // Check for checkbox-like patterns
      else if (trimmed.includes('☐') || trimmed.includes('□') || trimmed.includes('[ ]')) {
        const task = trimmed.replace(/[☐□\[\]\s]/g, '').trim();
        if (task.length > 3) tasks.push(task);
      }
    });
    
    return tasks.slice(0, 10); // Limit to 10 tasks
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, this would access the camera
    // For now, we'll trigger file upload
    fileInputRef.current?.click();
  };

  return (
    <div className={`p-6 rounded-2xl ${theme.card} border ${theme.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme.text} flex items-center gap-2`}>
          <Scan className="w-5 h-5" />
          Vision Input
        </h3>
        <button
          onClick={() => setShowResults(false)}
          className={`p-1 rounded ${theme.card} hover:bg-white/10`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!showResults ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging 
              ? 'border-blue-400 bg-blue-500/10' 
              : `${theme.border} hover:border-white/30`
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
              <p className={`${theme.text}`}>Analyzing image with AI...</p>
              <p className={`text-sm ${theme.textMuted}`}>Extracting tasks from your image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Upload className="w-12 h-12 text-blue-400" />
              <div>
                <p className={`${theme.text} mb-2`}>Drop an image here or click to upload</p>
                <p className={`text-sm ${theme.textMuted}`}>Supports screenshots, photos, and scanned documents</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/10 transition-all flex items-center gap-2`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
                <button
                  onClick={handleCameraCapture}
                  className={`px-4 py-2 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/10 transition-all flex items-center gap-2`}
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Tasks extracted successfully!</span>
          </div>
          
          <div className="space-y-2">
            {extractedTasks.map((task, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${theme.card} border ${theme.border} flex items-center gap-3`}
              >
                <span className="text-blue-400 font-medium">{index + 1}.</span>
                <span className={`${theme.text}`}>{task}</span>
              </div>
            ))}
          </div>
          
          {extractedTasks.length === 0 && (
            <p className={`${theme.textMuted} text-center py-4`}>
              No tasks found in the image. Try a clearer photo of your to-do list.
            </p>
          )}
          
          <button
            onClick={() => {
              setShowResults(false);
              setExtractedTasks([]);
            }}
            className={`w-full px-4 py-2 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/10 transition-all`}
          >
            Process Another Image
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
}