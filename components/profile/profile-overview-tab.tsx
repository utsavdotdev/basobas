"use client";

import type { User } from "@/lib/mock-data";
import { PhoneVerification } from "@/components/phone-verification";
import { TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface ProfileOverviewTabProps {
  user: User;
  onVerifyPhone: (phone: string) => void;
}

export function ProfileOverviewTab({ user, onVerifyPhone }: ProfileOverviewTabProps) {
  return (
    <TabsContent value="profile">
      <div className="space-y-6">
        <PhoneVerification isVerified={user.verified} onVerify={onVerifyPhone} />

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Account Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="mt-1 font-medium">{user.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1 font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Type</Label>
              <p className="mt-1 font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Verification Status</Label>
              <p className="mt-1 font-medium">
                {user.verified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  "Not verified"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
