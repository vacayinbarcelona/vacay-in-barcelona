import Image from 'next/image';

type GalleryImage = { url: string; altText: string };

// 5-photo hero grid, matching the approved Sagrada Família layout. When an
// attraction only has one or two real photos in the database so far, the
// lead photo is reused to fill the remaining cells rather than falling back
// to a placeholder — every image on the page stays a real photo.
export function Gallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;

  const main = images[0];
  const rest = images.slice(1, 5);
  const padCount = Math.max(0, 4 - rest.length);

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
      <div className="col-span-4 row-span-2 sm:col-span-2 relative">
        <Image src={main.url} alt={main.altText} fill priority className="object-cover" sizes="(min-width: 640px) 50vw, 100vw" />
      </div>
      {rest.map((img, i) => (
        <div key={`gallery-${i}`} className="hidden sm:block relative">
          <Image src={img.url} alt={img.altText} fill className="object-cover" sizes="25vw" />
        </div>
      ))}
      {Array.from({ length: padCount }).map((_, i) => (
        <div key={`gallery-pad-${i}`} className="hidden sm:block relative">
          <Image src={main.url} alt={main.altText} fill className="object-cover" sizes="25vw" />
        </div>
      ))}
    </div>
  );
}
