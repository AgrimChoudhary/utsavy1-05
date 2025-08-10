
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export type FamilyMember = { name: string; relation: string; photo?: string; description?: string; };
export type FamilyDetails = { side: "bride" | "groom"; title: string; description: string; members: FamilyMember[]; address?: string; };

interface FamilyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyDetails: FamilyDetails | null;
}

const FamilyDetailsDialog = ({ open, onOpenChange, familyDetails }: FamilyDetailsDialogProps) => {
  if (!familyDetails) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-maroon text-cream border-gold-light">
        <DialogHeader><DialogTitle className="text-gold-light">{familyDetails.title}</DialogTitle></DialogHeader>
        <p>{familyDetails.description}</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {familyDetails.members.map((member, index) => (
            <Card key={index} className="bg-maroon/50 border-gold-light/50">
              <CardContent className="p-4 flex items-center space-x-4">
                <Avatar><AvatarImage src={member.photo} /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <h4 className="font-bold text-gold-light">{member.name}</h4>
                  <p className="text-sm">{member.relation}</p>
                  <p className="text-xs text-cream/80">{member.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyDetailsDialog;
