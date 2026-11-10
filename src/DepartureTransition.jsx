import { useLayoutEffect, useRef } from "react";

export default function DepartureTransition({ departure }) {
  const overlayRef = useRef(null);
  const logoRef = useRef(null);
  const imageRef = useRef(null);
  const blackoutRef = useRef(null);
  const backdropRef = useRef(null);

  useLayoutEffect(() => {
    const animations = [];
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
    };
    window.addEventListener("pagehide", cancel);
    const startTime = document.timeline.currentTime;
    const animate = (element, frames, options) => {
      const animation = element.animate(frames, { fill: "forwards", ...options });
      if (startTime !== null) animation.startTime = startTime;
      animations.push(animation);
      return animation;
    };
    const navigate = () => window.location.assign(departure.href);

    async function run() {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await animate(blackoutRef.current, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 150,
          }).finished;
        } else {
          const { rect, angle } = departure;
          const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
          const dy = window.innerHeight / 2 - (rect.top + rect.height / 2);
          const centered = `translate(${dx}px, ${dy}px)`;

          const centerDuration = 550;
          const spinDuration = 900;
          const zoomDelay = centerDuration + spinDuration;
          const zoomDuration = 1200;

          // All phases share one timeline, without JavaScript handoffs between them.
          animate(
            logoRef.current,
            [{ transform: "translate(0, 0)" }, { transform: centered }],
            { duration: centerDuration, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
          );
          animate(
            imageRef.current,
            [
              { transform: `rotate(${angle}deg)` },
              { transform: `rotate(${angle + 540}deg)` },
            ],
            {
              delay: centerDuration,
              duration: spinDuration,
              easing: "cubic-bezier(0.55, 0, 0.8, 0.67)",
            },
          );

          // Squared progress gives exponential growth zero initial velocity.
          // Dense samples keep interpolation smooth on high-refresh displays.
          const scale = Math.max(
            1,
            Math.hypot(window.innerWidth, window.innerHeight) / (rect.width * 0.04),
          );
          const zoomFrames = Array.from({ length: 121 }, (_, index) => {
            const progress = index / 120;
            return {
              offset: progress,
              transform: `${centered} scale(${Math.exp(Math.log(scale) * progress ** 2)})`,
            };
          });
          const zoomTiming = {
            delay: zoomDelay,
            duration: zoomDuration,
            easing: "linear",
          };
          animate(logoRef.current, zoomFrames, zoomTiming);
          animate(
            imageRef.current,
            [
              { transform: `rotate(${angle + 540}deg)` },
              // Match the angular speed at the end of the spin-up phase.
              { transform: `rotate(${angle + 1728}deg)` },
            ],
            zoomTiming,
          );
          animate(backdropRef.current, [{ opacity: 0 }, { opacity: 1 }], zoomTiming);
          animate(
            blackoutRef.current,
            [{ opacity: 0, offset: 0.9 }, { opacity: 1 }],
            zoomTiming,
          );
          await Promise.all(animations.map((animation) => animation.finished));
        }
        if (!cancelled) navigate();
      } catch {
        // Unsupported animation APIs must never prevent the link from working.
        if (!cancelled) navigate();
      }
    }

    run();
    return () => {
      window.removeEventListener("pagehide", cancel);
      cancel();
    };
  }, [departure]);

  return (
    <div ref={overlayRef} className="departureOverlay" aria-hidden="true">
      <div ref={backdropRef} className="departureBackdrop" />
      <div
        ref={logoRef}
        className="departureLogo"
        style={{
          left: departure.rect.left,
          top: departure.rect.top,
          width: departure.rect.width,
          height: departure.rect.height,
        }}
      >
        <img
          ref={imageRef}
          src={`${import.meta.env.BASE_URL}tetrum.svg`}
          alt=""
          style={{ transform: `rotate(${departure.angle}deg)` }}
        />
      </div>
      <div ref={blackoutRef} className="departureBlackout" />
    </div>
  );
}
