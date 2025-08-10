import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, LogOut, BarChart3, Wifi, WifiOff, Search, X, 
  Calendar as CalendarIcon, ChevronDown, Clock, Users,
  ChevronLeft, ChevronRight, Eye, UserCheck, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HostedEvents } from './HostedEvents';
import { InvitedEvents } from './InvitedEvents';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ConnectionWarning } from '@/components/ui/connection-warning';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: events, isLoading, error } = useEvents(user?.id);
  const { isConnected } = useRealTimeUpdates();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [hostedCurrentPage, setHostedCurrentPage] = useState(1);
  const [invitedCurrentPage, setInvitedCurrentPage] = useState(1);
  const cardsPerPage = 8;

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const name = user.user_metadata?.name || user.email || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Calculate stats
  const hostedEvents = events?.hosted || [];
  const invitedEvents = events?.invited || [];
  const totalHostedEvents = hostedEvents.length;
  const totalInvitedEvents = invitedEvents.length;
  
  // Filter events based on search
  const filteredHostedEvents = hostedEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvitedEvents = invitedEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate pagination for hosted events
  const totalHostedPages = Math.ceil(filteredHostedEvents.length / cardsPerPage);
  const hostedPaginatedEvents = filteredHostedEvents.slice(
    (hostedCurrentPage - 1) * cardsPerPage,
    hostedCurrentPage * cardsPerPage
  );
  
  // Calculate pagination for invited events
  const totalInvitedPages = Math.ceil(filteredInvitedEvents.length / cardsPerPage);
  const invitedPaginatedEvents = filteredInvitedEvents.slice(
    (invitedCurrentPage - 1) * cardsPerPage,
    invitedCurrentPage * cardsPerPage
  );
  
  // Reset pagination when search term changes
  useEffect(() => {
    setHostedCurrentPage(1);
    setInvitedCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If there's an error and the user is not logged in, don't show the error
  // Let the AuthProvider handle the redirection to login
  if (error && !user) {
    return null;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-md">
            <div className="bg-red-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
            <p className="text-gray-600 mb-4">An error occurred while loading your events. This is often due to a misconfigured database policy.</p>
            <p className="text-xs text-red-600 break-all mb-4">{error?.message || String(error)}</p>
            <Button onClick={() => window.location.reload()} className="bg-black text-white hover:bg-gray-800">
              Refresh Page
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <OfflineIndicator />

        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-black">
                  UTSAVY
                </h1>
                <Badge variant={isConnected ? 'default' : 'secondary'} className="flex items-center gap-1 bg-black text-white">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                {/* Desktop Create Event Button */}
                <Link to="/create-event" className="hidden md:block">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-700 text-white font-medium px-5 h-10 shadow-sm transition-all duration-300 hover:shadow-md rounded-full flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
                    Create Event
                  </Button>
                </Link>

                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-100 transition-all duration-200 rounded-full">
                        <Avatar className="h-8 w-8 ring-2 ring-gray-100 transition-transform duration-200 hover:scale-105">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white font-medium">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:inline font-medium">{user?.user_metadata?.name || user?.email}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px] p-2 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="px-3 pt-2 pb-3 mb-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white text-lg font-medium">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-gray-900 truncate">{user?.user_metadata?.name || 'User'}</span>
                            <span className="text-sm text-gray-500 truncate">{user?.email}</span>
                          </div>
                        </div>
                      </div>
                      <Link to="/profile">
                        <DropdownMenuItem className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-lg gap-3 mb-1 transition-colors duration-200">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <User className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Profile</span>
                            <span className="text-xs text-gray-500">Manage your account</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/analytics">
                        <DropdownMenuItem className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-lg gap-3 mb-1 transition-colors duration-200">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <BarChart3 className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Analytics</span>
                            <span className="text-xs text-gray-500">View event statistics</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={signOut} className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded-lg gap-3 text-red-600 mt-1 transition-colors duration-200">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Sign Out</span>
                          <span className="text-xs text-red-500">End your session</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile User Menu */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-100 transition-all duration-200 rounded-full">
                        <Avatar className="h-8 w-8 ring-2 ring-gray-100 transition-transform duration-200 hover:scale-105">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white font-medium">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px] p-2 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="px-3 pt-2 pb-3 mb-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white text-lg font-medium">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-gray-900 truncate">{user?.user_metadata?.name || 'User'}</span>
                            <span className="text-sm text-gray-500 truncate">{user?.email}</span>
                          </div>
                        </div>
                      </div>
                      <Link to="/profile">
                        <DropdownMenuItem className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-lg gap-3 mb-1 transition-colors duration-200">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <User className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Profile</span>
                            <span className="text-xs text-gray-500">Manage your account</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/analytics">
                        <DropdownMenuItem className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-lg gap-3 mb-1 transition-colors duration-200">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <BarChart3 className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Analytics</span>
                            <span className="text-xs text-gray-500">View event statistics</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={signOut} className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded-lg gap-3 text-red-600 mt-1 transition-colors duration-200">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Sign Out</span>
                          <span className="text-xs text-red-500">End your session</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Connection Warning */}
        <ConnectionWarning isConnected={isConnected} className="mx-4 sm:mx-6 lg:mx-8 mt-4" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome, {user?.user_metadata?.name || user?.email}
              </h2>
              <p className="text-gray-600 mt-1">Manage your events and invitations from one place.</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-5 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search events by name..."
                  className="pl-10 h-10 border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="hosted" className="p-5">
              <TabsList className="grid w-full grid-cols-2 max-w-md mb-5 bg-gray-100">
                <TabsTrigger value="hosted" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  My Events ({filteredHostedEvents.length})
                </TabsTrigger>
                <TabsTrigger value="invited" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  Invitations ({filteredInvitedEvents.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="hosted" className="pt-2">
                <HostedEvents events={hostedPaginatedEvents} />
                
                {/* Pagination for Hosted Events */}
                {totalHostedPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHostedCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={hostedCurrentPage === 1}
                      className="border-gray-300 text-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalHostedPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={page === hostedCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setHostedCurrentPage(page)}
                          className={page === hostedCurrentPage ? "bg-black text-white" : "border-gray-300 text-gray-700"}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHostedCurrentPage(prev => Math.min(prev + 1, totalHostedPages))}
                      disabled={hostedCurrentPage === totalHostedPages}
                      className="border-gray-300 text-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="invited" className="pt-2">
                <InvitedEvents events={invitedPaginatedEvents} />
                
                {/* Pagination for Invited Events */}
                {totalInvitedPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setInvitedCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={invitedCurrentPage === 1}
                      className="border-gray-300 text-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalInvitedPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={page === invitedCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInvitedCurrentPage(page)}
                          className={page === invitedCurrentPage ? "bg-black text-white" : "border-gray-300 text-gray-700"}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setInvitedCurrentPage(prev => Math.min(prev + 1, totalInvitedPages))}
                      disabled={invitedCurrentPage === totalInvitedPages}
                      className="border-gray-300 text-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
        </main>

        {/* Mobile Create Event Button (Fixed at bottom) */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Link to="/create-event">
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-700 text-white font-medium px-5 h-10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full flex items-center"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
};