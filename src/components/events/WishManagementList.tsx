import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useQueryClient } from "@tanstack/react-query";
import WishActionsMenu from "@/components/wishes/WishActionsMenu";
import { Eye, EyeOff, Filter } from "lucide-react";

interface Wish {
  id: string;
  event_id: string;
  guest_id?: string | null;
  guest_name: string;
  wish_text: string;
  photo_url?: string | null;
  is_approved: boolean;
  likes_count: number;
  created_at: string;
}

export function WishManagementList({ eventId }: { eventId: string }) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishesEnabled, setWishesEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'management' | 'visibility'>('management');
  
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const sortedWishes = useMemo(
    () => [...wishes].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [wishes]
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const approvedCount = useMemo(() => wishes.filter((w) => w.is_approved).length, [wishes]);
  const pendingCount = useMemo(() => wishes.length - approvedCount, [wishes, approvedCount]);

  const filteredWishes = useMemo(() => {
    if (statusFilter === 'approved') return sortedWishes.filter((w) => w.is_approved);
    if (statusFilter === 'pending') return sortedWishes.filter((w) => !w.is_approved);
    return sortedWishes;
  }, [sortedWishes, statusFilter]);

  const fetchWishes = async () => {
    try {
      console.log('🔄 Fetching wishes for event:', eventId);
      setLoading(true);
      const sb: any = supabase as any; // bypass types until generated types include wishes
      
      console.log('🔍 Executing database query...');
      const { data, error } = await sb
        .from("wishes")
        .select("id,event_id,guest_id,guest_name,wish_text,photo_url,is_approved,likes_count,created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      console.log('📊 Query result:', { data, error, dataLength: data?.length || 0 });
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Wishes fetched successfully:', data?.length || 0, 'wishes');
      setWishes(data || []);
    } catch (err: any) {
      console.error("❌ Failed to load wishes:", err);
      console.error("❌ Error details:", {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      toast({ title: "Error", description: "Failed to load wishes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventData = async () => {
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select('wishes_enabled')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      if (eventData && eventData.wishes_enabled !== undefined) {
        setWishesEnabled(Boolean(eventData.wishes_enabled));
      }
    } catch (err: any) {
      console.error("Failed to fetch event data:", err);
    }
  };

  const handleToggleWishes = async (next: boolean) => {
    setWishesEnabled(next);
    const { error } = await supabase
      .from('events')
      .update({ wishes_enabled: next })
      .eq('id', eventId);
    if (error) {
      setWishesEnabled(!next);
      toast({
        title: 'Update failed',
        description: 'Could not update wish section visibility',
        variant: 'destructive',
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast({
        title: 'Wishes visibility updated',
        description: `Wishes section is now ${next ? 'visible' : 'hidden'} to guests`,
      });
    }
  };


  useEffect(() => {
    if (!eventId) return;
    fetchWishes();
    fetchEventData();

    const channel = supabase
      .channel(`wishes-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wishes", filter: `event_id=eq.${eventId}` },
        () => fetchWishes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const approveWish = async (wishId: string) => {
    try {
      const sb: any = supabase as any;
      const { error } = await sb.from("wishes").update({ is_approved: true }).eq("id", wishId);
      if (error) throw error;
      setWishes((prev) => prev.map((w) => (w.id === wishId ? { ...w, is_approved: true } : w)));
      toast({ title: "Wish approved", description: "Now visible to guests." });
    } catch (err: any) {
      console.error("Approve wish error:", err);
      toast({ title: "Error", description: "Failed to approve wish", variant: "destructive" });
    }
  };

  const deleteWish = async (wishId: string) => {
    try {
      const sb: any = supabase as any;
      const { error } = await sb.from("wishes").delete().eq("id", wishId);
      if (error) throw error;
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      toast({ title: "Wish deleted" });
    } catch (err: any) {
      console.error("Delete wish error:", err);
      toast({ title: "Error", description: "Failed to delete wish", variant: "destructive" });
    }
  };

  const viewPhoto = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Wish text copied to clipboard." });
    } catch (err) {
      toast({ title: "Copy failed", description: "Could not copy text", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'management' | 'visibility')} className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto' : 'grid-cols-2'}`}>
          <TabsTrigger 
            value="management" 
            className={`${isMobile ? 'w-full mb-1' : ''} flex items-center justify-center gap-2`}
          >
            <span>Wish Management</span>
            <Badge variant="secondary" className="text-xs">
              {wishes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="visibility" 
            className={`${isMobile ? 'w-full' : ''} flex items-center justify-center gap-2`}
          >
            {wishesEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Visibility Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="management" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Guest Wishes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review and manage wishes submitted by your guests
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-semibold">{wishes.length}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-semibold text-green-600">{approvedCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-semibold text-yellow-600">{pendingCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              {/* Filter Section */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredWishes.length} of {wishes.length} wishes
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Filter className="h-3 w-3" />
                      <span className="capitalize">{statusFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter('all')}
                      className={statusFilter === 'all' ? 'bg-accent' : ''}
                    >
                      All ({wishes.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter('approved')}
                      className={statusFilter === 'approved' ? 'bg-accent' : ''}
                    >
                      Approved ({approvedCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter('pending')}
                      className={statusFilter === 'pending' ? 'bg-accent' : ''}
                    >
                      Pending ({pendingCount})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Wishes List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <div className="text-sm text-muted-foreground">Loading wishes…</div>
                </div>
              ) : sortedWishes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm text-muted-foreground">No wishes yet.</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wishes will appear here when guests submit them
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {filteredWishes.map((wish) => (
                    <div key={wish.id} className="border rounded-lg p-3 sm:p-4 bg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-medium text-sm sm:text-base truncate">{wish.guest_name}</span>
                            {wish.is_approved ? (
                              <Badge variant="secondary" className="text-xs">Approved</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                            )}
                            {wish.likes_count > 0 && (
                              <Badge variant="outline" className="text-xs">{wish.likes_count} likes</Badge>
                            )}
                            {wish.photo_url && (
                              <Badge variant="outline" className="text-xs">Photo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap leading-relaxed">
                            {wish.wish_text}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <WishActionsMenu
                            isApproved={wish.is_approved}
                            hasPhoto={!!wish.photo_url}
                            onApprove={() => approveWish(wish.id)}
                            onDelete={() => deleteWish(wish.id)}
                            onViewPhoto={() => viewPhoto(wish.photo_url)}
                            onCopyText={() => copyText(wish.wish_text)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visibility" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Wishes Visibility Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Control whether guests can see and submit wishes on their invitation
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm sm:text-base">Show Wishes Section</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      When enabled, guests can view and submit wishes on their invitation page
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="wishes-enabled"
                      checked={wishesEnabled}
                      onCheckedChange={(checked) => handleToggleWishes(checked === true)}
                      aria-label="Toggle wishes section visibility"
                    />
                    <Label htmlFor="wishes-enabled" className="text-sm font-medium">
                      {wishesEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-0.5">ℹ️</div>
                    <div className="text-xs sm:text-sm text-blue-800">
                      <strong>Note:</strong> When disabled, the wishes section will be hidden from all guest invitation pages. 
                      Existing wishes will remain in your management panel and can be re-enabled at any time.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WishManagementList;
