import { useState } from "react";
import "./App.css";

function App() {
  const [spinning, setSpinning] = useState(false);

  const handleLogoClick = () => {
    if (!spinning) setSpinning(true);
  };

  return (
    <>
      <button
        type="button"
        className={`logoContainer${spinning ? " isSpinning" : ""}`}
        aria-label="Spin Tetrum logo"
        disabled={spinning}
        onClick={handleLogoClick}
      >
        <img
          src="/tetrum.svg"
          alt="Tetrum Logo"
          className="tetrumLogo"
          draggable="false"
          onAnimationEnd={() => setSpinning(false)}
        />
      </button>
      <h1 className="header">Tetrum</h1>
      <h3 className="subheader">under construction</h3>
    </>
  );
}

export default App;
