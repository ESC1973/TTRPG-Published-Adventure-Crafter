import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, FileIcon, DegenesisIcon } from './Icons';

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface FileUploadProps {
  onGenerate: (adventureContent: string, additionalContents: { name: string, content: string }[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onGenerate }) => {
  // State for the main adventure file
  const [adventureFile, setAdventureFile] = useState<File | null>(null);
  const [adventureFileContent, setAdventureFileContent] = useState<string>('');
  const [isDraggingAdventure, setIsDraggingAdventure] = useState(false);
  const adventureFileInputRef = useRef<HTMLInputElement>(null);

  // State for additional lore/rule files
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalFilesContent, setAdditionalFilesContent] = useState<{ name: string, content: string }[]>([]);
  const [isDraggingAdditional, setIsDraggingAdditional] = useState(false);
  const additionalFilesInputRef = useRef<HTMLInputElement>(null);

  // Helper function to validate file types
  const isValidFileType = (file: File) => {
    const validExtensions = ['.txt', '.md'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    // Check extension primarily, but also allow standard text MIME types
    const isTextType = file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'text/x-markdown' || !file.type; // !file.type allows files where OS doesn't report MIME correctly but extension is valid
    return hasValidExtension || (isTextType && hasValidExtension);
  };

  const handleAdventureFileChange = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
        if (isValidFileType(selectedFile)) {
            setAdventureFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAdventureFileContent(e.target?.result as string);
            };
            reader.readAsText(selectedFile);
        } else {
             alert('The adventure file must be a .txt or .md file.');
        }
    }
  }, []);

  const handleAdditionalFilesChange = useCallback((selectedFiles: FileList | null) => {
    if (selectedFiles) {
        const newFiles = Array.from(selectedFiles).filter(f => isValidFileType(f));
        
        const uniqueNewFiles = newFiles.filter(newFile => 
            !additionalFiles.some(existingFile => existingFile.name === newFile.name)
        );

        if (uniqueNewFiles.length > 0) {
            setAdditionalFiles(prev => [...prev, ...uniqueNewFiles]);
            
            uniqueNewFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    setAdditionalFilesContent(prev => [...prev, { name: file.name, content }]);
                };
                reader.readAsText(file);
            });
        }
        
        if (newFiles.length !== selectedFiles.length) {
            alert('Some files were not .txt or .md files and were ignored.');
        }
    }
  }, [additionalFiles]);

  const removeAdditionalFile = (fileName: string) => {
      setAdditionalFiles(prev => prev.filter(f => f.name !== fileName));
      setAdditionalFilesContent(prev => prev.filter(fc => fc.name !== fileName));
  };


  const createDragHandlers = (setDragging: React.Dispatch<React.SetStateAction<boolean>>) => ({
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setDragging(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setDragging(false);
    },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation();
    },
  });

  const onDropAdventure = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingAdventure(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAdventureFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const onDropAdditional = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingAdditional(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAdditionalFilesChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = () => {
    if (adventureFileContent) {
      onGenerate(adventureFileContent, additionalFilesContent);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-2xl border border-orange-800/50">
        <div className="text-center">
          <DegenesisIcon className="w-24 h-24 mx-auto text-orange-500/70 mb-4" />
          <h1 className="text-4xl font-bold text-orange-400">Degenesis Adventure Crafter</h1>
          <p className="mt-2 text-gray-400">Generate a Solo World State for the Post-Apocalyptic Age.</p>
        </div>

        {/* Adventure File Upload */}
        <div className="space-y-2">
            <h2 className="text-xl text-gray-300 font-semibold">1. Upload Adventure Scenario (.txt or .md)</h2>
            <div
                className={`flex justify-center items-center w-full p-6 border-2 ${isDraggingAdventure ? 'border-orange-500 bg-gray-700' : 'border-gray-600 border-dashed'} rounded-lg cursor-pointer transition-colors duration-300`}
                {...createDragHandlers(setIsDraggingAdventure)}
                onDrop={onDropAdventure}
                onClick={() => adventureFileInputRef.current?.click()}
            >
                <input
                    ref={adventureFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.md"
                    onChange={(e) => handleAdventureFileChange(e.target.files ? e.target.files[0] : null)}
                />
                {adventureFile ? (
                    <div className="text-center">
                    <FileIcon className="w-12 h-12 mx-auto text-orange-400" />
                    <p className="mt-2 text-lg font-semibold text-gray-200">{adventureFile.name}</p>
                    <p className="text-sm text-gray-400">{(adventureFile.size / 1024).toFixed(2)} KB</p>
                    <button onClick={(e) => { e.stopPropagation(); setAdventureFile(null); setAdventureFileContent(''); if(adventureFileInputRef.current) adventureFileInputRef.current.value = ''; }} className="mt-2 text-xs text-orange-500 hover:underline">Replace file</button>
                    </div>
                ) : (
                    <div className="text-center">
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
                    <p className="mt-2 text-gray-300"><span className="font-semibold text-orange-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">A single .txt or .md file</p>
                    </div>
                )}
            </div>
        </div>

         {/* Additional Files Upload */}
        <div className="space-y-2">
            <h2 className="text-xl text-gray-300 font-semibold">2. Upload Lore &amp; Rulebooks <span className="text-gray-500 text-sm">(Optional)</span></h2>
            <div
                className={`flex justify-center items-center w-full p-6 border-2 ${isDraggingAdditional ? 'border-orange-500 bg-gray-700' : 'border-gray-600 border-dashed'} rounded-lg cursor-pointer transition-colors duration-300`}
                 {...createDragHandlers(setIsDraggingAdditional)}
                onDrop={onDropAdditional}
                onClick={() => additionalFilesInputRef.current?.click()}
            >
                <input
                    ref={additionalFilesInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".txt,.md"
                    onChange={(e) => handleAdditionalFilesChange(e.target.files)}
                />
                 <div className="text-center">
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
                    <p className="mt-2 text-gray-300"><span className="font-semibold text-orange-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">Katharsys, Primal Punk etc. (.txt or .md files)</p>
                </div>
            </div>
             {additionalFiles.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1 pr-2">
                    {additionalFiles.map(file => (
                        <div key={file.name} className="flex items-center justify-between bg-gray-700 p-2 rounded-md text-sm">
                            <span className="truncate text-gray-300" title={file.name}>{file.name}</span>
                            <button onClick={() => removeAdditionalFile(file.name)} className="p-1 rounded-full text-gray-500 hover:text-orange-400 hover:bg-gray-600">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div>
          <button
            onClick={handleSubmit}
            disabled={!adventureFileContent}
            className="w-full px-4 py-3 text-lg font-bold text-white bg-orange-800 rounded-md hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
          >
            Generate World State
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;