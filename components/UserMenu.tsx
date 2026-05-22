"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  username: string;
  role: string;
}

export function UserMenu({ username, role }: UserMenuProps) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 px-1">
      {/* Avatar */}
      <div className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
        role === "admin" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
      )}>
        {username?.[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{username}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          {role === "admin"
            ? <><ShieldCheck className="h-2.5 w-2.5" /> Admin</>
            : <><User className="h-2.5 w-2.5" /> User</>
          }
        </p>
      </div>

      {/* Logout */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
        onClick={logout}
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
