// AI Service for generating travel recommendations
// Enhanced to properly parse user requests and generate appropriate responses

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

// Enhanced city detection function
const detectCityFromMessage = (message: string): { city: string; country: string; key: string } => {
  const input = message.toLowerCase();
  
  // Arabic city names
  const arabicCities = {
    'باريس': { city: 'Paris', country: 'France', key: 'paris' },
    'دبي': { city: 'Dubai', country: 'UAE', key: 'dubai' },
    'لندن': { city: 'London', country: 'UK', key: 'london' },
    'القاهرة': { city: 'Cairo', country: 'Egypt', key: 'cairo' },
    'الرياض': { city: 'Riyadh', country: 'Saudi Arabia', key: 'riyadh' },
    'اسطنبول': { city: 'Istanbul', country: 'Turkey', key: 'istanbul' },
    'روما': { city: 'Rome', country: 'Italy', key: 'rome' },
    'نيويورك': { city: 'New York', country: 'USA', key: 'newyork' },
    'طوكيو': { city: 'Tokyo', country: 'Japan', key: 'tokyo' },
    'برشلونة': { city: 'Barcelona', country: 'Spain', key: 'barcelona' }
  };

  // English city names
  const englishCities = {
    'paris': { city: 'Paris', country: 'France', key: 'paris' },
    'dubai': { city: 'Dubai', country: 'UAE', key: 'dubai' },
    'london': { city: 'London', country: 'UK', key: 'london' },
    'cairo': { city: 'Cairo', country: 'Egypt', key: 'cairo' },
    'riyadh': { city: 'Riyadh', country: 'Saudi Arabia', key: 'riyadh' },
    'istanbul': { city: 'Istanbul', country: 'Turkey', key: 'istanbul' },
    'rome': { city: 'Rome', country: 'Italy', key: 'rome' },
    'new york': { city: 'New York', country: 'USA', key: 'newyork' },
    'newyork': { city: 'New York', country: 'USA', key: 'newyork' },
    'tokyo': { city: 'Tokyo', country: 'Japan', key: 'tokyo' },
    'barcelona': { city: 'Barcelona', country: 'Spain', key: 'barcelona' }
  };

  // Check Arabic cities first
  for (const [arabicName, cityInfo] of Object.entries(arabicCities)) {
    if (input.includes(arabicName)) {
      return cityInfo;
    }
  }

  // Check English cities
  for (const [englishName, cityInfo] of Object.entries(englishCities)) {
    if (input.includes(englishName)) {
      return cityInfo;
    }
  }

  // Default to Paris if no city detected
  return { city: 'Paris', country: 'France', key: 'paris' };
};

