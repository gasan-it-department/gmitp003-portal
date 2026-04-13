import { useEffect, useState, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { viewAnnouncement } from "@/db/statements/announcement";
import moment from "moment";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// Icons
import {
  User,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Play,
  Pause,
} from "lucide-react";

// API
import { publicAnnouncement } from "@/db/statements/announcement";

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
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.8,
    triggerOnce: true,
  });

  const nav = useNavigate();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useInfiniteQuery<ListProps>({
      queryKey: ["announcements", lineId],
      queryFn: ({ pageParam }) =>
        publicAnnouncement(token, lineId, pageParam as string | null, "5"),
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
            return 0;
          }
          return nextIndex;
        });
      }, 5000);

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
      const isThirdAnnouncement = (currentAnnouncementIndex + 1) % 3 === 0;
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
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    setAutoplayEnabled(false);
    setTimeout(() => setAutoplayEnabled(true), 10000);
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
    setTimeout(() => setAutoplayEnabled(true), 10000);
  };

  const isNearEnd = currentIndex >= allAnnouncements.length - 1;
  const shouldAttachRef = (index: number) => (index + 1) % 3 === 0;

  const viewAnnouncementData = useMutation({
    mutationFn: (id: string) => viewAnnouncement(token, id, userId),
    onSuccess: (_, id) => {
      nav(`announcement/${id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading && allAnnouncements.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (allAnnouncements.length === 0 && !isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Megaphone className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No Announcements
            </h3>
            <p className="text-sm text-gray-500">
              There are no announcements to display at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Announcements
            </h2>
            <p className="text-xs text-gray-500">
              {currentIndex + 1} of {allAnnouncements.length}
              {hasNextPage && " • More available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Autoplay Toggle */}
          <button
            onClick={() => setAutoplayEnabled(!autoplayEnabled)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              autoplayEnabled
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {autoplayEnabled ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
            {autoplayEnabled ? "Autoplay On" : "Autoplay Off"}
          </button>

          {/* Loading indicator */}
          {isFetchingNextPage && (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span className="text-xs text-blue-500">Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20
            p-2 rounded-full bg-white shadow-md border hover:bg-gray-50 
            disabled:opacity-30 disabled:cursor-not-allowed transition-all
            hidden md:block"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= allAnnouncements.length - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20
            p-2 rounded-full bg-white shadow-md border hover:bg-gray-50 
            disabled:opacity-30 disabled:cursor-not-allowed transition-all
            hidden md:block"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Carousel Container */}
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {allAnnouncements.map((announcement, index) => (
              <div key={announcement.id} className="w-full flex-shrink-0 px-1">
                <Card
                  className={`border shadow-sm overflow-hidden ${
                    shouldAttachRef(index)
                      ? "border-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  {/* 3rd Announcement Badge */}
                  {shouldAttachRef(index) && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                        Featured
                        {hasNextPage && index === currentIndex && (
                          <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />
                        )}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 pr-16">
                      {announcement.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>
                          {announcement.author?.username || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                      {announcement.content}
                    </p>

                    {/* View Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          viewAnnouncementData.mutateAsync(announcement.id)
                        }
                        className="gap-1.5 text-xs h-8 px-3"
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>

                  {/* Attach ref for infinite scroll */}
                  {shouldAttachRef(index) && (
                    <div
                      ref={index === currentIndex ? ref : undefined}
                      className="h-0"
                    />
                  )}

                  {/* Loading overlay for fetching next page */}
                  {isNearEnd &&
                    isFetchingNextPage &&
                    index === allAnnouncements.length - 1 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            Loading more...
                          </p>
                        </div>
                      </div>
                    )}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {allAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setAutoplayEnabled(false);
                setTimeout(() => setAutoplayEnabled(true), 10000);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-blue-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
          {hasNextPage && (
            <div className="flex items-center gap-1 ml-2">
              <div className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-xs text-gray-400">Loading on scroll</span>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center justify-between gap-3 mt-4 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= allAnnouncements.length - 1}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementList;
