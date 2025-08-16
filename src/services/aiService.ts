import { GoogleGenerativeAI } from '@google/generative-ai';
import systemPrompt from './system_prompt.txt?raw';

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
const extractTravelInfo = (message: string): { destination?: string; days?: number; interests?: string[] } => {
  const text = message.toLowerCase();
  
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
    /(?:لمدة|for)\s*(\d+)/gi,
    /(\d+)\s*(?:ليلة|ليال|night|nights)/gi
  ];
  
  for (const pattern of dayPatterns) {
    const match = text.match(pattern);
    if (match) {
      days = parseInt(match[1]) || 0;
      break;
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
};

const extractItineraryFromResponse = (response: string): { content: string; itinerary?: any[]; city?: string; country?: string } => {
  try {
    // Try to find JSON in the response - improved regex
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/```\s*([\s\S]*?)\s*```/) ||
                     response.match(/(\{[\s\S]*?\})/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      
      // Clean the JSON string
      const cleanedJson = jsonString
        .replace(/^\s*```json\s*/, '')
        .replace(/\s*```\s*$/, '')
        .replace(/^\s*```\s*/, '')
        .trim();
      
      const parsed = JSON.parse(cleanedJson);
      
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
        const contentMatch = response.split(/```json|```/)[0];
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
    console.log('Could not parse JSON from response:', error);
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nسياق المحادثة السابقة:\n';
      conversationHistory.slice(-5).forEach(msg => {
        conversationContext += `${msg.role === 'user' ? 'المستخدم' : 'المساعد'}: ${msg.content}\n`;
      });
    }

    // Check if this is a travel planning request
    const isTravelRequest = message.includes('رحلة') || message.includes('سفر') || message.includes('خطة') || 
                           message.includes('جدول') || message.includes('يوم') || message.includes('زيارة') ||
                           message.includes('عطلة') || message.includes('إجازة') || message.includes('شاطئ') ||
                           message.includes('عائلية') || message.includes('أشخاص') || message.includes('أطفال') ||
                           message.includes('إقامة') || message.includes('فندق') || message.includes('منتجع') ||
                           message.includes('أنشطة') || message.includes('ترفيه') || message.includes('استجمام') ||
                           message.toLowerCase().includes('trip') || message.toLowerCase().includes('travel') ||
                           message.toLowerCase().includes('plan') || message.toLowerCase().includes('itinerary') ||
                           message.toLowerCase().includes('vacation') || message.toLowerCase().includes('holiday') ||
                           message.toLowerCase().includes('beach') || message.toLowerCase().includes('family') ||
                           message.toLowerCase().includes('resort') || message.toLowerCase().includes('hotel') ||
                           message.toLowerCase().includes('activities') || message.toLowerCase().includes('kids');

    if (isTravelRequest) {
      // For travel requests, generate structured itinerary
      const travelInfo = extractTravelInfo(message);
      const destination = travelInfo.destination || 'الوجهة المطلوبة';
      const days = travelInfo.days || 3;
      const interests = travelInfo.interests.length > 0 ? travelInfo.interests.join('، ') : 'الثقافة والطعام';
      
      const itineraryPrompt = `${systemPrompt}${conversationContext}

طلب المستخدم: ${message}

معلومات مستخرجة:
- الوجهة: ${destination}
- عدد الأيام: ${days}
- الاهتمامات: ${interests}

${!travelInfo.destination ? `
ملاحظة: المستخدم لم يحدد وجهة معينة. اقترح عليه 3 وجهات مناسبة لطلبه واختر واحدة منها لإنشاء الجدول.
` : ''}

قم بإنشاء رد يتضمن:
1. نص وصفي مفيد باللغة العربية عن الوجهة والرحلة
2. جدول رحلة مفصل لـ ${days} أيام ${travelInfo.destination ? `في ${destination}` : 'في الوجهة المقترحة'} بتنسيق JSON

${message.includes('عائلية') || message.includes('أطفال') || message.toLowerCase().includes('family') || message.toLowerCase().includes('kids') ? 
`تأكد من تضمين أنشطة مناسبة للعائلة والأطفال.` : ''}

${message.includes('شاطئ') || message.toLowerCase().includes('beach') ? 
`ركز على الأنشطة الشاطئية والمائية.` : ''}

تنسيق الرد المطلوب:

[نص وصفي للرحلة ${travelInfo.destination ? `إلى ${destination}` : 'مع اقتراح الوجهات المناسبة'} لمدة ${days} أيام باللغة العربية]

\`\`\`json
{
  "content": "وصف مختصر للرحلة ${travelInfo.destination ? `إلى ${destination}` : 'مع الوجهة المقترحة'}",
  "city": "${travelInfo.destination ? destination : 'الوجهة المقترحة'}",
  "country": "اسم البلد بالإنجليزية",
  "itinerary": [
    {
      "day": 1,
      "date": "اليوم الأول",
      "theme": "موضوع اليوم ${message.includes('عائلية') ? '(مناسب للعائلة)' : ''}",
      "items": [
        {
          "time": "9:00 ص - 11:00 ص",
          "activity": "اسم النشاط",
          "location": "وصف المكان والموقع ${message.includes('عائلية') ? '(مناسب للأطفال)' : ''}",
          "cost": 25,
          "type": "${message.includes('شاطئ') ? 'culture' : 'culture'}"
        }
      ]
    }
    ${days > 1 ? `... (كرر لـ ${days} أيام)` : ''}
  ]
}
\`\`\`

يجب أن يحتوي الجدول على ${days} أيام بالضبط.
ركز على الاهتمامات: ${interests}
أنواع الأنشطة المتاحة: "culture", "food", "transport", "shopping"
تأكد من أن التكاليف أرقام صحيحة.`;

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
      const generalPrompt = `${systemPrompt}${conversationContext}

طلب المستخدم: ${message}

رد باللغة العربية بشكل مفيد ومختصر:`;

      const result = await model.generateContent(generalPrompt);
      const response = result.response;
      const text = response.text();
      
      return {
        content: text.trim()
      };
    }


  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Fallback response
    return {
      content: 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
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