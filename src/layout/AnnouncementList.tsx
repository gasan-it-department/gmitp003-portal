import { useEffect, useState, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { viewAnnouncement } from "@/db/statements/announcement";
import moment from "moment";

// Components
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
// Icons
import {
  User,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// API
import { announcements } from "@/db/statements/announcement";

// Types
import type { Announcement } from "@/interface/data";

interface Props {
  lineId: string;
  token: string;
  userId: string;
}

interface ListProps {
  list: Announcement[];
  lastCursor: string | null;
  hasMore: boolean;
}

const AnnouncementList = ({ lineId, token, userId }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastFetchedTriggerIndex, setLastFetchedTriggerIndex] = useState<
    number | null
  >(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.8,
    triggerOnce: true,
  });

  const nav = useNavigate();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useInfiniteQuery<ListProps>({
      queryKey: ["announcements", lineId],
      queryFn: ({ pageParam }) =>
        announcements(token, lineId, pageParam as string | null, "5", ""),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });

  const allAnnouncements = data?.pages.flatMap((page) => page.list) || [];

  // Autoplay functionality
  useEffect(() => {
    if (autoplayEnabled && allAnnouncements.length > 1) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= allAnnouncements.length) {
            return 0; // Loop back to start
          }
          return nextIndex;
        });
      }, 5000); // Change announcement every 5 seconds

      return () => {
        if (autoplayRef.current) {
          clearInterval(autoplayRef.current);
        }
      };
    }
  }, [autoplayEnabled, allAnnouncements.length]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      const currentAnnouncementIndex = currentIndex;

      // Check if current announcement is a 3rd item (index is 0-based, so indices 2, 5, 8, etc.)
      const isThirdAnnouncement = (currentAnnouncementIndex + 1) % 3 === 0;

      // Check if we haven't already fetched for this index
      const hasNotFetchedForThisIndex =
        lastFetchedTriggerIndex !== currentAnnouncementIndex;

      if (isThirdAnnouncement && hasNotFetchedForThisIndex) {
        fetchNextPage();
        setLastFetchedTriggerIndex(currentAnnouncementIndex);
      }
    }
  }, [
    inView,
    currentIndex,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    lastFetchedTriggerIndex,
  ]);

  const formatDate = (dateString: string) => {
    return moment(dateString).fromNow();
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    // Reset autoplay timer
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    setAutoplayEnabled(false);
    setTimeout(() => setAutoplayEnabled(true), 10000); // Resume autoplay after 10s
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return Math.min(allAnnouncements.length - 1, nextIndex);
    });
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    setAutoplayEnabled(false);
    setTimeout(() => setAutoplayEnabled(true), 10000); // Resume autoplay after 10s
  };

  const isNearEnd = currentIndex >= allAnnouncements.length - 1;

  const shouldAttachRef = (index: number) => {
    return (index + 1) % 3 === 0;
  };

  const viewAnnouncementData = useMutation({
    mutationFn: (id: string) => viewAnnouncement(token, id, userId),
    onSuccess: (_, id) => {
      nav(`announcement/${id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {currentIndex + 1} of {allAnnouncements.length}{" "}
            announcements
            {hasNextPage && " • More available"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Autoplay toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Autoplay:</span>
            <button
              onClick={() => setAutoplayEnabled(!autoplayEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoplayEnabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoplayEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Loading indicators */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-500">Fetching more...</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="relative">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 
              p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border hover:bg-white 
              disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {allAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="p-1">
                    <div
                      className={`
                        relative rounded-2xl border bg-white p-6 md:p-8 shadow-xl 
                        min-h-[350px] md:min-h-[200px] flex flex-col
                        ${
                          isNearEnd && isFetchingNextPage
                            ? "border-blue-200"
                            : "border-gray-200"
                        }
                      `}
                    >
                      {/* 3rd Announcement Indicator */}
                      {shouldAttachRef(index) && (
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            3rd Announcement
                            {hasNextPage && (
                              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                            )}
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="mt-10 mb-6">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                          {announcement.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {announcement.author?.username ||
                                "Unknown Author"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow mb-6 overflow-y-auto">
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed">
                            {announcement.content}
                          </p>
                        </div>
                      </div>

                      {/* Attach ref to every 3rd announcement for triggering fetch */}
                      {shouldAttachRef(index) && (
                        <div
                          ref={index === currentIndex ? ref : undefined}
                          className="absolute bottom-2 w-full h-2"
                        />
                      )}

                      {/* Loading overlay when fetching */}
                      {isNearEnd &&
                        isFetchingNextPage &&
                        index === allAnnouncements.length - 1 && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">
                                Loading more announcements...
                              </p>
                            </div>
                          </div>
                        )}
                      <div className=" w-full flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            viewAnnouncementData.mutateAsync(announcement.id);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading skeleton for initial load */}
              {isLoading && (
                <div className="w-full flex-shrink-0 px-4">
                  <div className="p-1">
                    <div className="rounded-2xl border bg-white p-8 shadow-lg min-h-[400px]">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-100 rounded"></div>
                          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= allAnnouncements.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20
              p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border hover:bg-white 
              disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            {allAnnouncements.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setAutoplayEnabled(false);
                  setTimeout(() => setAutoplayEnabled(true), 10000);
                }}
                className={`
                  h-3 w-3 rounded-full transition-all relative
                  ${
                    index === currentIndex
                      ? "bg-blue-600 scale-125 ring-2 ring-blue-300"
                      : index < currentIndex
                      ? "bg-gray-400"
                      : "bg-gray-300 hover:bg-gray-400"
                  }
                  ${(index + 1) % 3 === 0 ? "ring-1 ring-blue-200" : ""}
                `}
                aria-label={`Go to announcement ${index + 1}`}
              ></button>
            ))}
            {hasNextPage && (
              <div className="flex items-center gap-2 ml-2">
                <div className="h-3 w-3 rounded-full bg-blue-200 animate-pulse"></div>
                <span className="text-xs text-blue-600">
                  More loading on 3rd view
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementList;
