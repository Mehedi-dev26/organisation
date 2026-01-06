import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { streamChat } from '@/utils/chatStream';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatBot = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMessage = language === 'bn' 
    ? 'আসসালামু আলাইকুম! 👋 আমি সময়ের বাতিঘর সহায়ক। আপনাকে কিভাবে সাহায্য করতে পারি?'
    : 'Hello! 👋 I am Somoyer Batighor Assistant. How can I help you?';

  const quickReplies = language === 'bn' 
    ? ['সদস্য হতে চাই', 'চাঁদার তথ্য', 'যোগাযোগ']
    : ['Become a Member', 'Dues Info', 'Contact'];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages.filter(m => m.content !== welcomeMessage),
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => {
          setMessages(prev => [...prev, { role: 'assistant', content: error }]);
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button with pulse animation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300",
          "bottom-20 right-4 md:bottom-8 md:right-8",
          "hover:scale-110 active:scale-95",
          isOpen 
            ? "bg-destructive text-destructive-foreground rotate-0" 
            : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground animate-pulse"
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <div className={cn(
          "transition-transform duration-300",
          isOpen ? "rotate-90" : "rotate-0"
        )}>
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </div>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Chat Window - Full screen on mobile */}
      <div
        className={cn(
          "fixed z-50 bg-background flex flex-col overflow-hidden transition-all duration-300 ease-out",
          // Mobile: nearly full screen
          "inset-x-2 bottom-36 top-16 rounded-2xl border border-border shadow-2xl",
          // Desktop: fixed size positioned
          "md:inset-auto md:bottom-28 md:right-8 md:w-[380px] md:h-[520px] md:rounded-2xl",
          isOpen 
            ? "opacity-100 scale-100 pointer-events-auto" 
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground px-4 py-3 flex items-center gap-3 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-10 w-10 h-10 bg-white/5 rounded-full translate-y-1/2" />
          
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1 z-10">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              {language === 'bn' ? 'সময়ের বাতিঘর' : 'Somoyer Batighor'}
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs opacity-90">
                {language === 'bn' ? 'AI সহায়ক অনলাইন' : 'AI Assistant Online'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
          <div className="space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2 animate-fade-in",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                    <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 md:py-2.5 rounded-2xl text-sm whitespace-pre-wrap relative shadow-sm",
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                      : 'bg-muted/80 text-foreground rounded-bl-md border border-border/50'
                  )}
                >
                  {message.role === 'assistant' && (
                    <span className="absolute -top-2.5 left-2 px-2 py-0.5 text-[10px] font-bold tracking-widest bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-md flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                  <span className={message.role === 'assistant' ? 'mt-1 block' : ''}>
                    {message.content}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 ring-1 ring-secondary/50">
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2 justify-start animate-fade-in">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                </div>
                <div className="bg-muted/80 px-4 py-3 rounded-2xl rounded-bl-md border border-border/50 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick replies - show only after welcome message */}
            {messages.length === 1 && messages[0].role === 'assistant' && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 text-xs md:text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full border border-primary/30 transition-all hover:scale-105 active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area with better mobile styling */}
        <div className="p-3 md:p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={language === 'bn' ? 'আপনার প্রশ্ন লিখুন...' : 'Type your message...'}
              disabled={isLoading}
              className="flex-1 h-11 md:h-10 text-base md:text-sm rounded-full px-4 bg-background border-border/60 focus-visible:ring-primary/50"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-70">
            {language === 'bn' ? 'AI দ্বারা চালিত' : 'Powered by AI'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
