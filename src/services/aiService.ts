import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
}

// Initialize Gemini AI
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface AIRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface AIResponse {
  content: string;
  itinerary?: any[];
  city?: string;
  country?: string;
}

// System prompt for travel assistant
const SYSTEM_PROMPT = `أنت مساعد سفر ذكي ومتخصص باللغة العربية. مهمتك هي:

1. فهم طلبات السفر من المستخدمين بدقة
2. تقديم خطط سفر مفصلة ومخصصة
3. اقتراح أنشطة وأماكن مناسبة للميزانية والاهتمامات
4. تقديم معلومات عملية ومفيدة

عند الرد على طلب سفر:
- اذكر اسم المدينة/البلد المطلوب
- قدم خطة يومية مفصلة
- اذكر التكاليف التقريبية
- اقترح أنشطة متنوعة (ثقافية، ترفيهية، طعام، تسوق)
- كن ودوداً ومفيداً

إذا طلب المستخدم خطة سفر، قدم الرد بتنسيق JSON يحتوي على:
- content: النص الوصفي
- city: اسم المدينة
- country: اسم البلد
- itinerary: مصفوفة الأيام والأنشطة

مثال على تنسيق itinerary:
[
  {
    "day": 1,
    "date": "اليوم الأول",
    "theme": "وصف اليوم",
    "items": [
      {
        "time": "9:00 ص - 11:00 ص",
        "activity": "اسم النشاط",
        "location": "وصف المكان",
        "cost": 25,
        "type": "culture" // أو "food" أو "shopping" أو "transport"
      }
    ]
  }
]

رد دائماً باللغة العربية ما لم يطلب المستخدم لغة أخرى.`;

// Function to extract structured data from AI response
const extractItineraryFromResponse = (response: string): { content: string; itinerary?: any[]; city?: string; country?: string } => {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.itinerary) {
        return parsed;
      }
    }
  } catch (error) {
    console.log('Could not parse JSON from response, using text only');
  }

  // If no structured data found, try to extract city/country from text
  const cityCountryMatch = response.match(/(.*?)\s*[،,]\s*(.*?)(?:\s|$)/);
  let city = '';
  let country = '';

  // Common city patterns
  const cityPatterns = {
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
    'paris': { city: 'Paris', country: 'France' },
    'dubai': { city: 'Dubai', country: 'UAE' },
    'london': { city: 'London', country: 'UK' },
    'cairo': { city: 'Cairo', country: 'Egypt' },
    'riyadh': { city: 'Riyadh', country: 'Saudi Arabia' },
    'istanbul': { city: 'Istanbul', country: 'Turkey' },
    'rome': { city: 'Rome', country: 'Italy' },
    'new york': { city: 'New York', country: 'USA' },
    'tokyo': { city: 'Tokyo', country: 'Japan' },
    'barcelona': { city: 'Barcelona', country: 'Spain' }
  };

  for (const [pattern, info] of Object.entries(cityPatterns)) {
    if (response.toLowerCase().includes(pattern)) {
      city = info.city;
      country = info.country;
      break;
    }
  }

  return {
    content: response,
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

    // Create the full prompt
    const fullPrompt = `${SYSTEM_PROMPT}${conversationContext}\n\nطلب المستخدم الحالي: ${message}

إذا كان هذا طلب لخطة سفر، قدم رداً يتضمن:
1. نص وصفي مفيد
2. إذا أمكن، خطة يومية مفصلة بتنسيق JSON

رد باللغة العربية:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Extract structured data from response
    const extractedData = extractItineraryFromResponse(text);

    // If we have a travel request but no structured itinerary, try to generate one
    if (!extractedData.itinerary && (message.includes('رحلة') || message.includes('سفر') || message.includes('خطة') || message.includes('جدول'))) {
      try {
        const itineraryPrompt = `بناءً على طلب السفر: "${message}"

قم بإنشاء خطة سفر مفصلة بتنسيق JSON فقط، بدون أي نص إضافي:

{
  "content": "وصف مختصر للرحلة",
  "city": "اسم المدينة بالإنجليزية",
  "country": "اسم البلد بالإنجليزية", 
  "itinerary": [
    {
      "day": 1,
      "date": "اليوم الأول",
      "theme": "وصف اليوم",
      "items": [
        {
          "time": "9:00 ص - 11:00 ص",
          "activity": "اسم النشاط",
          "location": "وصف المكان والموقع",
          "cost": 25,
          "type": "culture"
        }
      ]
    }
  ]
}

أنواع الأنشطة المتاحة: "culture", "food", "shopping", "transport"`;

        const itineraryResult = await model.generateContent(itineraryPrompt);
        const itineraryText = itineraryResult.response.text();
        
        try {
          const cleanJson = itineraryText.replace(/```json\n?|\n?```/g, '').trim();
          const itineraryData = JSON.parse(cleanJson);
          
          return {
            content: extractedData.content,
            itinerary: itineraryData.itinerary,
            city: itineraryData.city,
            country: itineraryData.country
          };
        } catch (parseError) {
          console.log('Could not parse itinerary JSON, using text response only');
        }
      } catch (itineraryError) {
        console.log('Could not generate structured itinerary');
      }
    }

    return {
      content: extractedData.content,
      itinerary: extractedData.itinerary,
      city: extractedData.city,
      country: extractedData.country
    };

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
      "إضافة وقت للتسوق في الأسواق المحلية"
    ];
    
  } catch (error) {
    console.error('Error getting modification suggestions:', error);
    return [
      "إضافة جولة طعام محلية",
      "تضمين مكان لمشاهدة غروب الشمس",
      "إضافة وقت للتسوق في الأسواق المحلية"
    ];
  }
};