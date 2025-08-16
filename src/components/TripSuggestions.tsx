import { MapPin, Users, Mountain, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const suggestions: TripSuggestion[] = [
    {
      id: "paris",
      title: t('suggestions.paris.title'),
      description: t('suggestions.paris.description'),
      icon: <MapPin className="w-5 h-5 text-travel-blue" />,
      prompt: t('suggestions.paris.prompt')
    },
    {
      id: "family",
      title: t('suggestions.family.title'),
      description: t('suggestions.family.description'),
      icon: <Users className="w-5 h-5 text-travel-teal" />,
      prompt: t('suggestions.family.prompt')
    },
    {
      id: "adventure",
      title: t('suggestions.adventure.title'),
      description: t('suggestions.adventure.description'),
      icon: <Mountain className="w-5 h-5 text-travel-success" />,
      prompt: t('suggestions.adventure.prompt')
    },
    {
      id: "food",
      title: t('suggestions.food.title'),
      description: t('suggestions.food.description'),
      icon: <Utensils className="w-5 h-5 text-travel-warning" />,
      prompt: t('suggestions.food.prompt')
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