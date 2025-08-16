import { useState, useEffect } from "react";
import { Clock, MapPin, DollarSign, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  cost: number;
  type: "culture" | "food" | "transport" | "shopping";
}

interface DayItinerary {
  day: number;
  date: string;
  theme: string;
  items: ItineraryItem[];
}

interface ItineraryTableProps {
  itinerary?: DayItinerary[];
  city?: string;
  onEdit?: (itinerary: DayItinerary[]) => void;
}

export const ItineraryTable = ({ itinerary: propItinerary, city = "Tokyo", onEdit }: ItineraryTableProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [editingItem, setEditingItem] = useState<{dayIndex: number, itemIndex: number} | null>(null);
  const [localItinerary, setLocalItinerary] = useState<DayItinerary[]>([]);
  const { t } = useTranslation();

  const defaultItinerary: DayItinerary[] = [
    {
      day: 1,
      date: "April 10",
      theme: "Culture & Tradition",
      items: [
        {
          time: "9:00 AM - 11:00 AM",
          activity: "Meiji Shrine",
          location: "Tokyo's most famous Shinto shrine",
          cost: 0,
          type: "culture"
        },
        {
          time: "1:00 PM - 4:00 PM",
          activity: "Tokyo National Museum",
          location: "Explore Japanese art and artifacts",
          cost: 12,
          type: "culture"
        },
        {
          time: "7:00 PM - 9:00 PM",
          activity: "Dinner at Nabezo",
          location: "Traditional Japanese pub experience",
          cost: 45,
          type: "food"
        }
      ]
    },
    {
      day: 2,
      date: "April 11",
      theme: "Modern Tokyo & Shopping",
      items: [
        {
          time: "8:00 AM - 10:00 AM",
          activity: "Tsukiji Outer Market",
          location: "Fresh sushi breakfast experience",
          cost: 25,
          type: "food"
        },
        {
          time: "11:00 AM - 2:00 PM",
          activity: "Imperial Palace Gardens",
          location: "Beautiful East Gardens",
          cost: 0,
          type: "culture"
        },
        {
          time: "3:00 PM - 6:00 PM",
          activity: "Ginza Shopping",
          location: "Upscale shopping district",
          cost: 100,
          type: "shopping"
        }
      ]
    }
  ];

  useEffect(() => {
    setLocalItinerary(propItinerary || defaultItinerary);
  }, [propItinerary]);

  const handleEditItem = (dayIndex: number, itemIndex: number, updatedItem: ItineraryItem) => {
    const newItinerary = [...localItinerary];
    newItinerary[dayIndex].items[itemIndex] = updatedItem;
    setLocalItinerary(newItinerary);
    onEdit?.(newItinerary);
    setEditingItem(null);
  };

  const handleDeleteItem = (dayIndex: number, itemIndex: number) => {
    const newItinerary = [...localItinerary];
    newItinerary[dayIndex].items.splice(itemIndex, 1);
    setLocalItinerary(newItinerary);
    onEdit?.(newItinerary);
  };

  const handleAddItem = (dayIndex: number) => {
    const newItem: ItineraryItem = {
      time: "10:00 AM - 12:00 PM",
      activity: "New Activity",
      location: "Location description",
      cost: 0,
      type: "culture"
    };
    const newItinerary = [...localItinerary];
    newItinerary[dayIndex].items.push(newItem);
    setLocalItinerary(newItinerary);
    onEdit?.(newItinerary);
  };

  const totalCost = localItinerary.reduce((total, day) => 
    total + day.items.reduce((dayTotal, item) => dayTotal + item.cost, 0), 0
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "culture": return "bg-travel-blue-light text-travel-blue-dark";
      case "food": return "bg-orange-100 text-orange-700";
      case "transport": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card className="w-full bg-card border-border shadow-medium">
      <CardHeader className="border-b border-border p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              {t('itinerary.title')} - {city}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('itinerary.subtitle')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-travel-blue">
              ${totalCost}
            </div>
            <div className="text-xs text-muted-foreground">
              + $35 {t('itinerary.transport')}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {localItinerary.map((day, dayIndex) => (
          <div key={day.day} className="border-b border-border last:border-b-0">
            <div className="bg-accent/50 px-4 sm:px-6 py-2 sm:py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  {t('itinerary.day')} {day.day} - {day.theme}
                </h3>
                <span className="text-xs sm:text-sm text-muted-foreground">{day.date}</span>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {day.items.map((item, itemIndex) => (
                <div key={itemIndex} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-accent/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {item.time}
                        </span>
                        <Badge className={`${getTypeColor(item.type)} text-xs`}>
                          {t(`itinerary.types.${item.type}`)}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">
                        {item.activity}
                      </h4>
                      
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-base sm:text-lg font-semibold text-travel-blue">
                        <DollarSign className="w-4 h-4" />
                        {item.cost === 0 ? t('itinerary.free') : item.cost}
                      </div>
                      
                      {/* Edit/Delete buttons - show on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => setEditingItem({dayIndex, itemIndex})}
                            >
                              ✏️
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Activity</DialogTitle>
                            </DialogHeader>
                            <EditItemForm
                              item={item}
                              onSave={(updatedItem) => handleEditItem(dayIndex, itemIndex, updatedItem)}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteItem(dayIndex, itemIndex)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add new item button */}
              <div className="px-4 sm:px-6 py-2 border-t border-dashed border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddItem(dayIndex)}
                  className="w-full text-travel-blue hover:bg-travel-blue-light"
                >
                  + Add Activity
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Action Buttons */}
      <div className="border-t border-border p-3 sm:p-4 bg-accent/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={feedback === "up" ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className="gap-1 text-xs sm:text-sm"
            >
              <ThumbsUp className="w-4 h-4" />
              {t('itinerary.helpful')}
            </Button>
            <Button
              variant={feedback === "down" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className="gap-1 text-xs sm:text-sm"
            >
              <ThumbsDown className="w-4 h-4" />
              {t('itinerary.notHelpful')}
            </Button>
          </div>
          
          <Button 
            variant="default" 
            size="sm"
            className="bg-travel-blue hover:bg-travel-blue-dark text-white gap-1 text-xs sm:text-sm w-full sm:w-auto"
          >
            <FileText className="w-4 h-4" />
            {t('itinerary.exportPdf')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface EditItemFormProps {
  item: ItineraryItem;
  onSave: (item: ItineraryItem) => void;
}

const EditItemForm = ({ item, onSave }: EditItemFormProps) => {
  const [formData, setFormData] = useState(item);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Time</label>
        <Input
          value={formData.time}
          onChange={(e) => setFormData({...formData, time: e.target.value})}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Activity</label>
        <Input
          value={formData.activity}
          onChange={(e) => setFormData({...formData, activity: e.target.value})}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Location</label>
        <Textarea
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          rows={2}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Cost ($)</label>
        <Input
          type="number"
          value={formData.cost}
          onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
          className="w-full p-2 border rounded"
        >
          <option value="culture">Culture</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
        </select>
      </div>
      
      <Button type="submit" className="w-full">
        Save Changes
      </Button>
    </form>
  );
};