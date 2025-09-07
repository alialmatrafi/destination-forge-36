import { GoogleGenerativeAI } from '@google/generative-ai';
import systemPrompt from './system_prompt.txt?raw';

// Add missing interface definitions
interface AIRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface AIResponse {
  content: string;
  itinerary?: any[];
  city?: string;
  country?: string;
}

// Check if API key is available
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
}

// Initialize Gemini AI
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Use imported system prompt
const SYSTEM_PROMPT = systemPrompt;

// Function to extract structured data from AI response
const extractTravelInfo = (message: string): { destination?: string; days?: number; interests?: string[]; travelType?: string; budget?: string; groupSize?: number } => {
  const text = message.toLowerCase();
  
  // Detect language of the input message
  const detectLanguage = (text: string): 'ar' | 'en' => {
    // Check for Arabic characters
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    if (arabicPattern.test(text)) {
      return 'ar';
    }
    return 'en';
  };
  
  // Extract destination
  let destination = '';
  const destinations = [
    'باريس', 'paris', 'دبي', 'dubai', 'لندن', 'london', 'القاهرة', 'cairo',
    'الرياض', 'riyadh', 'اسطنبول', 'istanbul', 'روما', 'rome', 'نيويورك', 'new york',
    'طوكيو', 'tokyo', 'برشلونة', 'barcelona', 'مدريد', 'madrid', 'أمستردام', 'amsterdam',
    'فيينا', 'vienna', 'براغ', 'prague', 'بودابست', 'budapest', 'وارسو', 'warsaw',
    'كوالالمبور', 'kuala lumpur', 'سنغافورة', 'singapore', 'بانكوك', 'bangkok',
    'هونج كونج', 'hong kong', 'سيول', 'seoul', 'أوساكا', 'osaka', 'كيوتو', 'kyoto',
    'بالي', 'bali', 'جاكرتا', 'jakarta', 'مانيلا', 'manila', 'هو تشي منه', 'ho chi minh',
    'مومباي', 'mumbai', 'دلهي', 'delhi', 'بنغالور', 'bangalore', 'كولكاتا', 'kolkata',
    'كراتشي', 'karachi', 'لاهور', 'lahore', 'إسلام آباد', 'islamabad',
    'الكويت', 'kuwait', 'الدوحة', 'doha', 'أبو ظبي', 'abu dhabi', 'الشارقة', 'sharjah',
    'مسقط', 'muscat', 'المنامة', 'manama', 'صنعاء', 'sanaa', 'عمان', 'amman',
    'بيروت', 'beirut', 'دمشق', 'damascus', 'بغداد', 'baghdad', 'البصرة', 'basra',
    'الإسكندرية', 'alexandria', 'أسوان', 'aswan', 'الأقصر', 'luxor', 'شرم الشيخ', 'sharm el sheikh',
    'الغردقة', 'hurghada', 'مراكش', 'marrakech', 'الدار البيضاء', 'casablanca',
    'فاس', 'fez', 'الرباط', 'rabat', 'تونس', 'tunis', 'الجزائر', 'algiers',
    'طرابلس', 'tripoli', 'بنغازي', 'benghazi', 'الخرطوم', 'khartoum',
    'أديس أبابا', 'addis ababa', 'نيروبي', 'nairobi', 'كيب تاون', 'cape town',
    'جوهانسبرغ', 'johannesburg', 'القاهرة', 'cairo', 'الجيزة', 'giza',
    'لوس أنجلوس', 'los angeles', 'سان فرانسيسكو', 'san francisco', 'شيكاغو', 'chicago',
    'بوسطن', 'boston', 'واشنطن', 'washington', 'ميامي', 'miami', 'لاس فيغاس', 'las vegas',
    'تورونتو', 'toronto', 'فانكوفر', 'vancouver', 'مونتريال', 'montreal',
    'ساو باولو', 'sao paulo', 'ريو دي جانيرو', 'rio de janeiro', 'بوينس آيرس', 'buenos aires',
    'ليما', 'lima', 'بوغوتا', 'bogota', 'كاراكاس', 'caracas', 'كيتو', 'quito',
    'سانتياغو', 'santiago', 'مونتيفيديو', 'montevideo', 'أسونسيون', 'asuncion',
    'سيدني', 'sydney', 'ملبورن', 'melbourne', 'بريسبان', 'brisbane', 'بيرث', 'perth',
    'أوكلاند', 'auckland', 'ويلينغتون', 'wellington', 'كرايستشيرش', 'christchurch',
    'موسكو', 'moscow', 'سانت بطرسبرغ', 'saint petersburg', 'كييف', 'kiev',
    'مينسك', 'minsk', 'فيلنيوس', 'vilnius', 'ريغا', 'riga', 'تالين', 'tallinn',
    'هلسنكي', 'helsinki', 'ستوكهولم', 'stockholm', 'أوسلو', 'oslo', 'كوبنهاغن', 'copenhagen',
    'ريكيافيك', 'reykjavik', 'دبلن', 'dublin', 'إدنبرة', 'edinburgh', 'كارديف', 'cardiff',
    'بلفاست', 'belfast', 'مانشستر', 'manchester', 'ليفربول', 'liverpool', 'برمنغهام', 'birmingham',
    'ليدز', 'leeds', 'شيفيلد', 'sheffield', 'بريستول', 'bristol', 'نيوكاسل', 'newcastle',
    'غلاسكو', 'glasgow', 'أبردين', 'aberdeen', 'إنفرنيس', 'inverness'
  ];
  
  for (const dest of destinations) {
    if (text.includes(dest)) {
      destination = dest;
      break;
    }
  }
  
  // Extract number of days
  let days = 0;
  const dayPatterns = [
    /(\d+)\s*(?:يوم|أيام|day|days)/gi,
    /(?:لمدة|for)\s*(\d+)\s*(?:يوم|أيام|day|days)/gi,
    /(\d+)\s*(?:ليلة|ليال|night|nights)/gi,
    /(?:مدة|duration|period)\s*(\d+)/gi,
    /(\d+)\s*(?:أيام|days)\s*(?:في|to|at)/gi,
    /(?:خلال|during)\s*(\d+)\s*(?:يوم|أيام|day|days)/gi
  ];
  
  for (const pattern of dayPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Get the first capturing group from the match
      const dayMatch = pattern.exec(text);
      if (dayMatch && dayMatch[1]) {
        days = parseInt(dayMatch[1]) || 0;
        if (days > 0) break;
      }
    }
  }
  
  // Additional fallback patterns for Arabic numbers
  if (days === 0) {
    const arabicNumbers = {
      'خمسة': 5, 'أربعة': 4, 'ثلاثة': 3, 'اثنين': 2, 'واحد': 1,
      'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
      'five': 5, 'four': 4, 'three': 3, 'two': 2, 'one': 1,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    for (const [word, num] of Object.entries(arabicNumbers)) {
      if (text.includes(word)) {
        days = num;
        break;
      }
    }
  }
  
  // Extract interests
  const interests = [];
  const interestKeywords = {
    'ثقافة': ['ثقافة', 'متاحف', 'تاريخ', 'آثار', 'culture', 'museums', 'history'],
    'طعام': ['طعام', 'مطاعم', 'أكل', 'food', 'restaurants', 'cuisine'],
    'تسوق': ['تسوق', 'shopping', 'أسواق', 'markets'],
    'طبيعة': ['طبيعة', 'حدائق', 'nature', 'parks', 'outdoor'],
    'مغامرة': ['مغامرة', 'adventure', 'رياضة', 'sports'],
    'استرخاء': ['استرخاء', 'relaxation', 'spa', 'beach', 'شاطئ']
  };
  
  for (const [interest, keywords] of Object.entries(interestKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      interests.push(interest);
    }
  }
  
  return { destination, days: days || 3, interests };
  
  // Extract travel type
  let travelType = 'general';
  const travelTypes = {
    'family': ['عائلية', 'أطفال', 'عائلة', 'family', 'kids', 'children'],
    'romantic': ['رومانسية', 'شهر عسل', 'romantic', 'honeymoon', 'couple'],
    'adventure': ['مغامرة', 'رياضة', 'adventure', 'hiking', 'sports'],
    'business': ['عمل', 'مؤتمر', 'business', 'conference', 'work'],
    'beach': ['شاطئ', 'بحر', 'beach', 'sea', 'resort'],
    'cultural': ['ثقافة', 'تاريخ', 'متاحف', 'culture', 'history', 'museums']
  };
  
  for (const [type, keywords] of Object.entries(travelTypes)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      travelType = type;
      break;
    }
  }
  
  // Extract budget hints
  let budget = 'medium';
  const budgetKeywords = {
    'low': ['رخيص', 'اقتصادي', 'محدود', 'budget', 'cheap', 'affordable'],
    'high': ['فاخر', 'راقي', 'luxury', 'premium', 'expensive'],
    'medium': ['متوسط', 'معقول', 'moderate', 'reasonable']
  };
  
  for (const [level, keywords] of Object.entries(budgetKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      budget = level;
      break;
    }
  }
  
  // Extract group size
  let groupSize = 2;
  const groupMatch = text.match(/(\d+)\s*(?:أشخاص|شخص|people|person|adults?|بالغ)/);
  if (groupMatch) {
    groupSize = parseInt(groupMatch[1]) || 2;
  }
  
  return { 
    destination, 
    days: days || 3, 
    interests,
    travelType,
    budget,
    groupSize
  };
};

