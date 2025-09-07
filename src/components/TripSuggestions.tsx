import { MapPin, Users, Mountain, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

interface TripSuggestionsProps {
  onSuggestionClick: (prompt: string) => void;
}

export const TripSuggestions = ({ onSuggestionClick }: TripSuggestionsProps) => {
  const { t } = useTranslation();

  const suggestions = [
    {
      key: 'paris',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      key: 'family',
      icon: Users,
      color: 'text-green-600 bg-green-100',
    },
    {
      key: 'adventure',
      icon: Mountain,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      key: 'food',
      icon: Utensils,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {suggestions.map((suggestion) => {
        const Icon = suggestion.icon;
        return (
          <Card
            key={suggestion.key}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSuggestionClick(t(`suggestions.${suggestion.key}.prompt`))}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${suggestion.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">
                    {t(`suggestions.${suggestion.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`suggestions.${suggestion.key}.description`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};