import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/livemap", label: "Live Map", live: true },
  { to: "/news", label: "News" },
  { to: "/detection", label: "Detection" },
  { to: "/forecast", label: "Forecast" },
  { to: "/sources", label: "Sources" },
];

export default function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-8">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0f4c5c] text-[#2DD4BF] ring-1 ring-[#2DD4BF]/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 4.5h.01M12 3c-1.2 0-2.4.2-3.5.6a19.7 19.7 0 0 0-6 3.6c0 6.6 2.3 12.8 6.2 16.8 1.4 1.4 3.4 2 5.3 2s3.9-.6 5.3-2c3.9-4 6.2-10.2 6.2-16.8a19.7 19.7 0 0 0-6-3.6A15.6 15.6 0 0 0 12 3Z" />
            </svg>
          </span>
          <span className="font-bold text-xl tracking-tight">Astra</span>
        </NavLink>

        <ul className="flex flex-wrap items-center justify-end gap-x-2 sm:gap-x-4">
          {links.map(({ to, label, live }) => (
            <li key={to}>
              <NavLink to={to}>
                {({ isActive }) => {
                  const isHome = label === "Home";
                  
                  return (
                    <span
                      className={[
                        "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all rounded-full",
                        isActive && isHome
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:text-white hover:bg-white/5",
                        isActive && !isHome
                          ? "text-white" : ""
                      ].join(" ")}
                    >
                      {label}
                      {live && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
                      )}
                    </span>
                  );
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
