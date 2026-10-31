import { ImportPage } from './pages/ImportPage';
import { LibraryPage } from './pages/LibraryPage';
import { PlacesPage } from './pages/PlacesPage';
import { PoseDetailPage } from './pages/PoseDetailPage';
import { SuggestPage } from './pages/SuggestPage';
import { navigate, useRoute } from './lib/router';

const TABS = [
  { path: '/', label: 'Gợi ý', icon: '✨' },
  { path: '/library', label: 'Thư viện', icon: '🖼️' },
  { path: '/import', label: 'Thêm', icon: '➕' },
  { path: '/places', label: 'Địa điểm', icon: '📍' },
];

export default function App() {
  const route = useRoute();
  const { path } = route;

  let page;
  if (path.startsWith('/pose/')) page = <PoseDetailPage key={path} id={decodeURIComponent(path.slice(6))} />;
  else if (path === '/library') page = <LibraryPage key={route.query.toString()} route={route} />;
  else if (path === '/import') page = <ImportPage key={route.query.toString()} route={route} />;
  else if (path === '/places') page = <PlacesPage />;
  else page = <SuggestPage />;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <main className="pb-24">{page}</main>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-neutral-900 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map((t) => {
            const active = t.path === '/' ? path === '/' : path.startsWith(t.path);
            return (
              <button
                key={t.path}
                type="button"
                onClick={() => navigate(t.path)}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? 'text-yellow-400' : 'text-neutral-500'}`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
