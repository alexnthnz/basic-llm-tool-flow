'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  MicOff,
  Trash2,
  Image as ImageIcon,
  Music,
} from 'lucide-react';
import { sendMessage } from '@/actions/chat';
import { initChatSessionAtom } from '@/store/chat';

export default function HomePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDeepSearchEnabled, setIsDeepSearchEnabled] = useState(false);
  const [isThinkEnabled, setIsThinkEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3.5-sonnet-v2');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_ATTACHMENTS = 5;
  
  const AVAILABLE_MODELS = [
    { id: 'claude-3.5-sonnet-v2', name: 'Claude 3.5 Sonnet v2' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
  ] as const;
  
  type ModelId = typeof AVAILABLE_MODELS[number]['id'];
  
  // Get the setter function for initializing a chat session
  const initChatSession = useSetAtom(initChatSessionAtom);

  const handleSendMessage = async (message: string | null = null) => {
    const messageToSend = message || inputValue;
    if ((!messageToSend.trim() && attachments.length === 0) || isLoading || isRecording) return;
    
    setIsLoading(true);
    
    try {
      // First message is always a new chat
      const result = await sendMessage({
        content: messageToSend,
        is_new_chat: true,
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      // Get data directly from the response
      const { message: responseMessage, session_id } = result.data;
      
      if (!session_id) {
        throw new Error('No session ID received from the server');
      }
      
      // Initialize the chat session in Jotai store with both user and assistant messages
      initChatSession({ 
        sessionId: session_id, 
        initialUserMessage: messageToSend,
        initialMessage: responseMessage,
        initialResources: result.data.resources,
        initialImages: result.data.images
      });
      
      // Redirect to the chat page with the session ID
      router.push(`/chats/${session_id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + attachments.length > MAX_ATTACHMENTS) {
      alert(`Maximum ${MAX_ATTACHMENTS} files allowed`);
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const getFileType = (file: File): 'image' | 'audio' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'other';
  };

  const discardRecording = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const hasReachedAttachmentLimit = attachments.length >= MAX_ATTACHMENTS;

  return (
    <div className="flex flex-col bg-gray-50 h-[calc(100vh-64px)]">
      <div className="flex-1 p-8 flex flex-col justify-end">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          <button 
            onClick={() => {
              setInputValue("How many times taller is the Eiffel Tower than the tallest building in the world?")
              handleSendMessage("How many times taller is the Eiffel Tower than the tallest building in the world?")
            }}
            className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-lg text-gray-600">How many times taller is the Eiffel Tower than the tallest building in the world?</p>
          </button>

          <button 
            onClick={() => {
              setInputValue("How many years does an average Tesla battery last compared to a gasoline engine?")
              handleSendMessage("How many years does an average Tesla battery last compared to a gasoline engine?")
            }}
            className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-lg text-gray-600">How many years does an average Tesla battery last compared to a gasoline engine?</p>
          </button>

          <button 
            onClick={() => {
              setInputValue("How many liters of water are required to produce 1 kg of beef?")
              handleSendMessage("How many liters of water are required to produce 1 kg of beef?")
            }}
            className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-lg text-gray-600">How many liters of water are required to produce 1 kg of beef?</p>
          </button>

          <button 
            onClick={() => {
              setInputValue("How many times faster is the speed of light compared to the speed of sound?")
              handleSendMessage("How many times faster is the speed of light compared to the speed of sound?")
            }}
            className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-lg text-gray-600">How many times faster is the speed of light compared to the speed of sound?</p>
          </button>
        </div>
      </div>

      <footer className="bg-gray-50 p-6 w-full">
        <div className="max-w-5xl mx-auto">
          {/* Hidden file input for image uploads */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            multiple
            max={MAX_ATTACHMENTS}
          />

          {isRecording && (
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <div className="relative h-2 w-2 mr-2">
                <div className="absolute inset-0 rounded-full bg-red-500" />
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
              </div>
              Recording... {formatTime(recordingTime)}
            </div>
          )}
          
          {hasReachedAttachmentLimit && (
            <div className="text-xs text-amber-600">
              Maximum of {MAX_ATTACHMENTS} attachments reached. Delete an attachment to add more.
            </div>
          )}
          <div className="flex items-center bg-white rounded-lg shadow border px-4 py-2 gap-2 flex-col">            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 w-full py-2">
                {attachments.map((file, index) => {
                  const fileType = getFileType(file);
                  return (
                    <div key={file.name} className="relative group">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                        {fileType === 'image' ? (
                          <img 
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                            <Music size={24} className="text-blue-600" />
                          </div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => discardRecording(index)}
                          className="absolute top-0 right-0 p-0.5 bg-black/50 hover:bg-black/70 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove attachment"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Input */}
            <Textarea
              className="flex-1 bg-transparent outline-none border-none focus:border-none focus:ring-0 focus:shadow-none px-3 py-2 text-base resize-none min-h-[40px] max-h-32 rounded-full shadow-none focus-visible:ring-0"
              placeholder="How can Deepflow help?"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || isRecording}
            />
            <div className="flex flex-row items-center gap-2 justify-between w-full">
              <div className="flex flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                    hasReachedAttachmentLimit 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'hover:bg-gray-100'
                  }`}
                  disabled={isLoading || isRecording || hasReachedAttachmentLimit}
                  title={hasReachedAttachmentLimit 
                    ? `Maximum ${MAX_ATTACHMENTS} files allowed` 
                    : "Upload image"}
                >
                  <ImageIcon 
                    size={20} 
                    className={hasReachedAttachmentLimit ? "text-gray-400" : "text-gray-500"} 
                  />
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-full transition ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : hasReachedAttachmentLimit
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  disabled={isLoading || hasReachedAttachmentLimit}
                  title={
                    hasReachedAttachmentLimit
                      ? `Maximum ${MAX_ATTACHMENTS} files allowed`
                      : isRecording 
                        ? "Stop recording" 
                        : "Record audio"
                  }
                >
                  {isRecording ? (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-500/50">
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                      </div>
                      <MicOff size={20} className="relative z-10" />
                    </>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
                {/* Action buttons */}
                <button
                  type="button"
                  onClick={() => setIsDeepSearchEnabled(!isDeepSearchEnabled)}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                    isDeepSearchEnabled
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  DeepSearch
                </button>
                <button
                  type="button"
                  onClick={() => setIsThinkEnabled(!isThinkEnabled)}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                    isThinkEnabled
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Think
                </button>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Select 
                  value={selectedModel} 
                  onValueChange={(value) => setSelectedModel(value as ModelId)}
                >
                  <SelectTrigger className="min-w-[100px] px-2 rounded-full bg-white border-none shadow-none focus:ring-0 focus:border-none">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={(inputValue.trim() === '' && attachments.length === 0) || isLoading || isRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:bg-gray-300 disabled:text-gray-400 ml-1"
                  title="Send"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