// Generate dynamic itinerary based on city
const generateCityItinerary = (cityKey: string, city: string, country: string) => {
  const itineraries = {
    paris: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "باريس الكلاسيكية والثقافة",
        items: [
          {
            time: "9:00 ص - 11:30 ص",
            activity: "برج إيفل",
            location: "زيارة الرمز الأيقوني لباريس مع إطلالات بانورامية على المدينة",
            cost: 25,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "متحف اللوفر",
            location: "أكبر متحف فني في العالم، موطن الموناليزا",
            cost: 17,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "رحلة نهر السين",
            location: "رحلة مسائية مع العشاء وأضواء المدينة",
            cost: 65,
            type: "culture"
          }
        ]
      },
      {
        day: 2,
        date: "اليوم الثاني",
        theme: "مونمارتر والحياة المحلية",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "كنيسة القلب المقدس",
            location: "كنيسة جميلة في مونمارتر مع إطلالات خلابة",
            cost: 0,
            type: "culture"
          },
          {
            time: "2:00 م - 4:00 م",
            activity: "التسوق في الشانزليزيه",
            location: "شارع التسوق الشهير مع البوتيكات الفاخرة",
            cost: 100,
            type: "shopping"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء في مطعم فرنسي",
            location: "المأكولات الفرنسية الأصيلة في مطعم تقليدي",
            cost: 45,
            type: "food"
          }
        ]
      }
    ],
    dubai: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "دبي الحديثة والفخامة",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "برج خليفة",
            location: "أطول مبنى في العالم مع منصة المراقبة",
            cost: 40,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "دبي مول",
            location: "أكبر مول تسوق في العالم مع الأكواريوم",
            cost: 150,
            type: "shopping"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عرض نافورة دبي",
            location: "عرض النافورة الموسيقية في دبي مول",
            cost: 0,
            type: "culture"
          }
        ]
      },
      {
        day: 2,
        date: "اليوم الثاني",
        theme: "دبي التقليدية والصحراء",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "خور دبي وسوق الذهب",
            location: "الأسواق التقليدية ومنطقة الخور التاريخية",
            cost: 20,
            type: "shopping"
          },
          {
            time: "3:00 م - 8:00 م",
            activity: "سفاري الصحراء",
            location: "قيادة الكثبان الرملية وركوب الجمال ومخيم البدو",
            cost: 80,
            type: "culture"
          },
          {
            time: "8:00 م - 10:00 م",
            activity: "عشاء بدوي",
            location: "عشاء صحراوي تقليدي مع الترفيه",
            cost: 35,
            type: "food"
          }
        ]
      }
    ],
    london: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "لندن الملكية والتاريخ",
        items: [
          {
            time: "9:00 ص - 11:00 ص",
            activity: "برج لندن",
            location: "القلعة التاريخية ومعرض جواهر التاج",
            cost: 30,
            type: "culture"
          },
          {
            time: "1:00 م - 3:00 م",
            activity: "المتحف البريطاني",
            location: "مجموعة التاريخ العالمي والآثار",
            cost: 0,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء في حانة تقليدية",
            location: "تجربة الحانة البريطانية الأصيلة مع السمك والبطاطس",
            cost: 25,
            type: "food"
          }
        ]
      }
    ],
    cairo: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "القاهرة التاريخية والأهرامات",
        items: [
          {
            time: "8:00 ص - 12:00 م",
            activity: "أهرامات الجيزة وأبو الهول",
            location: "عجائب الدنيا السبع القديمة",
            cost: 15,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "المتحف المصري",
            location: "كنوز الفراعنة وآثار توت عنخ آمون",
            cost: 12,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء على النيل",
            location: "رحلة عشاء على نهر النيل مع الفولكلور",
            cost: 30,
            type: "food"
          }
        ]
      }
    ],
    riyadh: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "الرياض الحديثة والتراث",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "المتحف الوطني",
            location: "تاريخ وثقافة المملكة العربية السعودية",
            cost: 10,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "قصر المصمك",
            location: "القلعة التاريخية ومهد تأسيس المملكة",
            cost: 5,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء سعودي تقليدي",
            location: "المأكولات السعودية الأصيلة",
            cost: 40,
            type: "food"
          }
        ]
      }
    ],
    istanbul: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "اسطنبول التاريخية",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "آيا صوفيا",
            location: "التحفة المعمارية البيزنطية والعثمانية",
            cost: 15,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "البازار الكبير",
            location: "أحد أقدم وأكبر الأسواق المغطاة في العالم",
            cost: 50,
            type: "shopping"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء تركي",
            location: "المأكولات التركية الأصيلة مع إطلالة على البوسفور",
            cost: 35,
            type: "food"
          }
        ]
      }
    ],
    rome: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "روما القديمة",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "الكولوسيوم",
            location: "المدرج الروماني الأيقوني",
            cost: 20,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "الفاتيكان",
            location: "كنيسة القديس بطرس وكنيسة سيستين",
            cost: 25,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء إيطالي",
            location: "المعكرونة والبيتزا الأصيلة",
            cost: 30,
            type: "food"
          }
        ]
      }
    ],
    newyork: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "نيويورك الكلاسيكية",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "تمثال الحرية",
            location: "رمز الحرية والديمقراطية الأمريكية",
            cost: 25,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "تايمز سكوير",
            location: "قلب مانهاتن النابض بالحياة",
            cost: 0,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء في مطعم أمريكي",
            location: "تجربة الطعام الأمريكي الأصيل",
            cost: 50,
            type: "food"
          }
        ]
      }
    ],
    tokyo: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "طوكيو التقليدية والحديثة",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "معبد سينسو-جي",
            location: "أقدم معبد في طوكيو",
            cost: 0,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "شيبويا كروسينغ",
            location: "أشهر تقاطع في العالم",
            cost: 0,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء سوشي",
            location: "السوشي الياباني الأصيل",
            cost: 60,
            type: "food"
          }
        ]
      }
    ],
    barcelona: [
      {
        day: 1,
        date: "اليوم الأول",
        theme: "برشلونة وغاودي",
        items: [
          {
            time: "9:00 ص - 12:00 م",
            activity: "ساغرادا فاميليا",
            location: "تحفة غاودي المعمارية",
            cost: 26,
            type: "culture"
          },
          {
            time: "2:00 م - 5:00 م",
            activity: "بارك غويل",
            location: "حديقة غاودي الملونة",
            cost: 10,
            type: "culture"
          },
          {
            time: "7:00 م - 9:00 م",
            activity: "عشاء إسباني",
            location: "التاباس والباييلا الأصيلة",
            cost: 35,
            type: "food"
          }
        ]
      }
    ]
  };

  return itineraries[cityKey] || itineraries.paris;
};

