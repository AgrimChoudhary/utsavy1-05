import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const fetchWishes = async () => {
    try {
      setLoading(true);
      const sb: any = supabase as any; // bypass types until generated types include wishes
      const { data, error } = await sb
        .from("wishes")
        .select("id,event_id,guest_id,guest_name,wish_text,photo_url,is_approved,likes_count,created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setWishes(data || []);
    } catch (err: any) {
      console.error("Failed to load wishes:", err);
      toast({ title: "Error", description: "Failed to load wishes", variant: "destructive" });
    } finally {
      setLoading(false);
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
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading wishes…</div>
        ) : sortedWishes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No wishes yet.</div>
        ) : (
          <div className="divide-y">
            {sortedWishes.map((wish) => (
              <div key={wish.id} className="flex items-start justify-between py-3 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{wish.guest_name}</span>
                    {wish.is_approved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                    {wish.wish_text}
                  </p>
                  {wish.photo_url && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">Photo attached</p>
                  )}
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
