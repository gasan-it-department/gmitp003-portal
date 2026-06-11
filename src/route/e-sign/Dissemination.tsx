import { useState } from "react";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
import { resetRoomMembership } from "@/db/statements/document";
//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import DisseminationInbox from "@/layout/e-sign/DisseminationInbox";
import DisseminationOutbox from "@/layout/e-sign/DisseminationOutbox";
//
import {
  Send,
  Inbox,
  ExternalLink,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const Dissemination = () => {
  const [params, setParams] = useSearchParams({ tab: "outbox" });
  const { userId, token } = useAuth();
  const { room } = useRoom();
  const qc = useQueryClient();

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const currentTab = params.get("tab") || "outbox";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetRoomMembership(token as string, userId as string);
      await qc.invalidateQueries({
        queryKey: ["signatory-registry", userId],
      });
      await qc.invalidateQueries({ queryKey: ["dissemination"] });
      setResetOpen(false);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Reset failed. Check the API logs.",
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header strip */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
            <Send className="h-3.5 w-3.5 text-gray-700" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-gray-900">
              Document Dissemination
            </div>
            <div className="text-[10px] text-gray-500">
              Route documents and request e-signatures across rooms
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {room?.code ? (
            <Badge
              variant="outline"
              className="text-[10px] h-6 px-2 font-mono"
              title={room.id}
            >
              From: {room.code} · {room.id?.slice(0, 6)}
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px]"
            onClick={() => setResetOpen(true)}
            title="If you see another user's outbox here, your account is sharing their room. Reset to mint a fresh one."
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset my room
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          defaultValue={currentTab}
          className="h-full flex flex-col"
          onValueChange={(e) => handleChangeParams("tab", e)}
        >
          <div className="px-3 pt-2 border-b bg-white">
            <TabsList className="bg-gray-100 p-0.5 h-8 w-fit">
              <TabsTrigger
                value="outbox"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-7 px-2.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Outbox</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="inbox"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-7 px-2.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Inbox className="h-3.5 w-3.5" />
                  <span>Inbox</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="outbox" className="h-full m-0">
              <DisseminationOutbox
                userId={userId as string}
                roomId={room?.id as string}
                token={token as string}
                lineId={room?.lineId as string}
              />
            </TabsContent>
            <TabsContent value="inbox" className="h-full m-0">
              <DisseminationInbox
                roomId={room?.id as string}
                token={token as string}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Modal
        title="Reset to a fresh room?"
        onOpen={resetOpen}
        setOnOpen={() => setResetOpen(false)}
        footer={true}
        yesTitle="Reset my room"
        loading={resetting}
        onFunction={handleReset}
        className=""
      >
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-start gap-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              You're currently bound to room{" "}
              <span className="font-mono font-semibold">
                {room?.code} ({room?.id?.slice(0, 8)}…)
              </span>
              . If another user's outbox is showing up here, you're sharing
              their room — this will peel you off and mint a brand new room
              for you.
            </div>
          </div>
          <ul className="text-[11px] text-gray-600 list-disc pl-4 space-y-0.5">
            <li>Your current memberships are deleted.</li>
            <li>A new ReceivingRoom is created from your registration.</li>
            <li>Your existing co-signatories carry over only if they're not already in another room.</li>
            <li>Drafts you started in your old room remain there (they belonged to the old room id).</li>
          </ul>
          {resetting ? (
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Resetting…
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Dissemination;
