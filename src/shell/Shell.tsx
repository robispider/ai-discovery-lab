import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { IconRail } from './IconRail';
import './shell.css';

/** The frame that stays on screen: top bar, icon rail, and the routed page beside them. */
export function Shell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // A new page starts at the top; the shell itself never scrolls away.
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [pathname]);

  return (
    <div className="shell">
      <TopBar />
      <IconRail />
      <main className="shell-main" id="main" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  );
}
