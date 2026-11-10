import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import DepartureTransition from "./DepartureTransition.jsx";
import "./App.css";

function vibrateOnTap() {
  if (window.matchMedia("(pointer: coarse)").matches) {
    navigator.vibrate?.(15);
  }
}

function App() {
  const [spinning, setSpinning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItemsRef = useRef(null);
  const logoRef = useRef(null);
  const departingRef = useRef(false);
  const [departure, setDeparture] = useState(null);

  useEffect(() => {
    const resetDeparture = () => {
      // Clear the transition before the browser stores or restores this document.
      flushSync(() => {
        departingRef.current = false;
        setDeparture(null);
        setSpinning(false);
      });
    };
    const handlePageShow = (event) => {
      if (event.persisted) resetDeparture();
    };
    window.addEventListener("pagehide", resetDeparture);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pagehide", resetDeparture);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleLinkClick = (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      (link.target && link.target !== "_self") || link.hasAttribute("download")
    ) return;

    const destination = new URL(link.href);
    if (
      !["http:", "https:"].includes(destination.protocol) ||
      (destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search && destination.hash)
    ) return;

    event.preventDefault();
    if (departingRef.current) return;
    departingRef.current = true;
    const logo = logoRef.current;
    const rect = logo.parentElement.getBoundingClientRect();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(logo).transform);
    const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    setDeparture({ href: destination.href, rect, angle });
    setSpinning(false);
  };

  useLayoutEffect(() => {
    const items = menuItemsRef.current;
    const updateWidth = () => {
      items.parentElement.style.setProperty(
        "--menu-width",
        `${Math.ceil(items.getBoundingClientRect().width) + 76}px`,
      );
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(items);
    return () => observer.disconnect();
  }, []);

  const handleMenuClick = () => {
    setMenuOpen((open) => !open);
    vibrateOnTap();
  };

  const handleLogoClick = () => {
    if (spinning) return;
    setSpinning(true);
    vibrateOnTap();
  };

  return (
    <div className={`site${departure ? " isDeparting" : ""}`}>
      <div
        className={`menuBar${menuOpen ? " isOpen" : ""}`}
        onClick={handleLinkClick}
        inert={!!departure}
      >
        <button
          type="button"
          className="menuBtn"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="menu-items"
          onClick={handleMenuClick}
        >
          <span className="menuIcon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div
          ref={menuItemsRef}
          id="menu-items"
          className="menuItems"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          {[
            <p key="contact">
              Contact us:{" "}
              <a href="mailto:contact@tetrum.dev" className="menuLink">
                contact@tetrum.dev
              </a>
            </p>,
            <a key="github" href="https://github.com/tetrumdev" className="menuLink">
              GitHub
            </a>,
            <a key="ambra" href="https://github.com/tetrumdev/ambra" className="menuLink">
              AMBRA
            </a>,
          ].map((label, index) => (
            <div
              key={label.key}
              className="menuItem"
              style={{ "--item-index": index }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={`logoContainer${spinning ? " isSpinning" : ""}`}
        aria-label="Spin Tetrum logo"
        disabled={spinning || !!departure}
        onClick={handleLogoClick}
      >
        <img
          ref={logoRef}
          src={`${import.meta.env.BASE_URL}tetrum.svg`}
          alt="Tetrum Logo"
          className="tetrumLogo"
          draggable="false"
          onAnimationEnd={() => setSpinning(false)}
        />
      </button>
      <h1 className="header">Tetrum</h1>
      {departure && <DepartureTransition departure={departure} />}
    </div>
  );
}

export default App;
