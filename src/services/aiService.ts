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
  const cityCountryMatch = cleanContent.match(/(.*?)\s*[،,]\s*(.*?)(?:\s|$)/);
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
    if (cleanContent.toLowerCase().includes(pattern)) {
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
                           message.toLowerCase().includes('trip') || message.toLowerCase().includes('travel') ||
                           message.toLowerCase().includes('plan') || message.toLowerCase().includes('itinerary');

    if (isTravelRequest) {
      // For travel requests, generate structured itinerary
      const itineraryPrompt = `${systemPrompt}${conversationContext}

طلب المستخدم: ${message}

قم بإنشاء رد يتضمن:
1. نص وصفي مفيد باللغة العربية
2. جدول رحلة مفصل بتنسيق JSON

تنسيق الرد المطلوب:

[نص وصفي للرحلة باللغة العربية]

\`\`\`json
{
  "content": "وصف مختصر للرحلة",
  "city": "اسم المدينة بالإنجليزية",
  "country": "اسم البلد بالإنجليزية",
  "itinerary": [
    {
      "day": 1,
      "date": "التاريخ أو اليوم الأول",
      "theme": "موضوع اليوم",
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
\`\`\`

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