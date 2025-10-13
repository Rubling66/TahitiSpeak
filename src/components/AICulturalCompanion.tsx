'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Bot, Sparkles, Users, MapPin, Send, MicOff, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

export const AICulturalCompanion = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([
    {
      role: 'ai',
      message: 'Ia Orana! I am your Tahitian cultural guide. Ask me about language, traditions, or island life. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      role: 'user',
      message: userInput,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsListening(false);
    setIsLoading(true);

    // Simulate AI response with enhanced cultural content
    setTimeout(() => {
      const aiResponse = generateAIResponse(userInput);
      const aiMessage: Message = {
        role: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiMessage]);
      setIsLoading(false);
      
      // Speak the response
      speakMessage(aiResponse);
    }, 1500);
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const generateAIResponse = (input: string): string => {
    const culturalResponses = {
      greeting: [
        "Mauruuru for your greeting! In Tahiti, we say 'Ia Orana' with a warm smile and sometimes a gentle hug among friends. The word comes from 'ia' (life) and 'orana' (living), so we're wishing each other a living life!",
        "Maeva! Welcome! In our culture, greetings are sacred. We often touch foreheads and noses in the traditional 'honi' greeting, sharing the breath of life."
      ],
      culture: [
        "Tahitian culture is deeply connected to nature and our ancestors. Our dances tell stories of the ocean waves, our music celebrates life's rhythms, and our traditions honor the mana (spiritual power) passed down through generations.",
        "Our culture revolves around 'ohana' (family) and community. We believe in living in harmony with nature, respecting our elders, and sharing our knowledge through oral traditions and dance."
      ],
      food: [
        "Ah, Tahitian cuisine! Try our famous Poisson Cru - raw fish marinated in coconut milk and lime. We also love breadfruit (uru), taro root, and fresh tropical fruits. Food is always shared in community - we say 'Tamaa maitai!' (good eating)!",
        "Our traditional earth oven 'tamaaraa' creates amazing flavors. We cook pig, fish, and vegetables wrapped in banana leaves underground. It's not just cooking - it's a ceremony that brings families together."
      ],
      travel: [
        "If you visit our beautiful islands, don't miss the blue lagoons of Bora Bora, the black sand beaches of Tahiti Iti, and the sacred marae temples where our ancestors worshipped. Each island has its own mana and stories.",
        "Visit during our Heiva festival in July - you'll see traditional dancing, hear ancient chants, and taste authentic food. The islands of Moorea and Huahine offer incredible hiking and cultural sites."
      ],
      language: [
        "Tahitian is a beautiful, melodic language! 'Maeva' means welcome, 'Manava' means heart/soul, and 'Aroha' means love and compassion. We have only 13 letters in our alphabet, making it easier to learn!",
        "Our language carries our culture's soul. 'Fenua' means both land and placenta - showing our deep connection to our homeland. 'Tapu' means sacred, and 'Rahui' means protected - concepts central to our way of life."
      ],
      dance: [
        "Tahitian dance is our living history! The 'Otea' is our fast hip dance that tells stories of nature and love. The 'Aparima' uses graceful hand movements to narrate legends. Each movement has meaning - we dance our stories!",
        "Our dances honor our gods and ancestors. The drum rhythms guide our movements, and our costumes made from natural materials connect us to the earth. Dancing is prayer in motion."
      ],
      music: [
        "Traditional Tahitian music uses drums (pahu), bamboo pipes, and ukulele. Our songs tell stories of love, nature, and our ancestors. The rhythm of our music matches the rhythm of the ocean waves.",
        "We have beautiful traditional chants called 'himene' that can make you cry with their beauty. Modern Tahitian music blends traditional sounds with contemporary styles."
      ],
      traditions: [
        "Our traditions include the art of tattooing (tatau), which tells personal stories on the skin. We also practice traditional navigation by stars, and our craftspeople create beautiful tapa cloth and wood carvings.",
        "We honor our ancestors through storytelling, maintain sacred sites called marae, and practice traditional healing with island plants. Every tradition connects us to our past and guides our future."
      ],
      default: [
        "That's a wonderful question! In Tahitian culture, we believe that language and culture are like the ocean - deep, flowing, and full of life. Would you like to learn more about our traditions, food, or perhaps some basic Tahitian phrases?",
        "Maeva to your curiosity! Our islands hold many secrets and stories. Whether you're interested in our dances, our connection to nature, or our spiritual beliefs, I'm here to share the beauty of Polynesian culture with you."
      ]
    };

    const lowerInput = input.toLowerCase();
    
    // Enhanced keyword matching
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('greet')) {
      return getRandomResponse(culturalResponses.greeting);
    }
    if (lowerInput.includes('culture') || lowerInput.includes('tradition') || lowerInput.includes('custom')) {
      return getRandomResponse(culturalResponses.culture);
    }
    if (lowerInput.includes('food') || lowerInput.includes('eat') || lowerInput.includes('cook') || lowerInput.includes('poisson')) {
      return getRandomResponse(culturalResponses.food);
    }
    if (lowerInput.includes('travel') || lowerInput.includes('visit') || lowerInput.includes('island') || lowerInput.includes('bora')) {
      return getRandomResponse(culturalResponses.travel);
    }
    if (lowerInput.includes('language') || lowerInput.includes('word') || lowerInput.includes('speak') || lowerInput.includes('tahitian')) {
      return getRandomResponse(culturalResponses.language);
    }
    if (lowerInput.includes('dance') || lowerInput.includes('otea') || lowerInput.includes('aparima')) {
      return getRandomResponse(culturalResponses.dance);
    }
    if (lowerInput.includes('music') || lowerInput.includes('song') || lowerInput.includes('drum')) {
      return getRandomResponse(culturalResponses.music);
    }
    if (lowerInput.includes('tradition') || lowerInput.includes('tattoo') || lowerInput.includes('marae')) {
      return getRandomResponse(culturalResponses.traditions);
    }
    
    return getRandomResponse(culturalResponses.default);
  };

  const getRandomResponse = (responses: string[]): string => {
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickQuestions = [
    "What does 'Maeva' mean?",
    "Tell me about Tahitian dance",
    "How do I greet someone properly?",
    "What's traditional Tahitian food?",
    "Share a cultural story",
    "Teach me basic Tahitian words",
    "What are marae temples?",
    "Tell me about island traditions"
  ];

  const handleQuickQuestion = (question: string) => {
    setUserInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gradient-to-br from-tropical-ocean to-tropical-lagoon rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm p-6 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-tropical-coral to-tropical-sunset rounded-2xl flex items-center justify-center animate-float">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-tropical-heading text-xl text-white">Tahitian Cultural Guide</h3>
            <p className="text-tropical-sand text-sm">Ask me anything about Tahitian culture and language</p>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <div className="flex items-center gap-2 text-tropical-sand">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-xs">Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-white/5">
        {conversation.map((msg, index) => (
          <div 
            key={index}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-tropical-coral shadow-lg' 
                : 'bg-gradient-to-br from-tropical-lagoon to-tropical-ocean shadow-lg'
            }`}>
              {msg.role === 'user' ? (
                <Users className="w-4 h-4 text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              )}
            </div>
            
            <div className={`max-w-[75%] rounded-2xl p-4 shadow-lg ${
              msg.role === 'user'
                ? 'bg-white text-tropical-ocean border border-tropical-coral/20'
                : 'bg-white/10 text-tropical-sand backdrop-blur-sm border border-white/20'
            }`}>
              <p className="leading-relaxed">{msg.message}</p>
              <div className={`text-xs mt-2 ${
                msg.role === 'user' ? 'text-tropical-ocean/60' : 'text-tropical-sand/60'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tropical-lagoon to-tropical-ocean flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-tropical-sand">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-tropical-sand rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-tropical-sand rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-tropical-sand rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-6 py-4 border-t border-white/20 bg-white/5">
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-tropical-sand text-sm rounded-full border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
              aria-label={`Quick question: ${question}`}
            >
              {question}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Tahitian culture, traditions, or language..."
              className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-tropical-sand placeholder-tropical-sand/60 resize-none focus:outline-none focus:ring-2 focus:ring-tropical-coral/50 focus:border-tropical-coral/50 transition-all duration-300"
              rows={2}
              aria-label="Message input"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Voice Input Button */}
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                isListening 
                  ? 'bg-tropical-coral text-white animate-pulse' 
                  : 'bg-white/10 hover:bg-white/20 text-tropical-sand'
              } border border-white/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-tropical-coral to-tropical-sunset text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};