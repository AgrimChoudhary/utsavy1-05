
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, UserCheck, Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Event, Guest } from '@/types';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export const AnalyticsDashboard = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get events with guest data
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          guests (*),
          template:templates (*)
        `)
        .eq('host_id', user.id);

      if (eventsError) throw eventsError;

      const typedEvents = (events || []) as unknown as Event[];

      // Calculate analytics
      const totalEvents = typedEvents.length;
      const totalGuests = typedEvents.reduce((sum, event) => sum + (event.guests?.length || 0), 0);
      const totalViewed = typedEvents.reduce((sum, event) => 
        sum + (event.guests?.filter((g: Guest) => g.viewed).length || 0), 0);
      const totalAccepted = typedEvents.reduce((sum, event) => 
        sum + (event.guests?.filter((g: Guest) => g.accepted).length || 0), 0);

      const viewRate = totalGuests > 0 ? (totalViewed / totalGuests) * 100 : 0;
      const acceptanceRate = totalViewed > 0 ? (totalAccepted / totalViewed) * 100 : 0;

      // Event performance data
      const eventPerformance = typedEvents.map((event: Event) => {
        const guests = event.guests || [];
        const viewed = guests.filter((g: Guest) => g.viewed).length;
        const accepted = guests.filter((g: Guest) => g.accepted).length;
        return {
          name: event.name.substring(0, 20) + (event.name.length > 20 ? '...' : ''),
          guests: guests.length,
          viewed,
          accepted,
          viewRate: guests.length > 0 ? (viewed / guests.length) * 100 : 0
        };
      });

      // Template usage
      const templateUsage = typedEvents.reduce((acc: Record<string, number>, event: Event) => {
        const templateName = event.template?.name || 'Unknown';
        acc[templateName] = (acc[templateName] || 0) + 1;
        return acc;
      }, {});

      const templateData = Object.entries(templateUsage).map(([name, value]) => ({
        name,
        value
      }));

      return {
        totalEvents,
        totalGuests,
        totalViewed,
        totalAccepted,
        viewRate,
        acceptanceRate,
        eventPerformance,
        templateData,
        events: typedEvents,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds for near real-time updates
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Create some events to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">View Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.viewRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalViewed} of {analytics.totalGuests} viewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalAccepted} accepted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Event Performance</TabsTrigger>
          <TabsTrigger value="templates">Template Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.eventPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.eventPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="guests" fill="#8884d8" name="Total Guests" />
                    <Bar dataKey="viewed" fill="#82ca9d" name="Viewed" />
                    <Bar dataKey="accepted" fill="#ffc658" name="Accepted" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No events to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.templateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.templateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.templateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No template data to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
