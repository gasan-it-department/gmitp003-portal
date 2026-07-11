import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import axios from "@/db/axios";
import { formatDate } from "@/utils/date";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  UserPlus,
  Search,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";

interface Props {
  token: string;
  lineId: string;
  userId: string; // the current (managing) user's User.id
  /** Override the API endpoints — defaults to the Pharmacy module's. Lets
   *  other modules (e.g. Documents) reuse this exact grant/revoke UI. */
  endpoints?: { list: string; candidates: string; mutate: string };
  /** Override the explainer copy — defaults to the Pharmacy wording. */
  copy?: { heading: string; body: string; emptyBody: string };
}

const PHARMACY_ENDPOINTS = {
  list: "/medicine/mobile-access",
  candidates: "/medicine/mobile-access/candidates",
  mutate: "/medicine/mobile-access",
};

const PHARMACY_COPY = {
  heading: "Who can use the mobile Pharmacy app",
  body:
    "Only the users listed below can scan, add stock, and sync medicine data from the mobile app. Everyone else is blocked — this protects your medicine records from unauthorized changes. Add or remove access anytime; you can add yourself too.",
  emptyBody:
    "Until you add someone, no one can use the mobile pharmacy scanner or add stock from a phone.",
};

interface AccessRow {
  id: string;
  userId: string;
  name: string;
  username: string;
  department: string | null;
  grantedAt: string;
  grantedBy: string | null;
}
interface Candidate {
  id: string;
  name: string;
  username: string;
  department: string | null;
}

const MobileAccess = ({ token, lineId, userId, endpoints, copy }: Props) => {
  const ep = endpoints ?? PHARMACY_ENDPOINTS;
  const text2 = copy ?? PHARMACY_COPY;
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);
  const [adding, setAdding] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const { data: granted = [], isFetching } = useQuery<AccessRow[]>({
    queryKey: ["mobile-access", ep.list, lineId],
    queryFn: async () =>
      (
        await axios.get(ep.list, {
          params: { lineId },
          headers,
        })
      ).data.list ?? [],
    enabled: !!lineId && !!token,
    refetchOnWindowFocus: false,
  });

  const { data: candidates = [], isFetching: loadingCandidates } = useQuery<
    Candidate[]
  >({
    queryKey: ["mobile-access-candidates", ep.candidates, lineId, query],
    queryFn: async () =>
      (
        await axios.get(ep.candidates, {
          params: { lineId, query },
          headers,
        })
      ).data.list ?? [],
    enabled: adding && !!lineId && !!token,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["mobile-access", ep.list, lineId] });
    qc.invalidateQueries({
      queryKey: ["mobile-access-candidates", ep.candidates, lineId],
    });
  };

  const grant = useMutation({
    mutationFn: (uid: string) =>
      axios.post(
        ep.mutate,
        { lineId, userId: uid, grantedById: userId },
        { headers },
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Mobile access granted");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to grant access"),
  });

  const revoke = useMutation({
    mutationFn: (uid: string) =>
      axios.delete(ep.mutate, {
        data: { lineId, userId: uid, revokedById: userId },
        headers,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Mobile access removed");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to remove access"),
  });

  const selfGranted = granted.some((g) => g.userId === userId);

  return (
    <div className="p-3 space-y-3 max-w-3xl mx-auto w-full">
      {/* Explainer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-900">
              {text2.heading}
            </p>
            <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
              {text2.body}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-gray-800">
            Authorized users
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {granted.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {!selfGranted && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              disabled={grant.isPending}
              onClick={() => grant.mutate(userId)}
            >
              <UserCheck className="h-3 w-3" />
              Add myself
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={() => setAdding((v) => !v)}
          >
            <UserPlus className="h-3 w-3" />
            {adding ? "Close" : "Add user"}
          </Button>
        </div>
      </div>

      {/* Add-user panel */}
      {adding && (
        <div className="border rounded-lg bg-white p-2.5 space-y-2">
          <InputGroup className="bg-white">
            <InputGroupAddon>
              <Search className="h-3 w-3 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              placeholder="Search staff by name or username..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-7 text-[11px]"
            />
          </InputGroup>
          <div className="max-h-56 overflow-auto divide-y">
            {loadingCandidates ? (
              <div className="flex items-center justify-center gap-1.5 py-6 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[10px]">Searching...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-gray-400">
                {query
                  ? "No matching staff (or already added)."
                  : "Type to search staff in this line."}
              </div>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      @{c.username}
                      {c.department ? ` · ${c.department}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1 flex-shrink-0"
                    disabled={grant.isPending}
                    onClick={() => grant.mutate(c.id)}
                  >
                    <UserPlus className="h-3 w-3" />
                    Grant
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Granted list */}
      <div className="border rounded-lg bg-white overflow-hidden">
        {isFetching && granted.length === 0 ? (
          <div className="flex items-center justify-center gap-1.5 py-10 text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[10px]">Loading...</span>
          </div>
        ) : granted.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-700">
              No one has mobile access yet
            </p>
            <p className="text-[10px] text-gray-500 max-w-[280px]">
              {text2.emptyBody}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {granted.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-gray-800 truncate">
                      {g.name}
                    </p>
                    {g.userId === userId && (
                      <Badge className="text-[9px] px-1 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">
                    @{g.username}
                    {g.department ? ` · ${g.department}` : ""} · added{" "}
                    {formatDate(g.grantedAt)}
                    {g.grantedBy ? ` by ${g.grantedBy}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(g.userId)}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAccess;
