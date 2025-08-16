// AI Service for generating travel recommendations
// This is a mock implementation - in production, you would integrate with OpenAI, Claude, or similar

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

// Mock AI responses for different cities and travel requests
const cityResponses = {
  paris: {
    city: "Paris",
    country: "France",
    itinerary: [
      {
        day: 1,
        date: "Day 1",
        theme: "Classic Paris & Culture",
        items: [
          {
            time: "9:00 AM - 11:30 AM",
            activity: "Eiffel Tower",
            location: "Visit the iconic symbol of Paris with panoramic city views",
            cost: 25,
            type: "culture"
          },
          {
            time: "2:00 PM - 5:00 PM",
            activity: "Louvre Museum",
            location: "World's largest art museum, home to the Mona Lisa",
            cost: 17,
            type: "culture"
          },
          {
            time: "7:00 PM - 9:00 PM",
            activity: "Seine River Cruise",
            location: "Evening cruise with dinner and city lights",
            cost: 65,
            type: "culture"
          }
        ]
      },
      {
        day: 2,
        date: "Day 2",
        theme: "Montmartre & Local Life",
        items: [
          {
            time: "9:00 AM - 12:00 PM",
            activity: "Sacré-Cœur Basilica",
            location: "Beautiful basilica in Montmartre with stunning views",
            cost: 0,
            type: "culture"
          },
          {
            time: "2:00 PM - 4:00 PM",
            activity: "Champs-Élysées Shopping",
            location: "Famous shopping avenue with luxury boutiques",
            cost: 100,
            type: "shopping"
          },
          {
            time: "7:00 PM - 9:00 PM",
            activity: "French Bistro Dinner",
            location: "Authentic French cuisine in a traditional bistro",
            cost: 45,
            type: "food"
          }
        ]
      }
    ]
  },
  dubai: {
    city: "Dubai",
    country: "UAE",
    itinerary: [
      {
        day: 1,
        date: "Day 1",
        theme: "Modern Dubai & Luxury",
        items: [
          {
            time: "9:00 AM - 12:00 PM",
            activity: "Burj Khalifa",
            location: "World's tallest building observation deck",
            cost: 40,
            type: "culture"
          },
          {
            time: "2:00 PM - 5:00 PM",
            activity: "Dubai Mall",
            location: "World's largest shopping mall with aquarium",
            cost: 150,
            type: "shopping"
          },
          {
            time: "7:00 PM - 9:00 PM",
            activity: "Dubai Fountain Show",
            location: "Musical fountain show at Dubai Mall",
            cost: 0,
            type: "culture"
          }
        ]
      },
      {
        day: 2,
        date: "Day 2",
        theme: "Traditional Dubai & Desert",
        items: [
          {
            time: "9:00 AM - 12:00 PM",
            activity: "Dubai Creek & Gold Souk",
            location: "Traditional markets and historic creek area",
            cost: 20,
            type: "shopping"
          },
          {
            time: "3:00 PM - 8:00 PM",
            activity: "Desert Safari",
            location: "Dune bashing, camel riding, and Bedouin camp",
            cost: 80,
            type: "culture"
          },
          {
            time: "8:00 PM - 10:00 PM",
            activity: "Bedouin Dinner",
            location: "Traditional desert dinner with entertainment",
            cost: 35,
            type: "food"
          }
        ]
      }
    ]
  },
  london: {
    city: "London",
    country: "UK",
    itinerary: [
      {
        day: 1,
        date: "Day 1",
        theme: "Royal London & History",
        items: [
          {
            time: "9:00 AM - 11:00 AM",
            activity: "Tower of London",
            location: "Historic castle and Crown Jewels exhibition",
            cost: 30,
            type: "culture"
          },
          {
            time: "1:00 PM - 3:00 PM",
            activity: "British Museum",
            location: "World history and artifacts collection",
            cost: 0,
            type: "culture"
          },
          {
            time: "7:00 PM - 9:00 PM",
            activity: "Traditional Pub Dinner",
            location: "Authentic British pub experience with fish & chips",
            cost: 25,
            type: "food"
          }
        ]
      }
    ]
  }
};

// Simulate AI processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateAIResponse = async ({ message, conversationHistory }: AIRequest): Promise<AIResponse> => {
  // Simulate AI processing time
  await delay(1000 + Math.random() * 2000);

  const input = message.toLowerCase();
  
  // Extract city from user input
  let cityKey = 'paris'; // default
  let cityData = cityResponses.paris;
  
  if (input.includes('dubai') || input.includes('دبي')) {
    cityKey = 'dubai';
    cityData = cityResponses.dubai;
  } else if (input.includes('london') || input.includes('لندن')) {
    cityKey = 'london';
    cityData = cityResponses.london;
  } else if (input.includes('paris') || input.includes('باريس')) {
    cityKey = 'paris';
    cityData = cityResponses.paris;
  }

  // Generate contextual response based on conversation history
  let responseContent = '';
  
  if (conversationHistory && conversationHistory.length > 0) {
    // This is a follow-up message
    if (input.includes('change') || input.includes('modify') || input.includes('edit') || 
        input.includes('تغيير') || input.includes('تعديل')) {
      responseContent = `I understand you'd like to modify your ${cityData.city} itinerary. You can click on any activity in the itinerary below to edit the details, timing, or cost. You can also add new activities or remove ones you're not interested in.`;
    } else if (input.includes('budget') || input.includes('cost') || input.includes('price') ||
               input.includes('ميزانية') || input.includes('تكلفة') || input.includes('سعر')) {
      responseContent = `Here's the updated budget breakdown for your ${cityData.city} trip. The costs shown are per person and include entrance fees and activities. You can adjust any costs by editing the individual activities in the itinerary.`;
    } else {
      responseContent = `I've updated your ${cityData.city} itinerary based on your preferences. Here are the refined recommendations that should better match what you're looking for.`;
    }
  } else {
    // This is the first message
    responseContent = `I'd be happy to help you plan an amazing trip to ${cityData.city}, ${cityData.country}! Based on your interests, I've created a personalized itinerary that includes the best attractions, local experiences, and cultural highlights. You can customize any part of this itinerary by clicking on the activities below.`;
  }

  return {
    content: responseContent,
    itinerary: cityData.itinerary,
    city: cityData.city,
    country: cityData.country
  };
};

// Function to get AI suggestions for modifications
export const getModificationSuggestions = async (currentItinerary: any[], userRequest: string): Promise<string[]> => {
  await delay(500);
  
  const suggestions = [
    "Add a food tour experience",
    "Include a sunset viewing spot",
    "Add shopping time at local markets",
    "Include a cultural workshop",
    "Add transportation between locations"
  ];
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
};