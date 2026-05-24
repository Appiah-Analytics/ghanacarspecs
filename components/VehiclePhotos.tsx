import type { VehiclePhoto } from "@prisma/client";
import { normalizeDemoPhotoSrc } from "@/lib/demo-photo-urls";
import { formatPhotoSource } from "@/lib/photo-source";

function formatTakenAt(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type Props = {
  photos?: VehiclePhoto[] | null;
};

export function VehiclePhotos({ photos }: Props) {
  const items = photos ?? [];

  return (
    <section className="report-section" aria-labelledby="photos-heading">
      <h3 id="photos-heading" className="report-section-title">
        Visual evidence
      </h3>
      <p className="report-section-lead">
        Sample photos linked to this local GhanaCarSpecs record. These are demonstration placeholders only — not
        DVLA, police, insurer, or other official Ghana evidence.
      </p>

      {items.length === 0 ? (
        <p className="photo-empty" role="status">
          No GhanaCarSpecs photos are available for this vehicle yet.
        </p>
      ) : (
        <ul className="photo-grid">
          {items.map((photo) => {
            const taken = formatTakenAt(photo.takenAt);
            return (
              <li key={photo.id} className="photo-card">
                <div className="photo-thumb-wrap">
                  <img
                    src={normalizeDemoPhotoSrc(photo.url)}
                    alt={photo.caption}
                    className="photo-thumb"
                    width={640}
                    height={400}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="photo-card-body">
                  <p className="photo-caption">{photo.caption}</p>
                  <p className="photo-source">{formatPhotoSource(photo.sourceType, photo.sourceLabel)}</p>
                  {taken ? <p className="photo-meta">Taken {taken}</p> : null}
                  <p className="photo-demo-tag">Sample / demo visual evidence</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Shown on external NHTSA decode pages — no local photo gallery. */
export function ExternalPhotosNotice() {
  return (
    <section className="report-section photo-external-notice" aria-labelledby="photos-external-heading">
      <h3 id="photos-external-heading" className="report-section-title">
        Visual evidence
      </h3>
      <p className="photo-empty" role="status">
        No GhanaCarSpecs photos are available for this vehicle. This page shows an external manufacturer decode (NHTSA
        vPIC) only — not local GhanaCarSpecs visual evidence.
      </p>
    </section>
  );
}
