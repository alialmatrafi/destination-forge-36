import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { TripSuggestions } from "./TripSuggestions";
import { MobileSidebar } from "./MobileSidebar";

interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const TravelAssistant = () => {
  const [conversations] = useState<Conversation[]>([
    { id: "1", title: "Tokyo Adventure", date: "2 days ago" },
    { id: "2", title: "Paris Weekend", date: "1 week ago" },
    { id: "3", title: "Bali Retreat", date: "2 weeks ago" },
  ]);

  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowWelcome(true);
    setSidebarOpen(false);
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);

    // Simulate AI response
    setTimeout(() => {
      // Generate dynamic response based on user input
      const response = generateAIResponse(content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        itinerary: response.itinerary,
        city: response.city,
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const generateAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Extract city name from user input
    let city = "Tokyo"; // default
    let country = "Japan";
    
    // Simple city detection (can be enhanced with NLP)
    if (input.includes("paris") || input.includes("باريس")) {
      city = "Paris";
      country = "France";
    } else if (input.includes("london") || input.includes("لندن")) {
      city = "London";
      country = "UK";
    } else if (input.includes("dubai") || input.includes("دبي")) {
      city = "Dubai";
      country = "UAE";
    } else if (input.includes("cairo") || input.includes("القاهرة")) {
      city = "Cairo";
      country = "Egypt";
    } else if (input.includes("riyadh") || input.includes("الرياض")) {
      city = "Riyadh";
      country = "Saudi Arabia";
    } else if (input.includes("new york") || input.includes("نيويورك")) {
      city = "New York";
      country = "USA";
    } else if (input.includes("rome") || input.includes("روما")) {
      city = "Rome";
      country = "Italy";
    } else if (input.includes("istanbul") || input.includes("اسطنبول")) {
      city = "Istanbul";
      country = "Turkey";
    }
    
    // Generate itinerary based on city
    const itinerary = generateCityItinerary(city, country);
    
    return {
      content: `I'll help you plan the perfect trip to ${city}! Here's a personalized 3-day itinerary based on the best attractions and experiences in ${city}, ${country}.`,
      itinerary,
      city
    };
  };

  const generateCityItinerary = (city: string, country: string) => {
    const itineraries = {
      "Paris": [
        {
          day: 1,
          date: "Day 1",
          theme: "Classic Paris & Culture",
          items: [
            {
              time: "9:00 AM - 11:30 AM",
              activity: "Eiffel Tower",
              location: "Visit the iconic symbol of Paris",
              cost: 25,
              type: "culture"
            },
            {
              time: "2:00 PM - 5:00 PM",
              activity: "Louvre Museum",
              location: "World's largest art museum",
              cost: 17,
              type: "culture"
            },
            {
              time: "7:00 PM - 9:00 PM",
              activity: "Seine River Cruise",
              location: "Evening cruise with dinner",
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
              location: "Beautiful basilica in Montmartre",
              cost: 0,
              type: "culture"
            },
            {
              time: "2:00 PM - 4:00 PM",
              activity: "Champs-Élysées Shopping",
              location: "Famous shopping avenue",
              cost: 100,
              type: "shopping"
            },
            {
              time: "7:00 PM - 9:00 PM",
              activity: "French Bistro Dinner",
              location: "Authentic French cuisine",
              cost: 45,
              type: "food"
            }
          ]
        }
      ],
      "Dubai": [
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
              location: "World's largest shopping mall",
              cost: 150,
              type: "shopping"
            },
            {
              time: "7:00 PM - 9:00 PM",
              activity: "Dubai Fountain Show",
              location: "Musical fountain show",
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
              location: "Traditional markets and creek",
              cost: 20,
              type: "shopping"
            },
            {
              time: "3:00 PM - 8:00 PM",
              activity: "Desert Safari",
              location: "Dune bashing and camel riding",
              cost: 80,
              type: "culture"
            },
            {
              time: "8:00 PM - 10:00 PM",
              activity: "Bedouin Dinner",
              location: "Traditional desert dinner",
              cost: 35,
              type: "food"
            }
          ]
        }
      ],
      "London": [
        {
          day: 1,
          date: "Day 1",
          theme: "Royal London & History",
          items: [
            {
              time: "9:00 AM - 11:00 AM",
              activity: "Tower of London",
              location: "Historic castle and Crown Jewels",
              cost: 30,
              type: "culture"
            },
            {
              time: "1:00 PM - 3:00 PM",
              activity: "British Museum",
              location: "World history and artifacts",
              cost: 0,
              type: "culture"
            },
            {
              time: "7:00 PM - 9:00 PM",
              activity: "Traditional Pub Dinner",
              location: "Authentic British pub experience",
              cost: 25,
              type: "food"
            }
          ]
        },
        {
          day: 2,
          date: "Day 2",
          theme: "Modern London & Thames",
          items: [
            {
              time: "10:00 AM - 12:00 PM",
              activity: "London Eye",
              location: "Giant observation wheel",
              cost: 35,
              type: "culture"
            },
            {
              time: "2:00 PM - 4:00 PM",
              activity: "Covent Garden",
              location: "Shopping and street performers",
              cost: 50,
              type: "shopping"
            },
            {
              time: "7:00 PM - 9:00 PM",
              activity: "Thames River Cruise",
              location: "Evening river cruise",
              cost: 20,
              type: "culture"
            }
          ]
        }
      ]
    };
    
    return itineraries[city] || itineraries["Tokyo"]; // fallback to Tokyo
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? (
        <MobileSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={setActiveConversation}
          onNewConversation={handleNewConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={setActiveConversation}
          onNewConversation={handleNewConversation}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        {showWelcome ? (
          <div className="flex-1 flex flex-col min-h-0">
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-foreground">TravelAI</h1>
                <div className="w-10" />
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4 sm:px-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  {t('chat.welcomeTitle')}
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8">
                  {t('chat.welcomeDescription')}
                </p>
                <TripSuggestions onSelectSuggestion={handleSendMessage} />
              </div>
            </div>
            <ChatArea 
              messages={[]} 
              onSendMessage={handleSendMessage} 
              isWelcomeMode={true}
              onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
            />
          </div>
        ) : (
          <>
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-foreground">TravelAI</h1>
                <div className="w-10" />
              </div>
            )}
          <ChatArea 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isWelcomeMode={false}
              onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
          />
          </>
        )}
      </div>
    </div>
  );
};