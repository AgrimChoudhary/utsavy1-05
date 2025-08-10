
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, UserCheck, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Activity {
  id: string;
  guest_name: string;
  event_name: string;
  action: 'viewed' | 'accepted';
  timestamp: string;
}

export const RealTimeTracker = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for guests table changes
    const channel = supabase
      .channel('guest-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests'
        },
        async (payload) => {
          try {
            // Get event details for the updated guest
            const { data: guestWithEvent } = await supabase
              .from('guests')
              .select(`
                *,
                events!inner(name, host_id)
              `)
              .eq('id', payload.new.id)
              .eq('events.host_id', user.id)
              .single();

            if (guestWithEvent) {
              const oldRecord = payload.old;
              const newRecord = payload.new;
              
              let action: 'viewed' | 'accepted' | null = null;
              
              // Determine what changed
              if (!oldRecord.viewed && newRecord.viewed) {
                action = 'viewed';
              } else if (!oldRecord.accepted && newRecord.accepted) {
                action = 'accepted';
              }

              if (action) {
                const newActivity: Activity = {
                  id: `${guestWithEvent.id}-${Date.now()}`,
                  guest_name: guestWithEvent.name,
                  event_name: guestWithEvent.events.name,
                  action,
                  timestamp: new Date().toISOString()
                };

                setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep last 10 activities

                // Show toast notification
                const actionText = action === 'viewed' ? 'viewed' : 'accepted';
                toast({
                  title: "New Activity",
                  description: `${guestWithEvent.name} ${actionText} invitation for ${guestWithEvent.events.name}`
                });
              }
            }
          } catch (error) {
            console.error('Error processing real-time update:', error);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getActionIcon = (action: Activity['action']) => {
    switch (action) {
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      case 'accepted':
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: Activity['action']) => {
    switch (action) {
      case 'viewed':
        return 'secondary';
      case 'accepted':
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Live Activity
        </CardTitle>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </Badge>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
            <p className="text-gray-600">Guest interactions will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getActionIcon(activity.action)}
                  <div>
                    <p className="font-medium">{activity.guest_name}</p>
                    <p className="text-sm text-gray-600">{activity.event_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getActionColor(activity.action)}>
                    {activity.action}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(activity.timestamp), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
