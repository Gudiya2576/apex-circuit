import { MenuTab } from '../game/types';

interface TopBarProps {
  activeTab: MenuTab;
  onSelectTab: (tab: MenuTab) => void;
  onStartRace: () => void;
}

const NAV_ITEMS: Array<{ id: MenuTab; label: string }> = [
  { id: 'RACE', label: 'Race Setup' },
  { id: 'GARAGE', label: 'Garage' },
  { id: 'TRACKS', label: 'Tracks' },
  { id: 'AUDIO', label: 'Audio & Controls' },
];

export function TopBar({ activeTab, onSelectTab, onStartRace }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0D12]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onSelectTab('RACE')}
          className="font-display text-xl font-bold tracking-wider text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
        >
          APEX CIRCUIT
        </button>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main menu sections">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-red-500" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartRace}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 active:bg-red-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            Start Race
          </button>
        </div>
      </div>

      {/* Mobile tab strip */}
      <nav className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-2" aria-label="Mobile menu sections">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
