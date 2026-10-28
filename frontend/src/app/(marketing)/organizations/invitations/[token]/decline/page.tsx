"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrg } from "@/contexts/org-context";
import { useManageInvite } from "@/hooks/org/use-manage-invite";
import { ArrowRight, Ban, CheckCircle2, Loader2, MailOpen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"; // Assuming you use sonner or similar for notifications

export default function InvitationPage() {
    const { token } = useParams() as { token: string };
    const router = useRouter();
    const { setActiveOrg } = useActiveOrg();
    const [result, setResult] = useState<"accepted" | "declined" | null>(null);

    const { mutate: manageInvite, isPending } = useManageInvite(token);

    const handleAction = (action: "accept" | "decline") => {
        manageInvite(action, {
            onSuccess: (org) => {
                if (action === "accept") {
                    setResult("accepted");
                    setActiveOrg(org);
                    toast.success("Joined organization successfully");
                    setTimeout(() => router.push(`/dashboard`), 2000);
                } else {
                    setResult("declined");
                    toast.info("Invitation declined");
                }
            },
            onError: (err: any) => {
                toast.error(err?.message || "Something went wrong. Please try again.");
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-md w-full border-2 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                        <MailOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">
                        Team Invitation
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center py-6">
                    {!result ? (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                You have been invited to join an organization on <strong>Carwash Manager</strong>.
                                Would you like to accept this invitation?
                            </p>
                        </div>
                    ) : result === "accepted" ? (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                            <p className="font-bold text-lg">Welcome to the team!</p>
                            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <Ban className="w-12 h-12 text-muted-foreground" />
                            <p className="font-bold text-lg">Invitation Declined</p>
                            <p className="text-sm text-muted-foreground">You can now close this window.</p>
                        </div>
                    )}
                </CardContent>

                {!result && (
                    <CardFooter className="flex flex-col gap-2 border-t pt-6">
                        <Button
                            className="w-full gap-2 h-11"
                            onClick={() => handleAction("accept")}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Accept Invitation
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-destructive"
                            onClick={() => handleAction("decline")}
                            disabled={isPending}
                        >
                            Decline
                        </Button>
                    </CardFooter>
                )}

                {result === "declined" && (
                    <CardFooter className="border-t pt-6">
                        <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                            Return Home
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}