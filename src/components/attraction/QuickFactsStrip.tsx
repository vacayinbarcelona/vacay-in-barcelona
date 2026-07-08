import { IconColumn, IconLandmark, IconUsers, IconCameraIcon } from '@/components/ui/Icons';

const ICON_MAP = {
  column: IconColumn,
  landmark: IconLandmark,
  people: IconUsers,
  camera: IconCameraIcon
} as const;

export type QuickFactData = { icon: string; title: string; subtitle: string };

export function QuickFactsStrip({ facts }: { facts: QuickFactData[] }) {
  if (facts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 -mt-6 sm:-mt-8 relative z-10 mb-10">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {facts.map((fact, i) => {
          const Icon = ICON_MAP[fact.icon as keyof typeof ICON_MAP] ?? IconLandmark;
          return (
            <div key={i} className="flex items-center gap-3 py-2 sm:py-0 sm:px-4 first:sm:pl-0">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-gray-900 text-sm font-semibold truncate">{fact.title}</p>
                <p className="text-gray-500 text-xs truncate">{fact.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
