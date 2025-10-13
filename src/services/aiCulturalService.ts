// AI Cultural Service for Tahitian Language Learning
// Provides intelligent, context-aware responses about Tahitian culture

export interface CulturalContext {
  topic: string;
  subtopic?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  previousQuestions: string[];
}

export interface CulturalResponse {
  message: string;
  pronunciation?: string;
  culturalNote?: string;
  relatedTopics: string[];
  tahitianPhrase?: {
    tahitian: string;
    english: string;
    pronunciation: string;
  };
}

class AICulturalService {
  private conversationHistory: Array<{role: 'user' | 'ai', content: string, timestamp: Date}> = [];
  
  private culturalDatabase = {
    greetings: {
      basic: {
        'ia orana': {
          meaning: 'Hello/Good day',
          pronunciation: 'ee-ah oh-rah-nah',
          usage: 'Most common greeting, used any time of day',
          culturalNote: 'Literally means "may you live" - we wish life and health to everyone we meet'
        },
        'maeva': {
          meaning: 'Welcome',
          pronunciation: 'mah-eh-vah',
          usage: 'Used to welcome someone to your home or island',
          culturalNote: 'Shows the spirit of hospitality that is central to Polynesian culture'
        },
        'nana': {
          meaning: 'Goodbye',
          pronunciation: 'nah-nah',
          usage: 'Casual goodbye among friends',
          culturalNote: 'Often accompanied by a warm hug or touching of foreheads'
        }
      },
      formal: {
        'ia orana e te hoa': {
          meaning: 'Hello, friend',
          pronunciation: 'ee-ah oh-rah-nah eh teh ho-ah',
          usage: 'Respectful greeting to someone you know',
          culturalNote: 'Shows respect and acknowledges the relationship'
        }
      }
    },
    
    culture: {
      dance: {
        otea: {
          description: 'Fast-paced traditional dance with rapid hip movements',
          meaning: 'Tells stories of love, nature, and daily life',
          culturalNote: 'The speed and intensity represent the passion of Polynesian life',
          music: 'Accompanied by traditional drums (pahu) and chanting'
        },
        aparima: {
          description: 'Graceful dance using hand and arm movements',
          meaning: 'Narrates legends and stories through gestures',
          culturalNote: 'Each hand movement has specific meaning - it\'s a visual language',
          music: 'Often performed to slower, melodic songs'
        },
        hivinau: {
          description: 'Circle dance performed by groups',
          meaning: 'Community bonding and celebration',
          culturalNote: 'Brings people together, symbolizing unity and shared culture'
        }
      },
      
      traditions: {
        tatau: {
          description: 'Traditional Polynesian tattooing',
          meaning: 'Personal and family history written on the skin',
          culturalNote: 'Each symbol tells a story - your achievements, family, spiritual beliefs',
          process: 'Done with traditional tools made from bone and natural inks'
        },
        marae: {
          description: 'Sacred ceremonial sites',
          meaning: 'Places of worship and community gathering',
          culturalNote: 'These stone platforms connect us to our ancestors and gods',
          respect: 'Always approach with reverence and remove shoes'
        },
        rahui: {
          description: 'Traditional conservation practice',
          meaning: 'Temporary ban on harvesting from specific areas',
          culturalNote: 'Shows our respect for nature and sustainable living',
          modern: 'Still practiced today to protect marine and land resources'
        }
      }
    },
    
    food: {
      traditional: {
        'poisson cru': {
          description: 'Raw fish marinated in coconut milk and lime',
          preparation: 'Fresh fish, coconut milk, lime juice, vegetables',
          culturalNote: 'Our national dish - represents the abundance of our ocean',
          pronunciation: 'pwah-sohn kroo'
        },
        'tamaaraa': {
          description: 'Traditional earth oven feast',
          preparation: 'Food cooked underground with hot stones',
          culturalNote: 'More than cooking - it\'s a ceremony that brings families together',
          foods: 'Pig, fish, breadfruit, taro, sweet potato'
        },
        'fafaru': {
          description: 'Fermented fish dish',
          preparation: 'Fish fermented in seawater',
          culturalNote: 'Acquired taste that connects us to ancient preservation methods',
          serving: 'Often served with coconut milk'
        }
      },
      
      fruits: {
        'uru': {
          name: 'Breadfruit',
          description: 'Staple starchy fruit',
          culturalNote: 'So important that families plant breadfruit trees for future generations',
          preparation: 'Baked, boiled, or made into poi'
        },
        'nono': {
          name: 'Noni fruit',
          description: 'Medicinal fruit with strong smell',
          culturalNote: 'Traditional medicine - our ancestors used it for healing',
          uses: 'Juice for health, leaves for traditional medicine'
        }
      }
    },
    
    language: {
      basics: {
        'mauruuru': {
          meaning: 'Thank you',
          pronunciation: 'mah-oo-roo-roo',
          usage: 'Express gratitude',
          culturalNote: 'Gratitude is very important in our culture'
        },
        'aroha': {
          meaning: 'Love, compassion, affection',
          pronunciation: 'ah-roh-hah',
          usage: 'Deep emotional connection',
          culturalNote: 'More than love - it\'s the spirit of caring for others'
        },
        'mana': {
          meaning: 'Spiritual power, life force',
          pronunciation: 'mah-nah',
          usage: 'Spiritual concept',
          culturalNote: 'Everything has mana - people, places, objects'
        }
      },
      
      family: {
        'metua': {
          meaning: 'Parent',
          pronunciation: 'meh-too-ah',
          culturalNote: 'Parents are deeply respected in our culture'
        },
        'tamarii': {
          meaning: 'Children',
          pronunciation: 'tah-mah-ree-ee',
          culturalNote: 'Children are treasured and raised by the whole community'
        },
        'tupuna': {
          meaning: 'Ancestors/grandparents',
          pronunciation: 'too-poo-nah',
          culturalNote: 'We honor our ancestors and seek their guidance'
        }
      }
    },
    
    nature: {
      ocean: {
        'moana': {
          meaning: 'Ocean, deep sea',
          pronunciation: 'moh-ah-nah',
          culturalNote: 'The ocean is our highway, our provider, our spiritual connection'
        },
        'vahi': {
          meaning: 'Place, location',
          pronunciation: 'vah-hee',
          culturalNote: 'Every place has its own mana and stories'
        }
      }
    }
  };

