import { MapPin, Users, Mountain, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TripSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
}

interface TripSuggestionsProps {
  onSelectSuggestion: (prompt: string) => void;
}

export const TripSuggestions = ({ onSelectSuggestion }: TripSuggestionsProps) => {
  const suggestions: TripSuggestion[] = [
    {
      id: "paris",
      title: "Weekend in Paris",
      description: "Plan a 3-day trip to Paris on a budget",
      icon: <MapPin className="w-5 h-5 text-travel-blue" />,
      prompt: "I'd like to plan a 3-day weekend trip to Paris. I'm interested in culture, museums, and good food. My budget is around $1500 excluding flights."
    },
    {
      id: "family",
      title: "Family Beach Vacation",
      description: "Plan a 7-day beach trip for a family of 4",
      icon: <Users className="w-5 h-5 text-travel-teal" />,
      prompt: "I want to plan a 7-day family beach vacation for 4 people (2 adults, 2 kids aged 8 and 12). We're looking for family-friendly activities and accommodations."
    },
    {
      id: "adventure",
      title: "Adventure in New Zealand",
      description: "Plan a 10-day adventure trip with hiking",
      icon: <Mountain className="w-5 h-5 text-travel-success" />,
      prompt: "I'm planning a 10-day adventure trip to New Zealand. I love hiking, outdoor activities, and scenic views. Budget is around $3000."
    },
    {
      id: "food",
      title: "Food Tour in Italy",
      description: "Plan a culinary journey through Italy",
      icon: <Utensils className="w-5 h-5 text-travel-warning" />,
      prompt: "I want to plan a culinary journey through Italy for 2 weeks. I'm passionate about authentic local cuisine and cooking classes."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {suggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          className="cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105 border-border bg-card"
          onClick={() => onSelectSuggestion(suggestion.prompt)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent rounded-lg">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};