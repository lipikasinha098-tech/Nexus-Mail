import React from 'react';
import { DetailedMessage } from '../types';
import { ArrowLeft, Download, Paperclip } from 'lucide-react';

interface MessageViewerProps {
  message: DetailedMessage;
  onBack: () => void;
}

export const MessageViewer: React.FC<MessageViewerProps> = ({ message, onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-slate-100 z-10 relative">
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-800 bg-slate-900/40 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-cyan-400 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate text-white">
            {message.subject || 'No Subject'}
          </h2>
          <div className="flex items-center text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-wider">
            <span className="truncate text-slate-400">From: {message.from}</span>
            <span className="mx-2">•</span>
            <span className="shrink-0 font-mono">{new Date(message.date).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col">
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800 shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> 
              Attachments ({message.attachments.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-black border border-slate-700 rounded-lg text-sm text-slate-300">
                  <span className="truncate max-w-[200px]">{att.filename}</span>
                  <span className="text-cyan-500 text-xs font-mono">({(att.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white text-black rounded-xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
          {message.htmlBody ? (
            <iframe
              srcDoc={message.htmlBody}
              className="w-full h-full min-h-[500px] border-none bg-white"
              sandbox="allow-popups allow-same-origin"
              title="Email Content"
            />
          ) : (
            <div className="p-6 h-full overflow-y-auto">
               <pre className="whitespace-pre-wrap font-sans text-sm">{message.textBody || message.body}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

