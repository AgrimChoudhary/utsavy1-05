import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import WishActionsMenu from "@/components/wishes/WishActionsMenu";

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

  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 Testing database connection...');
      const sb: any = supabase as any;
      
      // Test 0: Check authentication
      console.log('🔐 Checking authentication...');
      const { data: { user }, error: authError } = await sb.auth.getUser();
      console.log('📊 Auth test result:', { user: user?.id, authError });
      
      if (authError || !user) {
        toast({ 
          title: "Authentication Error", 
          description: "User not authenticated. Please login again.", 
          variant: "destructive" 
        });
        return;
      }
      
      // Test 1: Check if wishes table exists
      console.log('🔍 Testing if wishes table exists...');
      const { data: tableTest, error: tableError } = await sb
        .from("wishes")
        .select("count")
        .limit(1);
      
      console.log('📊 Table test result:', { tableTest, tableError });
      
      // Test 2: Check total wishes count
      console.log('🔍 Testing total wishes count...');
      const { count, error: countError } = await sb
        .from("wishes")
        .select("*", { count: 'exact', head: true });
      
      console.log('📊 Count test result:', { count, countError });
      
      // Test 3: Check wishes for specific event
      console.log('🔍 Testing wishes for event:', eventId);
      const { data: eventWishes, error: eventError } = await sb
        .from("wishes")
        .select("id,event_id,guest_name,wish_text")
        .eq("event_id", eventId)
        .limit(5);
      
      console.log('📊 Event wishes test result:', { eventWishes, eventError, count: eventWishes?.length || 0 });
      
      // Test 4: Check RLS policies by trying to insert a test wish
      console.log('🔍 Testing RLS policies...');
      const testWish = {
        event_id: eventId,
        guest_name: "Test User",
        wish_text: "Test wish for debugging",
        is_approved: false
      };
      
      const { data: insertTest, error: insertError } = await sb
        .from("wishes")
        .insert(testWish)
        .select()
        .single();
      
      console.log('📊 Insert test result:', { insertTest, insertError });
      
      // Clean up test data
      if (insertTest) {
        await sb.from("wishes").delete().eq("id", insertTest.id);
        console.log('🧹 Test wish cleaned up');
      }
      
      toast({ 
        title: "Database Test Complete", 
        description: `Auth: ${!!user}, Table: ${!tableError}, Total: ${count || 0}, Event: ${eventWishes?.length || 0}, Insert: ${!insertError}` 
      });
      
    } catch (err: any) {
      console.error('❌ Database test failed:', err);
      toast({ 
        title: "Database Test Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (!eventId) return;
    fetchWishes();

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
    <Card>
      <CardHeader>
        <CardTitle>Wishes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Badge variant="outline">Total {wishes.length}</Badge>
            <Badge variant="outline">Approved {approvedCount}</Badge>
            <Badge variant="outline">Pending {pendingCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={testDatabaseConnection}>
              🧪 Test DB
            </Button>
            <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
            <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading wishes…</div>
        ) : sortedWishes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No wishes yet.</div>
        ) : (
          <div className="divide-y">
            {filteredWishes.map((wish) => (
              <div key={wish.id} className="flex items-start justify-between py-3 gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{wish.guest_name}</span>
                    {wish.is_approved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {wish.likes_count > 0 && (
                      <Badge variant="outline">{wish.likes_count} likes</Badge>
                    )}
                    {wish.photo_url && (
                      <Badge variant="outline">Photo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                    {wish.wish_text}
                  </p>
                </div>

                <WishActionsMenu
                  isApproved={wish.is_approved}
                  hasPhoto={!!wish.photo_url}
                  onApprove={() => approveWish(wish.id)}
                  onDelete={() => deleteWish(wish.id)}
                  onViewPhoto={() => viewPhoto(wish.photo_url)}
                  onCopyText={() => copyText(wish.wish_text)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WishManagementList;