const extractItineraryFromResponse = (response: string): { content: string; itinerary?: any[]; city?: string; country?: string } => {
  try {
    console.log('Raw AI response:', response);
    
    // Try multiple patterns to find JSON
    let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/```\s*(\{[\s\S]*?\})\s*```/);
    }
    if (!jsonMatch) {
      jsonMatch = response.match(/(\{[\s\S]*?"itinerary"[\s\S]*?\})/);
    }
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      console.log('Found JSON string:', jsonString);
      
      // Clean the JSON string
      const cleanedJson = jsonString
        .replace(/^\s*```json\s*/, '')
        .replace(/\s*```\s*$/, '')
        .replace(/^\s*```\s*/, '')
        .replace(/^\s*\{/, '{')
        .replace(/\}\s*$/, '}')
        .trim();
      
      console.log('Cleaned JSON:', cleanedJson);
      
      const parsed = JSON.parse(cleanedJson);
      console.log('Parsed JSON:', parsed);
      
      if (parsed.itinerary) {
        // Sanitize cost values to ensure they are numeric
        parsed.itinerary = parsed.itinerary.map((day: any) => ({
          ...day,
          items: day.items?.map((item: any) => ({
            ...item,
            cost: typeof item.cost === 'number' ? item.cost : 
                  (typeof item.cost === 'string' ? parseFloat(item.cost) || 0 : 0)
          })) || []
        }));
        
        // Extract clean content (text before JSON)
        const contentMatch = response.split(/```/)[0];
        const cleanContent = contentMatch
          .replace(/\{[\s\S]*?\}/g, '')
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim();
        
        return {
          content: cleanContent || parsed.content || 'خطة رحلة مخصصة',
          itinerary: parsed.itinerary,
          city: parsed.city,
          country: parsed.country
        };
      }
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.log('Response that failed to parse:', response);
  }

  // Clean the response from any JSON code blocks or unwanted formatting
  let cleanContent = response
    .replace(/```json[\s\S]*?```/g, '') // Remove JSON code blocks
    .replace(/```[\s\S]*?```/g, '') // Remove any other code blocks
    .replace(/\{[\s\S]*?\}/g, '') // Remove any remaining JSON objects
    .replace(/^\s*[\{\[][\s\S]*?[\}\]]\s*$/gm, '') // Remove standalone JSON lines
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple line breaks
    .trim();

  // If content is too short after cleaning, use original but clean it better
  if (cleanContent.length < 50) {
    cleanContent = response
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();
  }

  // If no structured data found, try to extract city/country from text
  // Enhanced city/country extraction
  let city = '';
  let country = '';
  
  // Comprehensive city-country mapping
  const cityCountryMap: { [key: string]: { city: string; country: string } } = {
    // Arabic cities
    'باريس': { city: 'Paris', country: 'France' },
    'دبي': { city: 'Dubai', country: 'UAE' },
    'لندن': { city: 'London', country: 'UK' },
    'القاهرة': { city: 'Cairo', country: 'Egypt' },
    'الرياض': { city: 'Riyadh', country: 'Saudi Arabia' },
    'اسطنبول': { city: 'Istanbul', country: 'Turkey' },
    'روما': { city: 'Rome', country: 'Italy' },
    'نيويورك': { city: 'New York', country: 'USA' },
    'طوكيو': { city: 'Tokyo', country: 'Japan' },
    'برشلونة': { city: 'Barcelona', country: 'Spain' },
    'مدريد': { city: 'Madrid', country: 'Spain' },
    'أمستردام': { city: 'Amsterdam', country: 'Netherlands' },
    'فيينا': { city: 'Vienna', country: 'Austria' },
    'براغ': { city: 'Prague', country: 'Czech Republic' },
    'بودابست': { city: 'Budapest', country: 'Hungary' },
    'كوالالمبور': { city: 'Kuala Lumpur', country: 'Malaysia' },
    'سنغافورة': { city: 'Singapore', country: 'Singapore' },
    'بانكوك': { city: 'Bangkok', country: 'Thailand' },
    'هونج كونج': { city: 'Hong Kong', country: 'Hong Kong' },
    'سيول': { city: 'Seoul', country: 'South Korea' },
    'أوساكا': { city: 'Osaka', country: 'Japan' },
    'كيوتو': { city: 'Kyoto', country: 'Japan' },
    'بالي': { city: 'Bali', country: 'Indonesia' },
    'جاكرتا': { city: 'Jakarta', country: 'Indonesia' },
    'مانيلا': { city: 'Manila', country: 'Philippines' },
    'مومباي': { city: 'Mumbai', country: 'India' },
    'دلهي': { city: 'Delhi', country: 'India' },
    'الكويت': { city: 'Kuwait City', country: 'Kuwait' },
    'الدوحة': { city: 'Doha', country: 'Qatar' },
    'أبو ظبي': { city: 'Abu Dhabi', country: 'UAE' },
    'مسقط': { city: 'Muscat', country: 'Oman' },
    'المنامة': { city: 'Manama', country: 'Bahrain' },
    'عمان': { city: 'Amman', country: 'Jordan' },
    'بيروت': { city: 'Beirut', country: 'Lebanon' },
    'دمشق': { city: 'Damascus', country: 'Syria' },
    'بغداد': { city: 'Baghdad', country: 'Iraq' },
    'الإسكندرية': { city: 'Alexandria', country: 'Egypt' },
    'أسوان': { city: 'Aswan', country: 'Egypt' },
    'الأقصر': { city: 'Luxor', country: 'Egypt' },
    'شرم الشيخ': { city: 'Sharm El Sheikh', country: 'Egypt' },
    'الغردقة': { city: 'Hurghada', country: 'Egypt' },
    'مراكش': { city: 'Marrakech', country: 'Morocco' },
    'الدار البيضاء': { city: 'Casablanca', country: 'Morocco' },
    'فاس': { city: 'Fez', country: 'Morocco' },
    'الرباط': { city: 'Rabat', country: 'Morocco' },
    'تونس': { city: 'Tunis', country: 'Tunisia' },
    'الجزائر': { city: 'Algiers', country: 'Algeria' },
    'طرابلس': { city: 'Tripoli', country: 'Libya' },
    'الخرطوم': { city: 'Khartoum', country: 'Sudan' },
    'موسكو': { city: 'Moscow', country: 'Russia' },
    'سانت بطرسبرغ': { city: 'Saint Petersburg', country: 'Russia' },
    
    // English cities
    'paris': { city: 'Paris', country: 'France' },
    'dubai': { city: 'Dubai', country: 'UAE' },
    'london': { city: 'London', country: 'UK' },
    'cairo': { city: 'Cairo', country: 'Egypt' },
    'riyadh': { city: 'Riyadh', country: 'Saudi Arabia' },
    'istanbul': { city: 'Istanbul', country: 'Turkey' },
    'rome': { city: 'Rome', country: 'Italy' },
    'new york': { city: 'New York', country: 'USA' },
    'tokyo': { city: 'Tokyo', country: 'Japan' },
    'barcelona': { city: 'Barcelona', country: 'Spain' },
    'madrid': { city: 'Madrid', country: 'Spain' },
    'amsterdam': { city: 'Amsterdam', country: 'Netherlands' },
    'vienna': { city: 'Vienna', country: 'Austria' },
    'prague': { city: 'Prague', country: 'Czech Republic' },
    'budapest': { city: 'Budapest', country: 'Hungary' },
    'kuala lumpur': { city: 'Kuala Lumpur', country: 'Malaysia' },
    'singapore': { city: 'Singapore', country: 'Singapore' },
    'bangkok': { city: 'Bangkok', country: 'Thailand' },
    'hong kong': { city: 'Hong Kong', country: 'Hong Kong' },
    'seoul': { city: 'Seoul', country: 'South Korea' },
    'osaka': { city: 'Osaka', country: 'Japan' },
    'kyoto': { city: 'Kyoto', country: 'Japan' },
    'bali': { city: 'Bali', country: 'Indonesia' },
    'jakarta': { city: 'Jakarta', country: 'Indonesia' },
    'manila': { city: 'Manila', country: 'Philippines' },
    'mumbai': { city: 'Mumbai', country: 'India' },
    'delhi': { city: 'Delhi', country: 'India' },
    'kuwait': { city: 'Kuwait City', country: 'Kuwait' },
    'doha': { city: 'Doha', country: 'Qatar' },
    'abu dhabi': { city: 'Abu Dhabi', country: 'UAE' },
    'muscat': { city: 'Muscat', country: 'Oman' },
    'manama': { city: 'Manama', country: 'Bahrain' },
    'amman': { city: 'Amman', country: 'Jordan' },
    'beirut': { city: 'Beirut', country: 'Lebanon' },
    'damascus': { city: 'Damascus', country: 'Syria' },
    'baghdad': { city: 'Baghdad', country: 'Iraq' },
    'alexandria': { city: 'Alexandria', country: 'Egypt' },
    'aswan': { city: 'Aswan', country: 'Egypt' },
    'luxor': { city: 'Luxor', country: 'Egypt' },
    'sharm el sheikh': { city: 'Sharm El Sheikh', country: 'Egypt' },
    'hurghada': { city: 'Hurghada', country: 'Egypt' },
    'marrakech': { city: 'Marrakech', country: 'Morocco' },
    'casablanca': { city: 'Casablanca', country: 'Morocco' },
    'fez': { city: 'Fez', country: 'Morocco' },
    'rabat': { city: 'Rabat', country: 'Morocco' },
    'tunis': { city: 'Tunis', country: 'Tunisia' },
    'algiers': { city: 'Algiers', country: 'Algeria' },
    'tripoli': { city: 'Tripoli', country: 'Libya' },
    'khartoum': { city: 'Khartoum', country: 'Sudan' },
    'moscow': { city: 'Moscow', country: 'Russia' },
    'saint petersburg': { city: 'Saint Petersburg', country: 'Russia' }
  };

  // Find city in content
  const contentLower = cleanContent.toLowerCase();
  for (const [pattern, info] of Object.entries(cityCountryMap)) {
    if (contentLower.includes(pattern.toLowerCase())) {
      city = info.city;
      country = info.country;
      break;
    }
  }

  return {
    content: cleanContent,
    city: city || undefined,
    country: country || undefined
  };
};

