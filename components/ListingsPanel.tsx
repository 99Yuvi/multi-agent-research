"use client";

import { useResearchStore } from "@/store/researchStore";
import { Phone, MapPin, Star, IndianRupee, ExternalLink, ImageOff, CheckCircle } from "lucide-react";
import { useState } from "react";

function ImageWithFallback({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="h-44 w-full bg-secondary flex flex-col items-center justify-center gap-2">
        <ImageOff className="h-7 w-7 text-muted-foreground/30" />
        <span className="text-xs text-muted-foreground/50">No image</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-44 w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function ListingsPanel() {
  const { listings } = useResearchStore();

  if (!listings || listings.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} found
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Extracted from web · Verify details before booking
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-success/20 bg-success/10 text-success font-medium">
            <CheckCircle className="h-3 w-3" />
            {listings.filter((l) => l.phone).length} with phone
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background overflow-hidden flex flex-col"
          >
            {/* Image */}
            <ImageWithFallback src={listing.image} alt={listing.name} />

            {/* Content */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {listing.name}
              </p>

              {/* Price */}
              {listing.price && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                  <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                  {listing.price.replace("₹", "").replace("Rs", "").trim()}
                </span>
              )}

              {/* Rating */}
              {listing.rating && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  {listing.rating}
                </span>
              )}

              {/* Address */}
              {listing.address && (
                <span className="inline-flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{listing.address}</span>
                </span>
              )}

              {/* Notes */}
              {listing.notes && listing.notes !== "—" && (
                <p className="text-xs text-muted-foreground line-clamp-2">{listing.notes}</p>
              )}

              {/* Footer: phone + website */}
              <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-border">
                {listing.phone ? (
                  <a
                    href={`tel:${listing.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {listing.phone}
                  </a>
                ) : listing.website ? (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    Book Online
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Contact not available</span>
                )}

                {listing.website && listing.phone && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