  generateCulturalResponse(input: string, context?: CulturalContext): CulturalResponse {
    const lowerInput = input.toLowerCase();
    this.conversationHistory.push({role: 'user', content: input, timestamp: new Date()});
    
    // Analyze input for cultural topics
    const response = this.analyzeAndRespond(lowerInput, context);
    
    this.conversationHistory.push({role: 'ai', content: response.message, timestamp: new Date()});
    
    return response;
  }

  private analyzeAndRespond(input: string, context?: CulturalContext): CulturalResponse {
    // Greeting responses
    if (this.containsKeywords(input, ['hello', 'hi', 'greet', 'ia orana', 'maeva'])) {
      return this.generateGreetingResponse(input);
    }
    
    // Dance and music
    if (this.containsKeywords(input, ['dance', 'otea', 'aparima', 'music', 'drum'])) {
      return this.generateDanceResponse(input);
    }
    
    // Food and cooking
    if (this.containsKeywords(input, ['food', 'eat', 'cook', 'poisson', 'tamaaraa', 'breadfruit'])) {
      return this.generateFoodResponse(input);
    }
    
    // Language learning
    if (this.containsKeywords(input, ['word', 'language', 'speak', 'pronounce', 'mean'])) {
      return this.generateLanguageResponse(input);
    }
    
    // Traditions and culture
    if (this.containsKeywords(input, ['tradition', 'culture', 'tattoo', 'marae', 'custom'])) {
      return this.generateTraditionResponse(input);
    }
    
    // Travel and places
    if (this.containsKeywords(input, ['travel', 'visit', 'island', 'bora', 'moorea', 'place'])) {
      return this.generateTravelResponse(input);
    }
    
    // Default response with cultural wisdom
    return this.generateDefaultResponse(input);
  }