// Main AI service function
export const generateAIResponse = async ({ message, conversationHistory = [] }: AIRequest): Promise<AIResponse> => {
  try {
    // Check if Gemini is properly initialized
    if (!genAI) {
      throw new Error('Gemini AI is not properly configured. Please check your API key.');
    }

    // Detect the language of the user's message
    const detectLanguage = (text: string): 'ar' | 'en' => {
      // Check for Arabic characters
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
      if (arabicPattern.test(text)) {
        return 'ar';
      }
      return 'en';
    };

    const userLanguage = detectLanguage(message);
    const isArabic = userLanguage === 'ar';

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = isArabic ? '\n\nسياق المحادثة السابقة:\n' : '\n\nPrevious conversation context:\n';
      conversationHistory.slice(-5).forEach(msg => {
        const roleLabel = msg.role === 'user' 
          ? (isArabic ? 'المستخدم' : 'User')
          : (isArabic ? 'المساعد' : 'Assistant');
        conversationContext += `${roleLabel}: ${msg.content}\n`;
      });
    }

    // Check if this is a travel planning request
    const travelKeywords = [
      // Arabic keywords
      'رحلة', 'سفر', 'خطة', 'جدول', 'يوم', 'زيارة', 'عطلة', 'إجازة', 'شاطئ',
      'عائلية', 'أشخاص', 'أطفال', 'إقامة', 'فندق', 'منتجع', 'أنشطة', 'ترفيه',
      'استجمام', 'مدينة', 'بلد', 'دولة', 'مكان', 'وجهة', 'سياحة', 'طيران',
      'حجز', 'تذكرة', 'باص', 'قطار', 'سيارة', 'مطار', 'طعام', 'مطعم', 'تسوق',
      'أسواق', 'متحف', 'معلم', 'أثري', 'تاريخي', 'ثقافي', 'طبيعة', 'حديقة',
      'جبل', 'وادي', 'صحراء', 'بحيرة', 'نهر', 'شلال', 'كهف', 'قلعة', 'قصر',
      'مسجد', 'كنيسة', 'معبد', 'مهرجان', 'حفل', 'عرض', 'رياضة', 'غوص',
      'سباحة', 'تزلج', 'تسلق', 'مشي', 'جري', 'دراجة', 'خيمة', 'تخييم',
      'استكشاف', 'مغامرة', 'استرخاء', 'راحة', 'علاج', 'سبا', 'تدليك',
      
      // English keywords
      'trip', 'travel', 'plan', 'itinerary', 'vacation', 'holiday', 'beach',
      'family', 'resort', 'hotel', 'activities', 'kids', 'city', 'country',
      'destination', 'tourism', 'flight', 'booking', 'ticket', 'bus', 'train',
      'car', 'airport', 'food', 'restaurant', 'shopping', 'market', 'museum',
      'landmark', 'historical', 'cultural', 'nature', 'park', 'mountain',
      'valley', 'desert', 'lake', 'river', 'waterfall', 'cave', 'castle',
      'palace', 'mosque', 'church', 'temple', 'festival', 'concert', 'show',
      'sport', 'diving', 'swimming', 'skiing', 'climbing', 'hiking', 'running',
      'cycling', 'camping', 'exploration', 'adventure', 'relaxation', 'spa'
    ];
    
    const isTravelRequest = travelKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isTravelRequest) {
      // For travel requests, generate structured itinerary
      const travelInfo = extractTravelInfo(message);
      const destination = travelInfo.destination || 'وجهة مقترحة';
      const days = travelInfo.days || 3;
      const interests = travelInfo.interests.length > 0 ? travelInfo.interests.join('، ') : 'متنوعة';
      const travelType = travelInfo.travelType || 'general';
      const budget = travelInfo.budget || 'medium';
      const groupSize = travelInfo.groupSize || 2;
      
      const itineraryPrompt = `${SYSTEM_PROMPT}${conversationContext}

طلب المستخدم: ${message}

معلومات مستخرجة:
- الوجهة: ${destination}
- عدد الأيام: ${days}
- نوع الرحلة: ${travelType}
- الاهتمامات: ${interests}
- الميزانية: ${budget}
- عدد الأشخاص: ${groupSize}

تعليمات إجبارية - يجب اتباعها بدقة تماماً:

1. يجب أن تكتب نصاً وصفياً مفيداً أولاً (بدون ذكر JSON)
2. ثم يجب أن تضع JSON بالتنسيق المحدد تماماً  
3. يجب إنشاء جدول لـ ${days} أيام بالضبط - لا أكثر ولا أقل
4. عدد الأيام المطلوب هو ${days} أيام فقط
5. لا تغير عدد الأيام مهما كان السبب
6. يجب أن تكون الوجهة مناسبة لنوع الرحلة: ${travelType}
7. يجب أن تكون التكاليف مناسبة للميزانية: ${budget}
**مثال على التنسيق المطلوب:**

مرحباً! سأساعدك في التخطيط لرحلة رائعة. إليك خطة مفصلة تناسب احتياجاتك.

\`\`\`json
{
  "content": "خطة رحلة مخصصة",
  "city": "اسم المدينة",
  "country": "اسم البلد",
  "itinerary": [
    {
      "day": 1,
      "date": "التاريخ",
      "theme": "موضوع اليوم الأول",
      "items": [
        {
          "time": "9:00 AM - 11:00 AM",
          "activity": "اسم النشاط",
          "location": "وصف المكان والموقع",
          "cost": 0,
          "type": "culture"
        },
        {
          "time": "1:00 PM - 3:00 PM",
          "activity": "نشاط آخر",
          "location": "وصف مكان آخر",
          "cost": 15,
          "type": "food"
        }
      ]
    },
    {
      "day": 2,
      "date": "التاريخ الثاني",
      "theme": "موضوع اليوم الثاني",
      "items": [
        {
          "time": "10:00 AM - 12:00 PM",
          "activity": "نشاط اليوم الثاني",
          "location": "مكان النشاط",
          "cost": 20,
          "type": "culture"
        }
      ]
    }
  ]
}
\`\`\`

**قواعد إجبارية:**
- يجب إنشاء ${days} أيام بالضبط - هذا مطلب أساسي
- عدد الأيام في الجدول = ${days} (لا تغير هذا الرقم)
- استخدم فقط هذه الأنواع: "culture", "food", "transport", "shopping"
- التكاليف يجب أن تكون أرقام صحيحة فقط
- لا تذكر كلمة JSON في النص الوصفي
- يجب وضع JSON داخل \`\`\`json و \`\`\`
- لا تضع أي نص بعد JSON

تذكر: المستخدم طلب ${days} أيام، يجب أن يكون الجدول ${days} أيام فقط!`;

      const result = await model.generateContent(itineraryPrompt);
      const response = result.response;
      const text = response.text();
      
      // Extract structured data from response
      const extractedData = extractItineraryFromResponse(text);
      
      return {
        content: extractedData.content,
        itinerary: extractedData.itinerary,
        city: extractedData.city,
        country: extractedData.country
      };
    } else {
      // For general questions, use simple prompt
      const systemPromptText = isArabic ? SYSTEM_PROMPT : `You are a smart travel assistant. Your task is to:

1. Understand travel requests from users accurately
2. Provide detailed and customized travel plans
3. Suggest activities and places suitable for budget and interests
4. Provide practical and useful information

Important response rules:
- Do not show any JSON codes or programming in your response to the user
- Write natural and understandable responses in English
- If asked to create a travel itinerary, write a helpful description first
- Do not use code marks or programming formatting in the visible response

When responding to a travel request:
- Mention the requested city/country name
- Provide a detailed daily plan
- Mention approximate costs
- Suggest diverse activities (cultural, entertainment, food, transport)
- Be friendly and helpful

If the user requests a travel plan, write a helpful descriptive response in English only.

Always respond in English unless the user requests another language.`;

      const generalPrompt = `${systemPromptText}${conversationContext}

${isArabic ? 'طلب المستخدم' : 'User request'}: ${message}

${isArabic ? 'إذا كان هذا طلب سفر، يجب إنشاء جدول رحلة بتنسيق JSON.' : 'If this is a travel request, create a travel itinerary in JSON format.'}
${isArabic ? 'وإلا رد باللغة العربية بشكل مفيد ومختصر:' : 'Otherwise respond in English in a helpful and concise manner:'}

${isArabic ? 'رد دائماً باللغة العربية.' : 'Always respond in English.'}`;

      const result = await model.generateContent(generalPrompt);
      const response = result.response;
      const text = response.text();
      
      // Try to extract itinerary even from general responses
      const extractedData = extractItineraryFromResponse(text);
      if (extractedData.itinerary) {
        return extractedData;
      }
      
      return {
        content: text.trim()
      };
    }


  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Detect language for error message
    const detectLanguage = (text: string): 'ar' | 'en' => {
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
      if (arabicPattern.test(text)) {
        return 'ar';
      }
      return 'en';
    };

    const userLanguage = detectLanguage(message);
    const isArabic = userLanguage === 'ar';
    
    // Fallback response
    return {
      content: isArabic 
        ? 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
        : 'Sorry, there was an error connecting to the AI service. Please try again.',
    };
  }
};

// Function to get AI suggestions for modifications
export const getModificationSuggestions = async (currentItinerary: any[], userRequest: string): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `بناءً على جدول الرحلة الحالي وطلب المستخدم: "${userRequest}"
    
اقترح 3 تعديلات مفيدة للجدول. قدم الاقتراحات كقائمة بسيطة:

1. 
2. 
3. `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract suggestions from response
    const suggestions = response
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0)
      .slice(0, 3);
    
    return suggestions.length > 0 ? suggestions : [
      "إضافة جولة طعام محلية",
      "تضمين مكان لمشاهدة غروب الشمس", 
      "إضافة وقت للراحة والاستجمام"
    ];
    
  } catch (error) {
    console.error('Error getting modification suggestions:', error);
    return [
      "إضافة جولة طعام محلية",
      "تضمين مكان لمشاهدة غروب الشمس",
      "إضافة وقت للراحة والاستجمام"
    ];
  }
};