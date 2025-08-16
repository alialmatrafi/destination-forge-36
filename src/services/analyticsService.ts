import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

// Types for analytics
export interface UserInteraction {
  id?: string;
  user_id?: string;
  session_id: string;
  interaction_type: 'message_sent' | 'itinerary_generated' | 'itinerary_edited' | 'feedback_given' | 'conversation_deleted';
  content: string;
  metadata?: {
    message_length?: number;
    response_time?: number;
    user_satisfaction?: 'positive' | 'negative';
    destination?: string;
    trip_duration?: number;
    trip_type?: string;
    budget_range?: string;
    group_size?: number;
    generated_successfully?: boolean;
    edit_type?: string;
    feedback_type?: 'helpful' | 'not_helpful';
  };
  created_at?: string;
}

export interface AnalyticsInsight {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

class AnalyticsService {
  // Track user interactions
  async trackInteraction(interaction: UserInteraction): Promise<void> {
    try {
      // Always store locally for backup
      this.storeLocalAnalytics(interaction);

      if (!hasValidSupabaseConfig || !supabase) {
        return;
      }

      const { error } = await supabase
        .from('user_interactions')
        .insert({
          ...interaction,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking interaction:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Store analytics locally as backup
  private storeLocalAnalytics(interaction: UserInteraction): void {
    try {
      const stored = localStorage.getItem('travel-analytics');
      const analytics = stored ? JSON.parse(stored) : [];
      
      analytics.push({
        ...interaction,
        created_at: new Date().toISOString()
      });

      // Keep only last 1000 interactions locally
      if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
      }

      localStorage.setItem('travel-analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Local analytics storage error:', error);
    }
  }

  // Track message sent
  async trackMessageSent(content: string, metadata: any = {}): Promise<void> {
    await this.trackInteraction({
      session_id: this.getSessionId(),
      interaction_type: 'message_sent',
      content,
      metadata: {
        message_length: content.length,
        ...metadata
      }
    });
  }

  // Track itinerary generation
  async trackItineraryGenerated(
    destination: string, 
    duration: number, 
    success: boolean, 
    responseTime: number,
    tripType?: string,
    budgetRange?: string,
    groupSize?: number
  ): Promise<void> {
    await this.trackInteraction({
      session_id: this.getSessionId(),
      interaction_type: 'itinerary_generated',
      content: `Generated itinerary for ${destination}`,
      metadata: {
        destination,
        trip_duration: duration,
        trip_type: tripType,
        budget_range: budgetRange,
        group_size: groupSize,
        generated_successfully: success,
        response_time: responseTime
      }
    });
  }

  // Track itinerary edits
  async trackItineraryEdit(editType: string, destination: string): Promise<void> {
    await this.trackInteraction({
      session_id: this.getSessionId(),
      interaction_type: 'itinerary_edited',
      content: `Edited itinerary: ${editType}`,
      metadata: {
        edit_type: editType,
        destination
      }
    });
  }

  // Track user feedback
  async trackFeedback(feedbackType: 'helpful' | 'not_helpful', context: string): Promise<void> {
    await this.trackInteraction({
      session_id: this.getSessionId(),
      interaction_type: 'feedback_given',
      content: context,
      metadata: {
        feedback_type: feedbackType,
        user_satisfaction: feedbackType === 'helpful' ? 'positive' : 'negative'
      }
    });
  }

  // Get analytics insights
  async getAnalyticsInsights(): Promise<AnalyticsInsight[]> {
    try {
      if (!hasValidSupabaseConfig || !supabase) {
        return this.getLocalAnalyticsInsights();
      }

      // Get data from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching analytics:', error);
        return this.getLocalAnalyticsInsights();
      }

      return this.processAnalyticsData(data || []);
    } catch (error) {
      console.error('Analytics insights error:', error);
      return this.getLocalAnalyticsInsights();
    }
  }

  // Get local analytics insights
  private getLocalAnalyticsInsights(): AnalyticsInsight[] {
    try {
      const stored = localStorage.getItem('travel-analytics');
      const analytics = stored ? JSON.parse(stored) : [];
      
      return this.processAnalyticsData(analytics);
    } catch (error) {
      console.error('Local analytics insights error:', error);
      return [];
    }
  }

  // Process analytics data into insights
  private processAnalyticsData(data: any[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Total interactions
    insights.push({
      metric: 'Total Interactions',
      value: data.length,
      trend: 'up',
      period: 'Last 30 days'
    });

    // Successful itinerary generations
    const itineraryGenerations = data.filter(d => d.interaction_type === 'itinerary_generated');
    const successfulGenerations = itineraryGenerations.filter(d => d.metadata?.generated_successfully);
    
    insights.push({
      metric: 'Successful Itineraries',
      value: successfulGenerations.length,
      trend: 'up',
      period: 'Last 30 days'
    });

    // Success rate
    const successRate = itineraryGenerations.length > 0 
      ? Math.round((successfulGenerations.length / itineraryGenerations.length) * 100)
      : 0;
    
    insights.push({
      metric: 'Success Rate',
      value: successRate,
      trend: successRate > 80 ? 'up' : successRate > 60 ? 'stable' : 'down',
      period: 'Percentage'
    });

    // Popular destinations
    const destinations = successfulGenerations
      .map(d => d.metadata?.destination)
      .filter(Boolean);
    
    const destinationCounts = destinations.reduce((acc: any, dest) => {
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {});

    const topDestination = Object.keys(destinationCounts).sort((a, b) => 
      destinationCounts[b] - destinationCounts[a]
    )[0];

    if (topDestination) {
      insights.push({
        metric: `Top Destination: ${topDestination}`,
        value: destinationCounts[topDestination],
        trend: 'up',
        period: 'Requests'
      });
    }

    // User satisfaction
    const feedbacks = data.filter(d => d.interaction_type === 'feedback_given');
    const positiveFeedbacks = feedbacks.filter(d => d.metadata?.user_satisfaction === 'positive');
    
    const satisfactionRate = feedbacks.length > 0 
      ? Math.round((positiveFeedbacks.length / feedbacks.length) * 100)
      : 0;

    insights.push({
      metric: 'User Satisfaction',
      value: satisfactionRate,
      trend: satisfactionRate > 80 ? 'up' : satisfactionRate > 60 ? 'stable' : 'down',
      period: 'Percentage'
    });

    return insights;
  }

  // Get improvement suggestions based on analytics
  async getImprovementSuggestions(): Promise<string[]> {
    const insights = await this.getAnalyticsInsights();
    const suggestions: string[] = [];

    const successRate = insights.find(i => i.metric === 'Success Rate')?.value || 0;
    const satisfactionRate = insights.find(i => i.metric === 'User Satisfaction')?.value || 0;

    if (successRate < 70) {
      suggestions.push('تحسين خوارزمية إنتاج الجداول لزيادة معدل النجاح');
    }

    if (satisfactionRate < 70) {
      suggestions.push('تحسين جودة المحتوى والاقتراحات المقدمة');
    }

    if (insights.find(i => i.metric === 'Total Interactions')?.value || 0 < 10) {
      suggestions.push('تحسين واجهة المستخدم لتشجيع المزيد من التفاعل');
    }

    // Default suggestions if no specific issues found
    if (suggestions.length === 0) {
      suggestions.push(
        'إضافة المزيد من الوجهات السياحية',
        'تحسين دقة التكاليف المقترحة',
        'إضافة المزيد من أنواع الأنشطة'
      );
    }

    return suggestions;
  }

  // Get session ID
  private getSessionId(): string {
    let sessionId = localStorage.getItem('guest-session-id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guest-session-id', sessionId);
    }
    return sessionId;
  }

  // Export analytics data
  async exportAnalyticsData(): Promise<string> {
    try {
      const insights = await this.getAnalyticsInsights();
      const suggestions = await this.getImprovementSuggestions();
      
      const report = {
        generated_at: new Date().toISOString(),
        insights,
        suggestions,
        summary: {
          total_insights: insights.length,
          improvement_areas: suggestions.length
        }
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('Export analytics error:', error);
      return JSON.stringify({ error: 'Failed to export analytics data' });
    }
  }
}

export const analyticsService = new AnalyticsService();