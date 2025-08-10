import { MoreVertical, CheckCircle2, Trash2, Image as ImageIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WishActionsMenuProps {
  isApproved?: boolean;
  hasPhoto?: boolean;
  onApprove?: () => void;
  onDelete?: () => void;
  onViewPhoto?: () => void;
  onCopyText?: () => void;
  disabled?: boolean;
}

export function WishActionsMenu({
  isApproved = false,
  hasPhoto = false,
  onApprove,
  onDelete,
  onViewPhoto,
  onCopyText,
  disabled = false,
}: WishActionsMenuProps) {
  const handleApprove = () => {
    if (disabled || !onApprove) return;
    onApprove();
  };

  const handleDelete = () => {
    if (disabled || !onDelete) return;
    const ok = window.confirm("Delete this wish? This action cannot be undone.");
    if (ok) onDelete();
  };

  const handleViewPhoto = () => {
    if (disabled || !onViewPhoto) return;
    onViewPhoto();
  };

  const handleCopy = () => {
    if (disabled || !onCopyText) return;
    onCopyText();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Wish actions" disabled={disabled}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 z-50">
        {!isApproved && (
          <DropdownMenuItem className="cursor-pointer" onClick={handleApprove}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>Approve</span>
          </DropdownMenuItem>
        )}

        {hasPhoto && (
          <DropdownMenuItem className="cursor-pointer" onClick={handleViewPhoto}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>View photo</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="cursor-pointer" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy text</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WishActionsMenu;