  private containsKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }

  private generateGreetingResponse(input: string): CulturalResponse {
    const greetings = this.culturalDatabase.greetings.basic;
    const greeting = greetings['ia orana'];
    
    return {
      message: `Ia Orana! ${greeting.culturalNote} When we greet each other, we're sharing positive energy and wishing good health. Try saying "Ia Orana" - it's pronounced "${greeting.pronunciation}".`,
      pronunciation: greeting.pronunciation,
      culturalNote: 'Greetings in Tahitian culture are more than words - they\'re blessings',
      relatedTopics: ['Basic phrases', 'Cultural respect', 'Daily interactions'],
      tahitianPhrase: {
        tahitian: 'Ia Orana',
        english: 'Hello/Good day',
        pronunciation: 'ee-ah oh-rah-nah'
      }
    };
  }

  private generateDanceResponse(input: string): CulturalResponse {
    const dances = this.culturalDatabase.culture.dance;
    
    if (input.includes('otea')) {
      const otea = dances.otea;
      return {
        message: `The Otea is our most energetic dance! ${otea.description} ${otea.culturalNote} The rapid hip movements aren't just for show - they represent the power and passion of island life. ${otea.music}`,
        culturalNote: 'Each dance movement tells a story from our oral traditions',
        relatedTopics: ['Aparima dance', 'Traditional music', 'Cultural festivals', 'Heiva festival'],
        tahitianPhrase: {
          tahitian: 'Ori Tahiti',
          english: 'Tahitian dance',
          pronunciation: 'oh-ree tah-hee-tee'
        }
      };
    }
    
    return {
      message: `Tahitian dance is our living history! We have the energetic Otea with rapid hip movements, the graceful Aparima that tells stories with hand gestures, and the community Hivinau circle dance. Each dance connects us to our ancestors and nature.`,
      culturalNote: 'Dance is how we pass down our stories and connect with our spiritual heritage',
      relatedTopics: ['Otea dance', 'Aparima dance', 'Traditional drums', 'Cultural costumes'],
      tahitianPhrase: {
        tahitian: 'Ori Tahiti',
        english: 'Tahitian dance',
        pronunciation: 'oh-ree tah-hee-tee'
      }
    };
  }

  private generateFoodResponse(input: string): CulturalResponse {
    const foods = this.culturalDatabase.food.traditional;
    
    if (input.includes('poisson')) {
      const poisson = foods['poisson cru'];
      return {
        message: `Poisson Cru is our beloved national dish! ${poisson.description} ${poisson.culturalNote} The fresh fish represents our connection to the ocean, while the coconut milk shows how we use every part of our island's gifts.`,
        pronunciation: poisson.pronunciation,
        culturalNote: 'Food in Tahiti is always shared - eating alone is considered sad',
        relatedTopics: ['Coconut preparation', 'Fishing traditions', 'Island ingredients'],
        tahitianPhrase: {
          tahitian: 'Poisson Cru',
          english: 'Raw fish in coconut milk',
          pronunciation: 'pwah-sohn kroo'
        }
      };
    }
    
    return {
      message: `Tahitian cuisine celebrates our island's abundance! Our famous Poisson Cru (raw fish in coconut milk), traditional Tamaaraa earth oven feasts, and staples like breadfruit (uru) and taro. We believe food should be shared with family and friends - "Tamaa maitai!" (good eating!)`,
      culturalNote: 'Every meal is a celebration of community and gratitude to nature',
      relatedTopics: ['Traditional cooking', 'Island ingredients', 'Family meals', 'Coconut uses'],
      tahitianPhrase: {
        tahitian: 'Tamaa maitai',
        english: 'Good eating/Enjoy your meal',
        pronunciation: 'tah-mah-ah my-tie'
      }
    };
  }

  private generateLanguageResponse(input: string): CulturalResponse {
    const basics = this.culturalDatabase.language.basics;
    const words = Object.keys(basics);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const wordInfo = basics[randomWord as keyof typeof basics];
    
    return {
      message: `Tahitian is a beautiful, melodic language with only 13 letters! Let me teach you "${randomWord}" - it means "${wordInfo.meaning}" and is pronounced "${wordInfo.pronunciation}". ${wordInfo.culturalNote}`,
      pronunciation: wordInfo.pronunciation,
      culturalNote: 'Our language carries the soul of our culture in every word',
      relatedTopics: ['Basic vocabulary', 'Pronunciation guide', 'Cultural meanings', 'Family terms'],
      tahitianPhrase: {
        tahitian: randomWord,
        english: wordInfo.meaning,
        pronunciation: wordInfo.pronunciation
      }
    };
  }

  private generateTraditionResponse(input: string): CulturalResponse {
    const traditions = this.culturalDatabase.culture.traditions;
    
    if (input.includes('tattoo') || input.includes('tatau')) {
      const tatau = traditions.tatau;
      return {
        message: `Tatau (traditional tattooing) is sacred art! ${tatau.description} ${tatau.culturalNote} ${tatau.process} It's not just decoration - it's your life story written on your skin.`,
        culturalNote: 'Each tattoo symbol has deep meaning and connects you to your ancestors',
        relatedTopics: ['Traditional symbols', 'Cultural identity', 'Sacred art', 'Family history'],
        tahitianPhrase: {
          tahitian: 'Tatau',
          english: 'Traditional tattoo',
          pronunciation: 'tah-tah-oo'
        }
      };
    }
    
    return {
      message: `Our traditions are living connections to our ancestors! We have Tatau (sacred tattooing), Marae (ceremonial sites), and Rahui (conservation practices). Each tradition teaches us respect for our culture, our land, and each other.`,
      culturalNote: 'Traditions aren\'t just history - they guide how we live today',
      relatedTopics: ['Sacred sites', 'Cultural practices', 'Ancestral wisdom', 'Island conservation'],
      tahitianPhrase: {
        tahitian: 'Hiro\'a',
        english: 'Culture/tradition',
        pronunciation: 'hee-roh-ah'
      }
    };
  }

  private generateTravelResponse(input: string): CulturalResponse {
    return {
      message: `Welcome to our beautiful islands! Visit the stunning blue lagoons of Bora Bora, hike the lush valleys of Moorea, explore the black sand beaches of Tahiti Iti, and pay respect at our sacred Marae temples. Each island has its own mana (spiritual energy) and stories.`,
      culturalNote: 'When you visit, remember to respect our sacred sites and natural environment',
      relatedTopics: ['Island hopping', 'Sacred sites', 'Natural wonders', 'Cultural etiquette'],
      tahitianPhrase: {
        tahitian: 'Maeva i te fenua',
        english: 'Welcome to the land',
        pronunciation: 'mah-eh-vah ee teh feh-noo-ah'
      }
    };
  }

  private generateDefaultResponse(input: string): CulturalResponse {
    const responses = [
      {
        message: "That's a wonderful question! In Tahitian culture, we believe that every question opens a door to understanding. Our islands hold many stories, traditions, and wisdom. What aspect of our culture interests you most?",
        phrase: { tahitian: 'Parau api', english: 'New story/Fresh news', pronunciation: 'pah-rah-oo ah-pee' }
      },
      {
        message: "Maeva to your curiosity! Our Polynesian culture is like the ocean - deep, flowing, and full of life. Whether you're interested in our language, dances, food, or spiritual beliefs, each topic connects to our love for family and nature.",
        phrase: { tahitian: 'Aroha', english: 'Love/compassion', pronunciation: 'ah-roh-hah' }
      },
      {
        message: "In our culture, we say that knowledge is like a pearl - it grows more beautiful when shared. I'm here to share the treasures of Tahitian culture with you. What would you like to explore?",
        phrase: { tahitian: 'Mana', english: 'Spiritual power/life force', pronunciation: 'mah-nah' }
      }
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: randomResponse.message,
      culturalNote: 'Every conversation is an opportunity to share our cultural heritage',
      relatedTopics: ['Language basics', 'Cultural traditions', 'Island life', 'Spiritual beliefs'],
      tahitianPhrase: randomResponse.phrase
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export const aiCulturalService = new AICulturalService();