// Simulate AI processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateAIResponse = async ({ message, conversationHistory }: AIRequest): Promise<AIResponse> => {
  // Simulate AI processing time
  await delay(1000 + Math.random() * 2000);

  // Detect city from user message
  const { city, country, key } = detectCityFromMessage(message);
  
  // Generate itinerary for the detected city
  const itinerary = generateCityItinerary(key, city, country);

  // Generate contextual response based on conversation history
  let responseContent = '';
  
  if (conversationHistory && conversationHistory.length > 0) {
    // This is a follow-up message
    if (message.includes('تغيير') || message.includes('تعديل') || message.includes('change') || message.includes('modify') || message.includes('edit')) {
      responseContent = `فهمت أنك تريد تعديل برنامج رحلتك إلى ${city}. يمكنك النقر على أي نشاط في الجدول أدناه لتعديل التفاصيل أو التوقيت أو التكلفة. يمكنك أيضاً إضافة أنشطة جديدة أو حذف الأنشطة التي لا تهمك.`;
    } else if (message.includes('ميزانية') || message.includes('تكلفة') || message.includes('سعر') || message.includes('budget') || message.includes('cost') || message.includes('price')) {
      responseContent = `إليك تفصيل الميزانية المحدثة لرحلتك إلى ${city}. التكاليف المعروضة هي للشخص الواحد وتشمل رسوم الدخول والأنشطة. يمكنك تعديل أي تكاليف عن طريق تحرير الأنشطة الفردية في الجدول.`;
    } else {
      responseContent = `لقد قمت بتحديث برنامج رحلتك إلى ${city} بناءً على تفضيلاتك. إليك التوصيات المحسّنة التي يجب أن تتناسب بشكل أفضل مع ما تبحث عنه.`;
    }
  } else {
    // This is the first message
    responseContent = `سأكون سعيداً لمساعدتك في التخطيط لرحلة رائعة إلى ${city}, ${country}! بناءً على اهتماماتك، قمت بإنشاء برنامج رحلة مخصص يتضمن أفضل المعالم السياحية والتجارب المحلية والمعالم الثقافية. يمكنك تخصيص أي جزء من هذا البرنامج عن طريق النقر على الأنشطة أدناه.`;
  }

  return {
    content: responseContent,
    itinerary: itinerary,
    city: city,
    country: country
  };
};

// Function to get AI suggestions for modifications
export const getModificationSuggestions = async (currentItinerary: any[], userRequest: string): Promise<string[]> => {
  await delay(500);
  
  const suggestions = [
    "إضافة جولة طعام محلية",
    "تضمين مكان لمشاهدة غروب الشمس",
    "إضافة وقت للتسوق في الأسواق المحلية",
    "تضمين ورشة عمل ثقافية",
    "إضافة وسائل النقل بين المواقع"
  ];
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
};