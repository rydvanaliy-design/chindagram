"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

// Renders a post's media: single image, swipeable multi-image carousel, or video.
export default function PostMedia({ media }) {
  const [i, setI] = useState(0);
  if (!media || media.length === 0) return null;

  const current = media[i];
  const isVideo = current.type === "VIDEO";

  return (
    <div className="relative bg-black">
      {isVideo ? (
        <video src={current.url} controls playsInline loop className="mx-auto max-h-[72vh] w-full bg-black" />
      ) : (
        <img src={current.url} alt="" className="mx-auto max-h-[72vh] w-full bg-black object-contain" />
      )}

      {media.length > 1 && (
        <>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} aria-label="Previous"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-gray-800 shadow">
              <ChevronLeft />
            </button>
          )}
          {i < media.length - 1 && (
            <button onClick={() => setI(i + 1)} aria-label="Next"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-gray-800 shadow">
              <ChevronRight />
            </button>
          )}
          <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
            {i + 1}/{media.length}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((_, d) => (
              <span key={d} className={`h-1.5 w-1.5 rounded-full ${d === i ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
